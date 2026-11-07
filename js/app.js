/*
 * Formulaire de demande de site en 3 étapes.
 * Aucune dépendance. Les réponses sont gardées en mémoire (et en brouillon local),
 * puis regroupées dans un message WhatsApp à la dernière étape.
 */
(function () {
  "use strict";

  var CONFIG = window.SITE_CONFIG || {};
  var TOTAL_STEPS = 3;

  /* ---------- Icônes ---------- */
  var ICONS = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    menu: '<rect x="5.5" y="3.5" width="13" height="17" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    shield: '<path d="M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    briefcase: '<rect x="3.5" y="7" width="17" height="12" rx="2"/><path d="M9 7V5h6v2M3.5 12h17"/>',
    phone: '<path d="M6.5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7l1.3-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4.5 6a2 2 0 0 1 2-2z"/>',
    plus: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8.5v7M8.5 12h7"/>',
    none: '<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',
    page: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h5"/>',
    camera: '<rect x="3.5" y="6.5" width="17" height="13" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M9 6.5 10 4.5h4l1 2"/>',
    chat: '<path d="M4 12a8 8 0 1 1 3.5 6.6L4 20l1.3-3.6A8 8 0 0 1 4 12z"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5z"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    video: '<rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="m10.5 9.5 4 2.5-4 2.5z"/>'
  };
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

  /* ---------- État ---------- */
  var EMPTY_STATE = {
    firstName: "", business: "", sector: "", sectorOther: "", city: "",
    needs: [], needsOther: "", timeline: "",
    presence: [], presenceOther: "", website: "", notes: ""
  };

  var state = clone(EMPTY_STATE);
  var currentStep = 1;
  var maxStepReached = 1;

  /* ---------- Raccourcis DOM ---------- */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var form = $("#request-form");
  var card = $("#form-card");
  var btnPrev = $("#btn-prev");
  var btnNext = $("#btn-next");
  var btnSend = $("#btn-send");
  var afterSend = $("#after-send");
  var sendStatus = $("#send-status");

  /* ---------- Utilitaires ---------- */
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function labelOf(list, id) {
    var item = (CONFIG[list] || []).filter(function (x) { return x.id === id; })[0];
    return item ? item.label : "";
  }

  function itemOf(list, id) {
    return (CONFIG[list] || []).filter(function (x) { return x.id === id; })[0];
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function svg(name) {
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || "") + "</svg>";
  }

  function trimmed(v) { return (v || "").trim(); }

  /* ---------- Brouillon local ---------- */
  function saveDraft() {
    if (!CONFIG.draftStorageKey) return;
    try {
      localStorage.setItem(CONFIG.draftStorageKey, JSON.stringify({ state: state, step: currentStep, max: maxStepReached }));
    } catch (e) { /* stockage indisponible : on continue sans brouillon */ }
  }

  function loadDraft() {
    if (!CONFIG.draftStorageKey) return;
    try {
      var raw = localStorage.getItem(CONFIG.draftStorageKey);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data && data.state) {
        Object.keys(EMPTY_STATE).forEach(function (k) {
          if (data.state[k] !== undefined) state[k] = data.state[k];
        });
        maxStepReached = Math.min(Math.max(1, data.max || 1), TOTAL_STEPS);
      }
    } catch (e) { /* brouillon illisible : on repart de zéro */ }
  }

  /* ---------- Construction des listes ---------- */
  function fillSelect(select, list) {
    (CONFIG[list] || []).forEach(function (item) {
      var opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = item.label;
      select.appendChild(opt);
    });
  }

  function buildChoices(container, list, group) {
    container.innerHTML = (CONFIG[list] || []).map(function (item) {
      var inputId = group + "-" + item.id;
      return (
        '<label class="choice" for="' + inputId + '">' +
          '<input class="choice-input" type="checkbox" id="' + inputId + '" name="' + group + '" value="' + item.id + '">' +
          '<span class="choice-icon">' + svg(item.icon) + "</span>" +
          '<span class="choice-text">' + escapeHtml(item.label) + "</span>" +
          '<span class="choice-box" aria-hidden="true">' + CHECK + "</span>" +
        "</label>"
      );
    }).join("");
  }

  /* ---------- Synchronisation état <-> champs ---------- */
  function syncFieldsFromState() {
    $$("[data-field]").forEach(function (el) {
      el.value = state[el.dataset.field] || "";
    });
    $$(".choice-input").forEach(function (input) {
      input.checked = state[input.name].indexOf(input.value) !== -1;
    });
    refreshChoiceStyles();
    refreshConditionals();
    refreshSelectPlaceholders();
  }

  function refreshChoiceStyles() {
    $$(".choice-input").forEach(function (input) {
      input.closest(".choice").classList.toggle("is-checked", input.checked);
    });
  }

  function refreshSelectPlaceholders() {
    $$("select").forEach(function (s) { s.classList.toggle("is-placeholder", !s.value); });
  }

  function toggleWrap(id, show) {
    var el = document.getElementById(id);
    if (el) el.hidden = !show;
  }

  function refreshConditionals() {
    toggleWrap("sectorOther-wrap", state.sector === "autre");
    toggleWrap("needsOther-wrap", state.needs.indexOf("autre") !== -1);
    toggleWrap("website-wrap", state.presence.indexOf("site") !== -1);
    toggleWrap("presenceOther-wrap", state.presence.indexOf("autre") !== -1);
  }

  /* ---------- Validation ---------- */
  function validate(step) {
    var e = {};
    if (step === 1) {
      if (!trimmed(state.firstName)) e.firstName = "Indiquez votre prénom.";
      if (!trimmed(state.business)) e.business = "Indiquez le nom de votre activité.";
      if (!state.sector) e.sector = "Choisissez votre secteur d'activité.";
      if (state.sector === "autre" && !trimmed(state.sectorOther)) e.sectorOther = "Précisez votre secteur en quelques mots.";
      if (!trimmed(state.city)) e.city = "Indiquez la ville où vous exercez.";
    }
    if (step === 2) {
      if (!state.needs.length) e.needs = "Sélectionnez au moins un besoin pour continuer.";
      if (state.needs.indexOf("autre") !== -1 && !trimmed(state.needsOther)) e.needsOther = "Décrivez ce besoin en quelques mots.";
      if (!state.timeline) e.timeline = "Choisissez un délai, même approximatif.";
    }
    if (step === 3) {
      if (!state.presence.length) e.presence = "Sélectionnez au moins une réponse.";
      if (state.presence.indexOf("autre") !== -1 && !trimmed(state.presenceOther)) e.presenceOther = "Précisez où l'on vous trouve.";
    }
    return e;
  }

  function clearError(field) {
    var msg = $('[data-error-for="' + field + '"]');
    if (msg) { msg.hidden = true; msg.textContent = ""; }
    var wrap = $('[data-field-wrap="' + field + '"]');
    if (wrap) wrap.classList.remove("has-error");
    var input = $('[data-field="' + field + '"]');
    if (input) input.removeAttribute("aria-invalid");
    var group = $('[data-group="' + field + '"]');
    if (group) group.classList.remove("has-error");
  }

  function showErrors(errors) {
    var first = null;
    Object.keys(errors).forEach(function (field) {
      var msg = $('[data-error-for="' + field + '"]');
      if (msg) { msg.textContent = errors[field]; msg.hidden = false; }
      var wrap = $('[data-field-wrap="' + field + '"]');
      if (wrap) wrap.classList.add("has-error");
      var input = $('[data-field="' + field + '"]');
      if (input) {
        input.setAttribute("aria-invalid", "true");
        if (msg) { msg.id = "err-" + field; input.setAttribute("aria-describedby", msg.id); }
        if (!first) first = input;
      }
      var group = $('[data-group="' + field + '"]');
      if (group) {
        group.classList.add("has-error");
        if (!first) first = group.querySelector(".choice-input");
      }
    });
    if (first) {
      first.focus({ preventScroll: true });
      var target = first.closest(".field, .choices") || first;
      target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
    }
  }

  function clearStepErrors(step) {
    var panel = $('[data-panel="' + step + '"]');
    $$("[data-error-for]", panel).forEach(function (m) { clearError(m.dataset.errorFor); });
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ---------- Navigation ---------- */
  function goTo(step, opts) {
    opts = opts || {};
    currentStep = step;
    if (step > maxStepReached) maxStepReached = step;

    $$(".panel").forEach(function (p) {
      var isCurrent = Number(p.dataset.panel) === step;
      p.hidden = !isCurrent;
      p.classList.remove("is-entering");
      if (isCurrent && !opts.initial) {
        void p.offsetWidth; // relance l'animation
        p.classList.add("is-entering");
      }
    });

    $$(".step").forEach(function (b) {
      var n = Number(b.dataset.step);
      var active = n === step;
      var done = n < step;
      var reachable = !active && n <= maxStepReached;
      b.classList.toggle("is-active", active);
      b.classList.toggle("is-done", done);
      b.classList.toggle("is-reachable", reachable && !done);
      b.disabled = !reachable;
      if (active) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
    });

    var progress = $(".progress");
    $("#progress-fill").style.width = (step / TOTAL_STEPS * 100) + "%";
    progress.setAttribute("aria-valuenow", String(step));
    progress.setAttribute("aria-valuetext", "Étape " + step + " sur " + TOTAL_STEPS);

    btnPrev.hidden = step === 1;
    btnNext.hidden = step === TOTAL_STEPS;
    btnSend.hidden = step !== TOTAL_STEPS;
    if (step !== TOTAL_STEPS) afterSend.hidden = true;

    if (step === TOTAL_STEPS) {
      renderRecap();
      updateSendLink();
    }

    saveDraft();

    if (!opts.initial) {
      var rect = card.getBoundingClientRect();
      if (rect.top < 0 || rect.top > window.innerHeight * 0.4) {
        card.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      }
      var title = $('[data-panel="' + step + '"] .panel-title');
      if (title) title.focus({ preventScroll: true });
    }
  }

  function next() {
    var errors = validate(currentStep);
    clearStepErrors(currentStep);
    if (Object.keys(errors).length) { showErrors(errors); return; }
    if (currentStep < TOTAL_STEPS) goTo(currentStep + 1);
  }

  function prev() {
    if (currentStep > 1) goTo(currentStep - 1);
  }

  /* Aller vers une étape plus loin : chaque étape intermédiaire doit être valide. */
  function jumpTo(target) {
    for (var s = Math.min(currentStep, target); s < target; s++) {
      var errors = validate(s);
      if (Object.keys(errors).length) {
        if (s !== currentStep) goTo(s);
        clearStepErrors(s);
        showErrors(errors);
        return false;
      }
    }
    goTo(target);
    return true;
  }

  /* ---------- Récapitulatif ---------- */
  function sectorText() {
    if (state.sector === "autre") return trimmed(state.sectorOther) || "Autre";
    return labelOf("sectors", state.sector);
  }

  function needsList() {
    return state.needs.map(function (id) {
      if (id === "autre") return trimmed(state.needsOther) ? "Autre : " + trimmed(state.needsOther) : "Autre chose";
      return labelOf("needs", id);
    });
  }

  function presenceList() {
    // Respecte l'ordre de la configuration, pas l'ordre des clics
    return (CONFIG.presence || []).filter(function (p) { return state.presence.indexOf(p.id) !== -1; }).map(function (p) {
      if (p.id === "autre") return trimmed(state.presenceOther) ? "Autre : " + trimmed(state.presenceOther) : "Autre";
      if (p.id === "site" && trimmed(state.website)) return p.short + " (" + trimmed(state.website) + ")";
      return p.short || p.label;
    });
  }

  function orderedNeeds() {
    var order = (CONFIG.needs || []).map(function (n) { return n.id; });
    state.needs.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
  }

  function recapRow(label, valueHtml) {
    return "<dt>" + escapeHtml(label) + "</dt><dd>" + valueHtml + "</dd>";
  }

  function listHtml(items) {
    if (!items.length) return '<span class="recap-empty">Non renseigné</span>';
    if (items.length === 1) return escapeHtml(items[0]);
    return "<ul>" + items.map(function (i) { return "<li>" + escapeHtml(i) + "</li>"; }).join("") + "</ul>";
  }

  function textOrEmpty(v) {
    return trimmed(v) ? escapeHtml(trimmed(v)) : '<span class="recap-empty">Non renseigné</span>';
  }

  function group(title, step, rows) {
    return (
      '<div class="recap-group">' +
        '<div class="recap-group-head">' +
          '<h5 class="recap-group-title">' + escapeHtml(title) + "</h5>" +
          (step ? '<button type="button" class="recap-edit" data-goto="' + step + '">Modifier<span class="visually-hidden"> : ' + escapeHtml(title) + "</span></button>" : "") +
        "</div>" +
        '<dl class="recap-list">' + rows + "</dl>" +
      "</div>"
    );
  }

  function renderRecap() {
    orderedNeeds();
    var html =
      group("Votre activité", 1,
        recapRow("Prénom", textOrEmpty(state.firstName)) +
        recapRow("Activité", textOrEmpty(state.business)) +
        recapRow("Secteur", textOrEmpty(sectorText())) +
        recapRow("Ville", textOrEmpty(state.city))
      ) +
      group("Votre site", 2,
        recapRow("Besoins", listHtml(needsList())) +
        recapRow("Délai souhaité", textOrEmpty(labelOf("timelines", state.timeline)))
      ) +
      group("Aujourd'hui", null,
        recapRow("Présence en ligne", listHtml(presenceList())) +
        recapRow("Informations", textOrEmpty(state.notes))
      );
    $("#recap-body").innerHTML = html;
  }

  /* ---------- Message WhatsApp ---------- */
  function buildMessage() {
    orderedNeeds();
    var lines = [];
    lines.push("Bonjour, je souhaite créer un site internet pour mon activité.");
    lines.push("");
    lines.push("*Mon activité*");
    lines.push("Prénom : " + trimmed(state.firstName));
    lines.push("Activité : " + trimmed(state.business));
    lines.push("Secteur : " + sectorText());
    lines.push("Ville : " + trimmed(state.city));
    lines.push("");
    lines.push("*Ce que doit faire mon site*");
    needsList().forEach(function (n) { lines.push("- " + n); });
    lines.push("Délai souhaité : " + labelOf("timelines", state.timeline));
    lines.push("");
    lines.push("*Ma présence en ligne aujourd'hui*");
    presenceList().forEach(function (p) { lines.push("- " + p); });
    if (trimmed(state.notes)) {
      lines.push("");
      lines.push("*Informations supplémentaires*");
      lines.push(trimmed(state.notes));
    }
    return lines.join("\n");
  }

  function whatsappUrl(message) {
    var number = String(CONFIG.whatsappNumber || "").replace(/\D/g, "");
    var base = number ? "https://wa.me/" + number : "https://wa.me/";
    return base + "?text=" + encodeURIComponent(message);
  }

  function updateSendLink() {
    btnSend.href = whatsappUrl(buildMessage());
  }

  function onSendClick(event) {
    // Toutes les étapes sont revérifiées : une réponse a pu être effacée en revenant en arrière
    for (var s = 1; s <= TOTAL_STEPS; s++) {
      var errors = validate(s);
      if (Object.keys(errors).length) {
        event.preventDefault();
        if (s !== currentStep) goTo(s);
        clearStepErrors(s);
        showErrors(errors);
        return;
      }
    }
    updateSendLink();
    afterSend.hidden = false;
    var hasNumber = String(CONFIG.whatsappNumber || "").replace(/\D/g, "").length > 0;
    sendStatus.classList.toggle("is-warning", !hasNumber);
    sendStatus.textContent = hasNumber
      ? "WhatsApp s'ouvre avec votre message déjà rédigé. Appuyez sur Envoyer dans WhatsApp pour nous transmettre votre demande."
      : "WhatsApp s'ouvre avec votre message déjà rédigé. Le numéro de réception n'est pas encore configuré : choisissez le contact dans WhatsApp.";
  }

  function copyMessage() {
    var text = buildMessage();
    var fallback = $("#copy-fallback");
    var done = function () {
      $("#btn-copy").textContent = "Message copié";
      setTimeout(function () { $("#btn-copy").textContent = "Copier le message"; }, 2500);
    };
    var showFallback = function () {
      fallback.value = text;
      fallback.hidden = false;
      fallback.focus();
      fallback.select();
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, showFallback);
      } else {
        showFallback();
      }
    } catch (e) { showFallback(); }
  }

  /* ---------- Événements ---------- */
  function onFieldInput(event) {
    var el = event.target;
    var field = el.dataset.field;
    if (!field) return;
    state[field] = el.value;
    clearError(field);
    if (el.tagName === "SELECT") el.classList.toggle("is-placeholder", !el.value);
    if (field === "sector" && state.sector !== "autre") clearError("sectorOther");
    refreshConditionals();
    if (currentStep === TOTAL_STEPS) { renderRecap(); updateSendLink(); }
    saveDraft();
  }

  function onChoiceChange(event) {
    var input = event.target;
    if (!input.classList.contains("choice-input")) return;
    var groupName = input.name;
    var list = state[groupName];
    var item = itemOf(groupName, input.value);

    if (input.checked) {
      if (item && item.exclusive) {
        list.length = 0; // « aucune présence » remplace les autres réponses
      } else {
        (CONFIG[groupName] || []).forEach(function (x) {
          if (x.exclusive) {
            var i = list.indexOf(x.id);
            if (i !== -1) list.splice(i, 1);
          }
        });
      }
      if (list.indexOf(input.value) === -1) list.push(input.value);
    } else {
      var idx = list.indexOf(input.value);
      if (idx !== -1) list.splice(idx, 1);
    }

    $$('.choice-input[name="' + groupName + '"]').forEach(function (i) {
      i.checked = list.indexOf(i.value) !== -1;
    });

    clearError(groupName);
    refreshChoiceStyles();
    refreshConditionals();
    if (currentStep === TOTAL_STEPS) { renderRecap(); updateSendLink(); }
    saveDraft();
  }

  function bind() {
    form.addEventListener("input", onFieldInput);
    form.addEventListener("change", function (e) {
      if (e.target.classList.contains("choice-input")) onChoiceChange(e);
      else onFieldInput(e);
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); });

    // Entrée dans un champ texte = Continuer
    form.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "checkbox") {
        e.preventDefault();
        if (currentStep < TOTAL_STEPS) next();
      }
    });

    btnNext.addEventListener("click", next);
    btnPrev.addEventListener("click", prev);
    btnSend.addEventListener("click", onSendClick);
    $("#btn-copy").addEventListener("click", copyMessage);

    $("#steps").addEventListener("click", function (e) {
      var b = e.target.closest(".step");
      if (b && !b.disabled) jumpTo(Number(b.dataset.step));
    });

    $("#recap-body").addEventListener("click", function (e) {
      var b = e.target.closest("[data-goto]");
      if (b) goTo(Number(b.dataset.goto));
    });
  }

  /* ---------- Démarrage ---------- */
  function init() {
    $$("[data-agency-name]").forEach(function (el) {
      if (CONFIG.agencyName) el.textContent = CONFIG.agencyName;
    });
    var year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());

    fillSelect($("#sector"), "sectors");
    fillSelect($("#timeline"), "timelines");
    buildChoices($("#needs-choices"), "needs", "needs");
    buildChoices($("#presence-choices"), "presence", "presence");

    loadDraft();
    syncFieldsFromState();
    bind();
    goTo(1, { initial: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
