/*
 * Configuration du formulaire de demande de site.
 * Tout ce qui peut changer sans toucher à la logique se règle ici.
 */
window.SITE_CONFIG = {
  /*
   * Numéro WhatsApp qui recevra les demandes.
   * Format international, chiffres uniquement, sans "+", sans espaces ni zéro initial.
   * Exemple de format : "221XXXXXXXXX" pour un numéro sénégalais, "33XXXXXXXXX" pour un numéro français.
   * Tant qu'il est vide, WhatsApp s'ouvre et laisse choisir le destinataire.
   */
  whatsappNumber: "",

  /* Nom affiché dans l'en-tête et le pied de page. */
  agencyName: "Votre agence web",

  /* Clé d'enregistrement du brouillon dans le navigateur. Mettre "" pour désactiver. */
  draftStorageKey: "demande-site-brouillon-v1",

  sectors: [
    { id: "restaurant", label: "Restaurant" },
    { id: "fast-food", label: "Fast-food" },
    { id: "commerce", label: "Boutique / Commerce" },
    { id: "beaute", label: "Salon de coiffure / Beauté" },
    { id: "hebergement", label: "Hôtel / Hébergement" },
    { id: "immobilier", label: "Immobilier" },
    { id: "services", label: "Services / Prestations" },
    { id: "formation", label: "Formation / Éducation" },
    { id: "autre", label: "Autre" }
  ],

  needs: [
    { id: "google", label: "Être trouvé sur Google par les clients", icon: "search" },
    { id: "reservations", label: "Recevoir des réservations sur WhatsApp", icon: "calendar" },
    { id: "menu", label: "Montrer mon menu, mes prix et mes photos", icon: "menu" },
    { id: "services", label: "Présenter mes services et rassurer mes clients", icon: "shield" },
    { id: "boutique", label: "Vendre mes produits en ligne", icon: "bag" },
    { id: "entreprise", label: "Présenter mon entreprise et mes réalisations", icon: "briefcase" },
    { id: "contact", label: "Permettre aux clients de me contacter facilement", icon: "phone" },
    { id: "autre", label: "Autre chose", icon: "plus" }
  ],

  timelines: [
    { id: "asap", label: "Dès que possible" },
    { id: "2-semaines", label: "Dans les 2 prochaines semaines" },
    { id: "1-mois", label: "Dans le mois" },
    { id: "plus-tard", label: "Plus tard" },
    { id: "infos", label: "Je souhaite d'abord obtenir des informations" }
  ],

  presence: [
    { id: "aucune", label: "Je n'ai pas encore de présence en ligne", short: "Aucune présence en ligne", icon: "none", exclusive: true },
    { id: "facebook", label: "J'ai une page Facebook", short: "Page Facebook", icon: "page" },
    { id: "instagram", label: "J'ai un compte Instagram", short: "Compte Instagram", icon: "camera" },
    { id: "whatsapp-business", label: "J'utilise WhatsApp Business", short: "WhatsApp Business", icon: "chat" },
    { id: "site", label: "J'ai déjà un site internet", short: "Site internet existant", icon: "globe" },
    { id: "google-maps", label: "Je suis présent sur Google Maps", short: "Google Maps", icon: "pin" },
    { id: "tiktok", label: "J'utilise TikTok", short: "TikTok", icon: "video" },
    { id: "autre", label: "Autre", short: "Autre", icon: "plus" }
  ]
};
