import type { DirectoryCompany } from "@/features/directory/types";

// Fictional previews only: never publish these as WordPress listings or real partners.
export const DIRECTORY_DEMO_COMPANIES: DirectoryCompany[] = [
  { id: "demo-geologue-tana", name: "Atelier Géologie Tana (démo)", initial: "G", color: "#b68a54", location: "Antananarivo", regions: ["Analamanga"], cities: ["Antananarivo"], industry: "Géologue consultant", description: "Études de terrain, identification de minéraux et accompagnement technique pour les projets locaux. Profil fictif destiné à la démonstration.", phone: "Non communiqué", email: "Non communiqué" },
  { id: "demo-labo-tana", name: "Laboratoire Minéral Tana (démo)", initial: "L", color: "#4e706c", location: "Antananarivo", regions: ["Analamanga"], cities: ["Antananarivo"], industry: "Laboratoire d'analyse", description: "Analyses et caractérisation d'échantillons minéraux. Profil fictif destiné à la démonstration.", phone: "Non communiqué", email: "Non communiqué" },
  { id: "demo-conseil-antsirabe", name: "Conseil Ressources Vakinankaratra (démo)", initial: "C", color: "#836f58", location: "Antsirabe", regions: ["Vakinankaratra"], cities: ["Antsirabe"], industry: "Conseil minier", description: "Orientation documentaire et préparation des projets d'exploitation. Profil fictif destiné à la démonstration.", phone: "Non communiqué", email: "Non communiqué" },
  { id: "demo-gemmologue-antsirabe", name: "Étude Gemmes Antsirabe (démo)", initial: "E", color: "#8e736f", location: "Antsirabe", regions: ["Vakinankaratra"], cities: ["Antsirabe"], industry: "Gemmologue", description: "Observation et description de pierres pour les collectionneurs et professionnels. Profil fictif destiné à la démonstration.", phone: "Non communiqué", email: "Non communiqué" },
  { id: "demo-geologue-tamatave", name: "Terrain & Roches Est (démo)", initial: "T", color: "#557d77", location: "Toamasina", regions: ["Atsinanana"], cities: ["Toamasina"], industry: "Géologue consultant", description: "Reconnaissance géologique et suivi de terrain dans l'est de Madagascar. Profil fictif destiné à la démonstration.", phone: "Non communiqué", email: "Non communiqué" },
  { id: "demo-labo-tamatave", name: "Analyses Côtières (démo)", initial: "A", color: "#46716c", location: "Toamasina", regions: ["Atsinanana"], cities: ["Toamasina"], industry: "Laboratoire d'analyse", description: "Préparation et analyse d'échantillons pour les études de prospection. Profil fictif destiné à la démonstration.", phone: "Non communiqué", email: "Non communiqué" },
  { id: "demo-conseil-fianar", name: "Cabinet Hautes Terres Sud (démo)", initial: "H", color: "#9b7658", location: "Fianarantsoa", regions: ["Haute Matsiatra"], cities: ["Fianarantsoa"], industry: "Conseil minier", description: "Accompagnement méthodologique des acteurs du secteur minier. Profil fictif destiné à la démonstration.", phone: "Non communiqué", email: "Non communiqué" },
  { id: "demo-geologue-fianar", name: "Géosciences Matsiatra (démo)", initial: "M", color: "#657b64", location: "Fianarantsoa", regions: ["Haute Matsiatra"], cities: ["Fianarantsoa"], industry: "Géologue consultant", description: "Cartographie et conseil géologique dans la région Haute Matsiatra. Profil fictif destiné à la démonstration.", phone: "Non communiqué", email: "Non communiqué" },
];

export const DIRECTORY_DEMO_CATEGORIES = ["Tous", ...new Set(DIRECTORY_DEMO_COMPANIES.map((company) => company.industry))];
export const DIRECTORY_DEMO_REGIONS = [...new Set(DIRECTORY_DEMO_COMPANIES.flatMap((company) => company.regions))];
export const DIRECTORY_DEMO_CITIES_BY_REGION = DIRECTORY_DEMO_COMPANIES.reduce<Record<string, string[]>>((accumulator, company) => {
  for (const region of company.regions) {
    accumulator[region] = [...new Set([...(accumulator[region] || []), ...company.cities])];
  }
  return accumulator;
}, {});
