export type Mineral = { slug: string; name: string; type: string; origin: string; weight: string; description: string; color: string };
export type Book = { slug: string; title: string; author: string; summary: string; price: number; color: string };
export type Expert = { slug: string; title: string; summary: string; specialty: string; location: string };

// Synthetic catalog for the isolated first build. No 2424 content is imported.
export const minerals: Mineral[] = [
  { slug: "quartz-rose-ambatondrazaka", name: "Quartz rose", type: "Quartz", origin: "Ambatondrazaka", weight: "2,4 kg", description: "Lot de démonstration aux nuances rosées. Caractéristiques à confirmer par le vendeur.", color: "rose" },
  { slug: "labradorite-maniry", name: "Labradorite", type: "Feldspath", origin: "Maniry", weight: "1,8 kg", description: "Spécimen de démonstration présentant des reflets bleutés.", color: "blue" },
  { slug: "celestine-mahajanga", name: "Célestine", type: "Sulfate", origin: "Mahajanga", weight: "3,1 kg", description: "Cristaux de démonstration, disponibilité à confirmer par devis.", color: "sky" },
];

export const books: Book[] = [
  { slug: "guide-des-mineraux-de-madagascar", title: "Guide des minéraux de Madagascar", author: "Équipe Tanyora", summary: "Un aperçu illustré et pédagogique des familles de minéraux.", price: 19000, color: "ochre" },
  { slug: "carnet-de-terrain", title: "Carnet de terrain", author: "Équipe Tanyora", summary: "Méthodes d'observation, notes de terrain et vocabulaire essentiel.", price: 12000, color: "green" },
];
export const experts: Expert[] = [];

const demoMode = process.env.TANYORA_DEMO_MODE !== "false";

async function catalog<T>(path: string): Promise<T> {
  const base = process.env.TANYORA_WP_URL;
  if (!base) throw new Error("TANYORA_WP_URL is required outside demo mode");
  const route = new URL(path, "http://tanyora.local/");
  const url = new URL("/", base);
  url.searchParams.set("rest_route", `/tanyora/v1${route.pathname}`);
  route.searchParams.forEach((value, key) => url.searchParams.set(key, value));
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Tanyora catalog unavailable: ${response.status}`);
  return response.json() as Promise<T>;
}

type ApiMineral = { slug: string; title: string; family: string[]; origin: string; quantity: string; unit: string; summary: string };
type ApiBook = { slug: string; title: string; author: string; price: number; summary: string };

function mineralFromApi(item: ApiMineral): Mineral {
  return { slug: item.slug, name: item.title, type: item.family?.[0] || "Minéral", origin: item.origin, weight: [item.quantity, item.unit].filter(Boolean).join(" "), description: item.summary, color: "sky" };
}

function bookFromApi(item: ApiBook): Book {
  return { slug: item.slug, title: item.title, author: item.author, summary: item.summary, price: item.price, color: "green" };
}

export async function getMinerals(): Promise<Mineral[]> {
  if (demoMode) return minerals;
  const result = await catalog<{ items: ApiMineral[] }>("minerals?per_page=24");
  return result.items.map(mineralFromApi);
}

export async function getBooks(): Promise<Book[]> {
  if (demoMode) return books;
  const result = await catalog<{ items: ApiBook[] }>("books?per_page=24");
  return result.items.map(bookFromApi);
}

export async function getExperts(): Promise<Expert[]> {
  if (demoMode) return experts;
  const result = await catalog<{ items: Expert[] }>("experts?per_page=24");
  return result.items;
}
