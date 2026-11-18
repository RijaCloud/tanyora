export interface PublicJob {
  id: number;
  company: string;
  companyLetter: string;
  companyColor: string;
  location: string;
  title: string;
  description: string;
  date: string;
  category: string;
  type: string;
  contact: string;
  email: string;
  featured?: boolean;
}

export interface PublicTender {
  id: number;
  organization: string;
  organizationLetter: string;
  organizationColor: string;
  location: string;
  title: string;
  description: string;
  budget: string;
  deadline: string;
  category: string;
  type: string;
  contact: string;
  email: string;
  featured?: boolean;
}

export interface PublicAd {
  id: number;
  seller: string;
  sellerLetter: string;
  sellerColor: string;
  location: string;
  title: string;
  description: string;
  price: string;
  date: string;
  category: string;
  image: string;
  contact: string;
  email: string;
  featured?: boolean;
}

export const publicJobs: PublicJob[] = [
  { id: 1, company: "AX Company", companyLetter: "A", companyColor: "#27624f", location: "Ivato", title: "Graphiste", description: "Nous recherchons un graphiste creatif pour concevoir les visuels de nos campagnes, supports print et contenus digitaux. Le poste demande une vraie maitrise de la mise en page, de la retouche et une bonne sensibilite a l'univers des marques.", date: "17 fevrier 2026", category: "Redacteur Web", type: "Temps plein", contact: "+261 31 00 000 00", email: "contact@axcompany.mg", featured: true },
  { id: 2, company: "Gear Games", companyLetter: "G", companyColor: "#22c55e", location: "Ivato", title: "Chef de projet", description: "Vous coordonnerez les equipes, les livrables et le suivi client sur plusieurs projets digitaux. Nous cherchons un profil rigoureux, a l'aise avec les delais et la communication.", date: "17 fevrier 2026", category: "Assistant de Direction", type: "Temps plein", contact: "+261 31 00 000 01", email: "jobs@geargames.mg" },
  { id: 3, company: "Karts Company", companyLetter: "K", companyColor: "#fb923c", location: "Ivato", title: "Responsable marketing", description: "Vous piloterez la strategie d'acquisition, les campagnes et les performances marketing. Une bonne maitrise des outils de suivi et de la creation de contenus est attendue.", date: "17 fevrier 2026", category: "Responsable marketing", type: "Temps plein", contact: "+261 31 00 000 02", email: "talents@kartscompany.mg", featured: true },
  { id: 4, company: "Gear Games", companyLetter: "G", companyColor: "#22c55e", location: "Ivato", title: "Assistant de Direction", description: "Ce poste accompagne la direction sur l'organisation quotidienne, la preparation des reunions et le suivi administratif. Nous cherchons une personne fiable et proactive.", date: "17 fevrier 2026", category: "Assistant de Direction", type: "Temps plein", contact: "+261 31 00 000 03", email: "jobs@geargames.mg" },
  { id: 5, company: "Karts Company", companyLetter: "K", companyColor: "#111111", location: "Ivato", title: "Responsable RH", description: "Vous prendrez en charge le recrutement, l'integration et le suivi des collaborateurs. Le poste inclut aussi la structuration des procedures RH et l'accompagnement des managers.", date: "17 fevrier 2026", category: "Responsable RH", type: "Temps plein", contact: "+261 31 00 000 04", email: "rh@kartscompany.mg" },
  { id: 6, company: "Karts Company", companyLetter: "K", companyColor: "#27624f", location: "Ivato", title: "Comptable", description: "Vous assurez le suivi comptable quotidien, les rapprochements, le controle des pieces et la preparation des documents de cloture.", date: "17 fevrier 2026", category: "Responsable RH", type: "Temps plein", contact: "+261 31 00 000 05", email: "finance@kartscompany.mg", featured: true },
  { id: 7, company: "Tech Solutions", companyLetter: "T", companyColor: "#3b82f6", location: "Antananarivo", title: "Developpeur Full Stack", description: "Vous interviendrez sur le developpement d'interfaces, d'API et l'amelioration continue de la plateforme. Une base solide en front et back est necessaire.", date: "16 fevrier 2026", category: "Technicien Support IT", type: "Temps plein", contact: "+261 31 00 000 06", email: "tech@techsolutions.mg" },
  { id: 8, company: "Media Plus", companyLetter: "M", companyColor: "#8b5cf6", location: "Ivato", title: "Commercial B2B", description: "Vous gererez un portefeuille clients et le developpement commercial de nouvelles offres. Un profil orienté resultat et relationnel est recherche.", date: "16 fevrier 2026", category: "Commercial B2B", type: "Temps plein", contact: "+261 31 00 000 07", email: "sales@mediaplus.mg", featured: true },
  { id: 9, company: "Digital Pro", companyLetter: "D", companyColor: "#ec4899", location: "Ivato", title: "Redacteur Web", description: "Production d'articles, de fiches et de contenus optimises pour le web. Il faut aimer ecrire clairement et comprendre les enjeux de visibilite en ligne.", date: "15 fevrier 2026", category: "Redacteur Web", type: "Temps plein", contact: "+261 31 00 000 08", email: "redaction@digitalpro.mg" },
  { id: 10, company: "Smart Systems", companyLetter: "S", companyColor: "#14b8a6", location: "Antananarivo", title: "Moderateur de contenu", description: "Vous surveillez, qualifiez et optimisez les contenus soumis sur la plateforme. Il faut etre rigoureux et a l'aise avec les outils de moderation.", date: "15 fevrier 2026", category: "Moderateur de contenu", type: "Temps plein", contact: "+261 31 00 000 09", email: "ops@smartsystems.mg" },
  { id: 11, company: "Business Corp", companyLetter: "B", companyColor: "#f59e0b", location: "Ivato", title: "Gestionnaire de stock", description: "Vous assurez le suivi des entrees, sorties et inventaires, avec un vrai role de coordination entre l'achat et l'exploitation.", date: "14 fevrier 2026", category: "Gestionnaire de stock", type: "Temps plein", contact: "+261 31 00 000 10", email: "supply@businesscorp.mg", featured: true },
  { id: 12, company: "Tech Solutions", companyLetter: "T", companyColor: "#3b82f6", location: "Antananarivo", title: "Teleconseiller francophone", description: "Vous gerez les appels entrants et sortants, avec un bon niveau d'expression et un vrai sens du service client.", date: "14 fevrier 2026", category: "Teleconseiller", type: "Temps plein", contact: "+261 31 00 000 11", email: "care@techsolutions.mg" },
  { id: 13, company: "AX Company", companyLetter: "A", companyColor: "#27624f", location: "Ivato", title: "Chef de projet IT", description: "Pilotage transverse des sujets techniques, coordination des equipes et suivi du planning de livraison.", date: "13 fevrier 2026", category: "Technicien Support IT", type: "Temps plein", contact: "+261 31 00 000 12", email: "projects@axcompany.mg" },
  { id: 14, company: "Media Plus", companyLetter: "M", companyColor: "#8b5cf6", location: "Antananarivo", title: "Assistant RH junior", description: "Participation au recrutement, au suivi administratif RH et a l'accueil des nouvelles recrues.", date: "13 fevrier 2026", category: "Responsable RH", type: "Temps plein", contact: "+261 31 00 000 13", email: "rh@mediaplus.mg" },
  { id: 15, company: "Digital Pro", companyLetter: "D", companyColor: "#ec4899", location: "Ivato", title: "Responsable commercial", description: "Animation de l'equipe commerciale, suivi des objectifs et developpement de nouveaux comptes.", date: "12 fevrier 2026", category: "Commercial B2B", type: "Temps plein", contact: "+261 31 00 000 14", email: "sales@digitalpro.mg" },
  { id: 16, company: "Smart Systems", companyLetter: "S", companyColor: "#14b8a6", location: "Antananarivo", title: "Content Manager", description: "Pilotage du calendrier editorial, supervision des productions et harmonisation des contenus de marque.", date: "12 fevrier 2026", category: "Redacteur Web", type: "Temps plein", contact: "+261 31 00 000 15", email: "content@smartsystems.mg", featured: true },
  { id: 17, company: "Cloudaris", companyLetter: "C", companyColor: "#22c55e", location: "Ivato", title: "UI Designer", description: "Conception d'interfaces web et mobile, avec un bon niveau de precision sur les composants et l'experience utilisateur.", date: "11 fevrier 2026", category: "Redacteur Web", type: "Temps plein", contact: "+261 31 00 000 16", email: "design@cloudaris.mg" },
  { id: 18, company: "Synaptech", companyLetter: "S", companyColor: "#111111", location: "Ivato", title: "UX Researcher", description: "Vous conduisez des tests utilisateurs, synthetisez les retours et proposez des ameliorations produit claires.", date: "11 fevrier 2026", category: "Technicien Support IT", type: "Temps plein", contact: "+261 31 00 000 17", email: "research@synaptech.mg" },
];

