export type WorkspaceListItem = {
  id: string;
  title: string;
  description: string;
  meta: string;
  image?: string;
  images?: string[];
};

export type FollowUpItem = {
  id: string;
  title: string;
  description: string;
  meta: string;
  status: "new" | "reviewed" | "archived";
  conversationHref?: string;
  actionLabel?: string;
};

export const classifiedWorkspace = {
  eyebrow: "Mes annonces",
  title: "Gerer vos petites annonces",
  description:
    "Publiez rapidement vos annonces, suivez les prises de contact et gardez un espace propre pour vos offres actives.",
  primaryButtonLabel: "Créer une annonce",
  imageFallbackSrc: "/image-placeholder.png",
  dataEndpoint: "/api/profile/workspace/classifieds",
  fields: [
    { id: "title", label: "Titre de l'annonce", placeholder: "Titre de l'annonce" },
    {
      id: "category",
      label: "Categorie",
      placeholder: "Choisir une categorie",
      type: "select" as const,
      options: ["Immobilier", "Vehicule", "Electronique", "Services"],
    },
    { id: "location", label: "Lieu", placeholder: "Lieu" },
    { id: "phone", label: "Telephone", placeholder: "+261 34 00 000 00", type: "tel" as const },
    { id: "price", label: "Prix", placeholder: "Ex: 850 000 Ar" },
    { id: "images", label: "Photos", placeholder: "Ajoutez jusqu'a 4 photos de l'annonce", type: "image-gallery" as const },
    { id: "description", label: "Description", placeholder: "Description...", type: "textarea" as const },
  ],
  items: [
    {
      id: "classified-1",
      title: "Toyota Yaris 2017",
      description: "Vehicule bien entretenu, carnet a jour, faible kilometrage.",
      meta: "Vehicule · 32 000 000 Ar",
      image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "classified-2",
      title: "Appartement T3 Ivandry",
      description: "Appartement meuble avec parking et gardiennage.",
      meta: "Immobilier · 2 500 000 Ar / mois",
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&q=80",
    },
  ] satisfies WorkspaceListItem[],
  followUpsByItem: {
    "classified-1": [
      {
        id: "contact-1",
        title: "Interet pour Toyota Yaris 2017",
        description: "Bonjour, le vehicule est-il toujours disponible ? Je souhaite le visiter cette semaine.",
        meta: "Rakotondrasoa N. · Aujourd'hui · Tel: +261 34 11 222 33",
        status: "new",
      },
      {
        id: "contact-2",
        title: "Question sur le kilometrage",
        description: "Pouvez-vous confirmer le kilometrage exact et l'historique d'entretien du vehicule ?",
        meta: "Ranaivo T. · Hier · Email",
        status: "reviewed",
      },
      {
        id: "contact-3",
        title: "Demande de visite",
        description: "Je suis interesse, possible de passer voir la voiture samedi matin ?",
        meta: "Andria N. · 13/03/2026 · Tel: +261 32 45 678 90",
        status: "archived",
      },
    ],
    "classified-2": [
      {
        id: "contact-4",
        title: "Disponibilite de l'appartement",
        description: "L'appartement est-il toujours disponible et le loyer inclut-il les charges ?",
        meta: "Rasoanaivo M. · Aujourd'hui · Email",
        status: "new",
      },
      {
        id: "contact-5",
        title: "Question sur le parking",
        description: "Combien de places de parking sont incluses dans la location ?",
        meta: "Hery L. · 14/03/2026 · Tel: +261 33 77 889 00",
        status: "reviewed",
      },
    ],
  } as Record<string, FollowUpItem[]>,
};

