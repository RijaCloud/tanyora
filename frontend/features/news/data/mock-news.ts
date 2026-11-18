import type { NewsArticle } from "@/features/news/types";

export const mockArticles: NewsArticle[] = [
  {
    id: "1",
    source: "post",
    slug: "economie-locale-antananarivo",
    title: "Economie locale: les PME accelerent a Antananarivo",
    excerpt: "Les petites entreprises locales observent une hausse des commandes.",
    content:
      "Contenu complet premium. Analyse du marche local, tendances sectorielles et temoignages terrain.",
    category: "economie",
    publishedAt: "2026-03-08T07:00:00.000Z",
    isPremium: true,
    imageUrl:
      "https://images.unsplash.com/photo-1700083848763-215b05123e4a?auto=format&fit=crop&w=1200&q=80",
    tags: ["Politique", "National"],
  },
  {
    id: "2",
    source: "post",
    slug: "transport-urbain-modernisation",
    title: "Transport urbain: nouvelle phase de modernisation",
    excerpt: "La ville lance un plan progressif pour fluidifier la circulation.",
    content: "Contenu complet libre. Details sur les zones concernees et le calendrier.",
    category: "societe",
    publishedAt: "2026-03-07T10:30:00.000Z",
    isPremium: false,
    imageUrl:
      "https://images.unsplash.com/photo-1656829775766-fa0f07b7fd2d?auto=format&fit=crop&w=1200&q=80",
    tags: ["Societe", "Transport"],
  },
  {
    id: "3",
    source: "post",
    slug: "education-numerique-regions",
    title: "Education numerique: extension du programme en regions",
    excerpt: "De nouveaux etablissements rejoignent le dispositif.",
    content: "Contenu complet premium. Capacite d'accueil, priorites pedagogiques et budgets.",
    category: "education",
    publishedAt: "2026-03-06T09:15:00.000Z",
    isPremium: true,
    imageUrl:
      "https://images.unsplash.com/photo-1598563426949-bbff8101ed13?auto=format&fit=crop&w=1200&q=80",
    tags: ["Education", "Numerique"],
  },
  {
    id: "4",
    source: "post",
    slug: "vanille-export-record",
    title: "Export: la vanille malgache depasse les previsions trimestrielles",
    excerpt: "Le secteur enregistre un record d'expedition sur les principaux marches.",
    content: "Contenu complet libre. Chiffres cles, impacts regionaux et perspectives.",
    category: "business",
    publishedAt: "2026-03-05T06:30:00.000Z",
    isPremium: false,
    imageUrl:
      "https://images.unsplash.com/photo-1528901166007-3784c7dd3653?auto=format&fit=crop&w=1200&q=80",
    tags: ["Business", "Export"],
  }
];