export const publicTenders: PublicTender[] = [
  { id: 1, organization: "BTP Construct", organizationLetter: "B", organizationColor: "#22c55e", location: "Antananarivo", title: "Construction complexe commercial", description: "Recherche d'entreprises specialisees en gros oeuvre, second oeuvre et finitions pour un programme commercial de 5 000 m2.", budget: "500 000 000 Ar", deadline: "15 mars 2026", category: "Construction", type: "Infrastructure", contact: "+261 31 00 000 20", email: "marches@btpconstruct.mg", featured: true },
  { id: 2, organization: "Madagascar Infra", organizationLetter: "M", organizationColor: "#fb923c", location: "Toamasina", title: "Projet autoroutier 80km", description: "Partenaires attendus pour terrassement, bitumage et signalisation routiere sur un axe regional strategique.", budget: "2 000 000 000 Ar", deadline: "20 mars 2026", category: "Construction", type: "Transport", contact: "+261 31 00 000 21", email: "infra@madagascarinfra.mg" },
  { id: 3, organization: "TechSolutions MG", organizationLetter: "T", organizationColor: "#27624f", location: "Fianarantsoa", title: "Deploiement reseau fibre optique", description: "Sous-traitants recherches pour l'installation d'un reseau fibre dans plusieurs villes avec accompagnement technique.", budget: "300 000 000 Ar", deadline: "10 mars 2026", category: "Informatique", type: "Technologie", contact: "+261 31 00 000 22", email: "projects@techsolutionsmg.mg", featured: true },
  { id: 4, organization: "Hotellerie Premium", organizationLetter: "H", organizationColor: "#3b82f6", location: "Nosy Be", title: "Equipement hotel 5 etoiles", description: "Consultation pour la fourniture d'equipements hoteliers, mobilier, electromenager et decoration.", budget: "150 000 000 Ar", deadline: "25 mars 2026", category: "Equipement", type: "Batiment", contact: "+261 31 00 000 23", email: "procurement@hotelleriepremium.mg" },
  { id: 5, organization: "AgriMad Group", organizationLetter: "A", organizationColor: "#22c55e", location: "Antsirabe", title: "Modernisation usine agro-alimentaire", description: "Installation d'equipements industriels, automatisation et accompagnement au changement sur site.", budget: "450 000 000 Ar", deadline: "18 mars 2026", category: "Equipement", type: "Infrastructure", contact: "+261 31 00 000 24", email: "invest@agrimad.mg" },
  { id: 6, organization: "EnergyPlus", organizationLetter: "E", organizationColor: "#14b8a6", location: "Antananarivo", title: "Installation panneaux solaires 500kW", description: "Recherche de partenaires pour la fourniture et la pose d'un systeme solaire pour un site de production.", budget: "800 000 000 Ar", deadline: "30 mars 2026", category: "Consulting", type: "Energie", contact: "+261 31 00 000 25", email: "solar@energyplus.mg", featured: true },
  { id: 7, organization: "HealthCare MG", organizationLetter: "H", organizationColor: "#8b5cf6", location: "Toamasina", title: "Equipement clinique privee", description: "Fourniture d'equipements medicaux, laboratoire et mobilier pour l'ouverture d'un nouvel etablissement.", budget: "350 000 000 Ar", deadline: "12 mars 2026", category: "Equipement", type: "Sante", contact: "+261 31 00 000 26", email: "achat@healthcaremg.mg" },
  { id: 8, organization: "Educ Formation", organizationLetter: "E", organizationColor: "#f59e0b", location: "Fianarantsoa", title: "Equipement centre de formation", description: "Materiel informatique, audiovisuel et mobilier a fournir pour un centre de formation professionnelle.", budget: "120 000 000 Ar", deadline: "22 mars 2026", category: "Formation", type: "Education", contact: "+261 31 00 000 27", email: "equipement@educformation.mg", featured: true },
  { id: 9, organization: "LogiTransport", organizationLetter: "L", organizationColor: "#ec4899", location: "Mahajanga", title: "Flotte de vehicules utilitaires", description: "Acquisition et suivi de maintenance pour une flotte dediee a la logistique regionale.", budget: "600 000 000 Ar", deadline: "28 mars 2026", category: "Transport", type: "Transport", contact: "+261 31 00 000 28", email: "fleet@logitransport.mg" },
  { id: 10, organization: "GreenBuilding", organizationLetter: "G", organizationColor: "#111111", location: "Antsiranana", title: "Eco-quartier residentiel", description: "Entreprises et cabinets attendus pour un projet de logements durables et d'amenagement urbain.", budget: "1 500 000 000 Ar", deadline: "5 avril 2026", category: "Construction", type: "Batiment", contact: "+261 31 00 000 29", email: "eco@greenbuilding.mg" },
  { id: 11, organization: "SecuriTech", organizationLetter: "S", organizationColor: "#27624f", location: "Antananarivo", title: "Systeme de securite integre", description: "Installation de videosurveillance, alarme et controle d'acces pour plusieurs sites industriels.", budget: "200 000 000 Ar", deadline: "15 mars 2026", category: "Informatique", type: "Technologie", contact: "+261 31 00 000 30", email: "security@securitech.mg", featured: true },
  { id: 12, organization: "WaterWorks", organizationLetter: "W", organizationColor: "#3b82f6", location: "Toliara", title: "Reseau d'eau potable urbain", description: "Consultation pour l'installation d'un reseau hydraulique urbain et ses ouvrages associes.", budget: "900 000 000 Ar", deadline: "2 avril 2026", category: "Construction", type: "Infrastructure", contact: "+261 31 00 000 31", email: "water@waterworks.mg" },
  { id: 13, organization: "RetailMada", organizationLetter: "R", organizationColor: "#22c55e", location: "Antsirabe", title: "Amenagement centres commerciaux", description: "Architecture interieure, signaletique et installation de systemes pour trois surfaces commerciales.", budget: "280 000 000 Ar", deadline: "20 mars 2026", category: "Services", type: "Batiment", contact: "+261 31 00 000 32", email: "fitout@retailmada.mg" },
  { id: 14, organization: "TourismDev", organizationLetter: "T", organizationColor: "#fb923c", location: "Sainte-Marie", title: "Resort touristique cotier", description: "Recherche de constructeurs et decorateurs pour un complexe touristique de 40 bungalows.", budget: "1 200 000 000 Ar", deadline: "10 avril 2026", category: "Construction", type: "Batiment", contact: "+261 31 00 000 33", email: "resort@tourismdev.mg" },
  { id: 15, organization: "MiningTech", organizationLetter: "M", organizationColor: "#14b8a6", location: "Fort-Dauphin", title: "Equipements miniers lourds", description: "Fourniture et maintenance d'equipements lourds pour une exploitation miniere en expansion.", budget: "2 500 000 000 Ar", deadline: "25 mars 2026", category: "Equipement", type: "Industrie", contact: "+261 31 00 000 34", email: "mine@miningtech.mg", featured: true },
  { id: 16, organization: "SmartCity", organizationLetter: "S", organizationColor: "#8b5cf6", location: "Antananarivo", title: "Infrastructure ville intelligente", description: "Solutions IoT, capteurs et supervision urbaine pour un programme de modernisation territoriale.", budget: "3 000 000 000 Ar", deadline: "15 avril 2026", category: "Informatique", type: "Technologie", contact: "+261 31 00 000 35", email: "smartcity@smartcity.mg" },
  { id: 17, organization: "CleanEnergy", organizationLetter: "C", organizationColor: "#22c55e", location: "Mahajanga", title: "Parc eolien 50MW", description: "Partenaires recherches pour l'installation et la maintenance d'un parc eolien en zone cotiere.", budget: "4 000 000 000 Ar", deadline: "30 mars 2026", category: "Consulting", type: "Energie", contact: "+261 31 00 000 36", email: "wind@cleanenergy.mg" },
  { id: 18, organization: "EducTech", organizationLetter: "E", organizationColor: "#f59e0b", location: "Antananarivo", title: "Plateforme e-learning nationale", description: "Developpeurs et consultants attendus pour la mise en place d'une plateforme educative a grande echelle.", budget: "180 000 000 Ar", deadline: "5 mars 2026", category: "Informatique", type: "Education", contact: "+261 31 00 000 37", email: "elearning@eductech.mg" },
];