export const jobsWorkspace = {
  eyebrow: "Espace emploi",
  title: "Gerer vos offres d'emploi",
  description:
    "Creez vos offres, suivez les candidatures et gardez tout votre recrutement dans un espace dedie a votre compte.",
  primaryButtonLabel: "Ajouter une offre d'emploi",
  dataEndpoint: "/api/profile/workspace/jobs",
  fields: [
    { id: "title", label: "Titre du poste", placeholder: "Titre du poste" },
    {
      id: "employmentType",
      label: "Type d'emploi",
      placeholder: "Type d'emploi",
      type: "select" as const,
      options: ["Temps plein", "Temps partiel", "Freelance", "Stage"],
    },
    { id: "location", label: "Lieu", placeholder: "Lieu" },
    { id: "contact", label: "Contact", placeholder: "+261 34 00 000 00", type: "tel" as const },
    { id: "email", label: "Mail", placeholder: "votremail@gmail.com", type: "email" as const },
    { id: "deadline", label: "Date de fin de candidature", placeholder: "Date de fin", type: "date" as const },
    { id: "description", label: "Description emploi", placeholder: "Description...", type: "textarea" as const },
  ],
  items: [
    {
      id: "job-1",
      title: "Assistant de Direction",
      description: "Description et missions principales du poste avec details sur le profil recherche.",
      meta: "Antananarivo · Temps plein",
    },
    {
      id: "job-2",
      title: "Graphiste",
      description: "Creation de visuels digitaux et print pour plusieurs campagnes editoriales.",
      meta: "Remote · Freelance",
    },
    {
      id: "job-3",
      title: "Responsable RH",
      description: "Pilotage du recrutement, integration et suivi des equipes internes.",
      meta: "Antananarivo · CDI",
    },
  ] satisfies WorkspaceListItem[],
  followUpsByItem: {
    "job-1": [
      {
        id: "candidate-1",
        title: "Raharinirina Lova",
        description: "5 ans d'experience en support executif et coordination de direction generale.",
        meta: "CV recu aujourd'hui · Tel: +261 34 99 001 22",
        status: "new",
      },
      {
        id: "candidate-2",
        title: "Rasoanaivo Fanja",
        description: "Profil administratif avec experience en gestion d'agenda et organisation d'evenements.",
        meta: "CV relu · 14/03/2026",
        status: "reviewed",
      },
    ],
    "job-2": [
      {
        id: "candidate-3",
        title: "Rakoto Harena",
        description: "Portfolio en branding, social media et habillage video.",
        meta: "Portfolio recu · Email",
        status: "new",
      },
    ],
    "job-3": [
      {
        id: "candidate-4",
        title: "Miora N.",
        description: "Experience RH en entreprise de plus de 200 collaborateurs.",
        meta: "Candidature archivee · 10/03/2026",
        status: "archived",
      },
    ],
  } as Record<string, FollowUpItem[]>,
};

export const tendersWorkspace = {
  eyebrow: "Espace appels d'offres",
  title: "Gerer vos appels d'offres",
  description:
    "Centralisez vos consultations, suivez les reponses recues et gardez chaque dossier accessible depuis votre espace personnel.",
  primaryButtonLabel: "Ajouter un appel d'offre",
  dataEndpoint: "/api/profile/workspace/tenders",
  fields: [
    { id: "title", label: "Intitule", placeholder: "Intitule de l'appel d'offre" },
    {
      id: "category",
      label: "Categorie",
      placeholder: "Choisir une categorie",
      type: "select" as const,
      options: ["Batiment", "Transport", "IT", "Services"],
    },
    { id: "organization", label: "Organisation", placeholder: "Nom de l'organisation" },
    { id: "contact", label: "Contact", placeholder: "+261 34 00 000 00", type: "tel" as const },
    { id: "deadline", label: "Date limite", placeholder: "Date limite", type: "date" as const },
    { id: "description", label: "Description du besoin", placeholder: "Description...", type: "textarea" as const },
  ],
  items: [
    {
      id: "tender-1",
      title: "Acquisition de materiels reseau",
      description: "Consultation pour fourniture et installation d'equipements reseau sur 3 sites.",
      meta: "IT · Date limite 15/04/2026",
    },
    {
      id: "tender-2",
      title: "Travaux de renovation des bureaux",
      description: "Travaux de remise a niveau et reamenagement de plateaux administratifs.",
      meta: "Batiment · Date limite 28/04/2026",
    },
  ] satisfies WorkspaceListItem[],
  followUpsByItem: {
    "tender-1": [
      {
        id: "response-1",
        title: "NetCom Madagascar",
        description: "Proposition complete avec delais, planning de deploiement et support de maintenance.",
        meta: "Offre recu aujourd'hui · IT",
        status: "new",
      },
      {
        id: "response-2",
        title: "InfraSys",
        description: "Variante budgetaire avec lot materiel et lot installation separes.",
        meta: "Reponse relue · 13/03/2026",
        status: "reviewed",
      },
    ],
    "tender-2": [
      {
        id: "response-3",
        title: "BatiPro",
        description: "Devis detaille avec planning d'execution en deux phases.",
        meta: "Archive · 11/03/2026",
        status: "archived",
      },
    ],
  } as Record<string, FollowUpItem[]>,
};