const adImages = [
  "/prototype-assets/ece298d0ec2c16f10310d45724b276a6035cb503.png",
  "/prototype-assets/60c694b9f36256d02658c65f32a80af42f96d229.png",
  "/prototype-assets/72d023aedfdc4aaca7262457bf736389092701b8.png",
  "/prototype-assets/7f88ed60fba8530cd4b283775351ebddbf78e8a5.png",
  "/prototype-assets/0325b063b538d46b08bb01eaf4883844c1c414a4.png",
  "/prototype-assets/eed8fce34db4ac97a83ba23f58da6bd8e189e213.png",
  "/prototype-assets/c37371f992cab2b931064463769f34cb7d8ef47c.png",
  "/prototype-assets/d94a03ed6a56eda9a7cae1f9d85e3a5561eeac06.png",
  "/prototype-assets/71bb5176cbe70b1a208aedf88a47a5af62e694b0.png",
  "/prototype-assets/5b11e11b65400842e4c609e64fea8abab06ffc5f.png",
  "/prototype-assets/12a6239f76ce73d98ab3aa22492695a33d96f53e.png",
  "/prototype-assets/1b5ade328d8657dac1727cbc09f03013103365e7.png",
  "/prototype-assets/33a0225e1ea6ae9c770ca004bff539f138a2fc39.png",
  "/prototype-assets/ee98101e5747ec328513c8c77654eb04b31e509c.png",
  "/prototype-assets/32d8a11e4dedfe8e2dc8e3a22f6480570c0465dc.png",
  "/prototype-assets/29ec9cf04f0638f2ef0e5b04c88221dd57d811cb.png",
];

export const publicAds: PublicAd[] = [
  { id: 1, seller: "Petites", sellerLetter: "P", sellerColor: "#22c55e", location: "Ivato", title: "Samsung Galaxy S21", description: "Smartphone soigneusement entretenu, avec chargeur et boite. Ideal pour un usage quotidien et professionnel.", price: "3 000 000 Ar", date: "3 jours", category: "Electronique", featured: true, image: adImages[0], contact: "+261 31 00 000 40", email: "annonce1@example.invalid" },
  { id: 2, seller: "Petites", sellerLetter: "P", sellerColor: "#fb923c", location: "Ivato", title: "Chaussures Nike", description: "Modele en excellent etat, tres peu porte, pointure standard avec boite d'origine.", price: "600 000 Ar", date: "11 heures", category: "Mode", image: adImages[1], contact: "+261 31 00 000 41", email: "annonce2@example.invalid" },
  { id: 3, seller: "Petites", sellerLetter: "P", sellerColor: "#27624f", location: "Ivato", title: "Montre de collection", description: "Piece elegante et bien conservee, vendue avec ses accessoires et certificat.", price: "1 000 000 Ar", date: "11 heures", category: "Mode", featured: true, image: adImages[2], contact: "+261 31 00 000 42", email: "annonce3@example.invalid" },
  { id: 4, seller: "Petites", sellerLetter: "P", sellerColor: "#3b82f6", location: "Ivato", title: "Casque audio", description: "Bon confort d'ecoute, autonomie stable et etat general tres propre.", price: "450 000 Ar", date: "7 heures", category: "Electronique", image: adImages[3], contact: "+261 31 00 000 43", email: "annonce4@example.invalid" },
  { id: 5, seller: "Petites", sellerLetter: "P", sellerColor: "#22c55e", location: "Ivato", title: "Ordinateur portable", description: "Machine adaptee au travail bureautique et aux usages numeriques du quotidien.", price: "1 800 000 Ar", date: "5 jours", category: "Informatique", image: adImages[4], contact: "+261 31 00 000 44", email: "annonce5@example.invalid" },
  { id: 6, seller: "Petites", sellerLetter: "P", sellerColor: "#14b8a6", location: "Ivato", title: "Tablette Samsung", description: "Tablette polyvalente avec bon ecran, pratique pour le multimedia et les deplacements.", price: "950 000 Ar", date: "5 jours", category: "Electronique", image: adImages[5], contact: "+261 31 00 000 45", email: "annonce6@example.invalid" },
  { id: 7, seller: "Petites", sellerLetter: "P", sellerColor: "#8b5cf6", location: "Ivato", title: "Bracelet en cuir", description: "Accessoire en tres bon etat, finition sobre et elegante.", price: "120 000 Ar", date: "5 jours", category: "Mode", featured: true, image: adImages[6], contact: "+261 31 00 000 46", email: "annonce7@example.invalid" },
  { id: 8, seller: "Petites", sellerLetter: "P", sellerColor: "#f59e0b", location: "Ivato", title: "Ceinture en cuir", description: "Article de mode en excellent etat, ideal pour une tenue professionnelle.", price: "90 000 Ar", date: "5 jours", category: "Mode", image: adImages[7], contact: "+261 31 00 000 47", email: "annonce8@example.invalid" },
  { id: 9, seller: "Petites", sellerLetter: "P", sellerColor: "#ec4899", location: "Ivato", title: "Sac a main", description: "Sac bien conserve avec rangement interieur pratique et finition soignee.", price: "300 000 Ar", date: "5 jours", category: "Mode", image: adImages[8], contact: "+261 31 00 000 48", email: "annonce9@example.invalid" },
  { id: 10, seller: "Petites", sellerLetter: "P", sellerColor: "#111111", location: "Ivato", title: "Camera professionnelle", description: "Materiel adapte a la photo et a la video, vendu avec plusieurs accessoires.", price: "2 200 000 Ar", date: "5 jours", category: "Electronique", image: adImages[9], contact: "+261 31 00 000 49", email: "annonce10@example.invalid" },
  { id: 11, seller: "Petites", sellerLetter: "P", sellerColor: "#27624f", location: "Ivato", title: "Ensemble home studio", description: "Pack compact pour enregistrement ou streaming avec materiel essentiel.", price: "1 400 000 Ar", date: "5 jours", category: "Electronique", featured: true, image: adImages[10], contact: "+261 31 00 000 50", email: "annonce11@example.invalid" },
  { id: 12, seller: "Petites", sellerLetter: "P", sellerColor: "#3b82f6", location: "Ivato", title: "Velo de route", description: "Velo leger et bien entretenu, pret a rouler pour sport ou deplacement.", price: "850 000 Ar", date: "5 jours", category: "Loisirs", image: adImages[11], contact: "+261 31 00 000 51", email: "annonce12@example.invalid" },
  { id: 13, seller: "Petites", sellerLetter: "P", sellerColor: "#22c55e", location: "Ivato", title: "Veste rouge", description: "Piece textile en bon etat avec coupe actuelle et tissu resistant.", price: "110 000 Ar", date: "5 jours", category: "Mode", image: adImages[12], contact: "+261 31 00 000 52", email: "annonce13@example.invalid" },
  { id: 14, seller: "Petites", sellerLetter: "P", sellerColor: "#fb923c", location: "Ivato", title: "Sac a dos", description: "Sac solide et pratique pour etudes, travail ou deplacement.", price: "95 000 Ar", date: "5 jours", category: "Mode", image: adImages[13], contact: "+261 31 00 000 53", email: "annonce14@example.invalid" },
  { id: 15, seller: "Petites", sellerLetter: "P", sellerColor: "#14b8a6", location: "Ivato", title: "Enceintes Bluetooth", description: "Son puissant et bon etat general, parfaites pour la maison ou les sorties.", price: "280 000 Ar", date: "5 jours", category: "Electronique", image: adImages[14], contact: "+261 31 00 000 54", email: "annonce15@example.invalid" },
  { id: 16, seller: "Petites", sellerLetter: "P", sellerColor: "#8b5cf6", location: "Ivato", title: "Console portable", description: "Console mobile avec accessoires et autonomie stable, usage loisir garanti.", price: "1 250 000 Ar", date: "5 jours", category: "Electronique", featured: true, image: adImages[15], contact: "+261 31 00 000 55", email: "annonce16@example.invalid" },
  { id: 17, seller: "Petites", sellerLetter: "P", sellerColor: "#22c55e", location: "Antananarivo", title: "Appartement T2 meuble", description: "Appartement bien situe, lumineux et pret a etre occupe avec quelques prestations incluses.", price: "1 500 000 Ar / mois", date: "2 jours", category: "Immobilier", image: adImages[4], contact: "+261 31 00 000 56", email: "annonce17@example.invalid" },
  { id: 18, seller: "Petites", sellerLetter: "P", sellerColor: "#27624f", location: "Antananarivo", title: "Voiture citadine", description: "Vehicule propre, entretien suivi et faible kilometrage, ideal pour usage urbain.", price: "32 000 000 Ar", date: "1 jour", category: "Vehicules", image: adImages[0], contact: "+261 31 00 000 57", email: "annonce18@example.invalid" },
];

export function getPublicJobById(id: number) {
  return publicJobs.find((item) => item.id === id) ?? null;
}

export function getPublicTenderById(id: number) {
  return publicTenders.find((item) => item.id === id) ?? null;
}

export function getPublicAdById(id: number) {
  return publicAds.find((item) => item.id === id) ?? null;
}
