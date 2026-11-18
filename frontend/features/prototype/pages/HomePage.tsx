import { TanyoraHome, type TanyoraHomeListing } from "@/features/prototype/components/TanyoraHome";
import { getWordPressPublicListings } from "@/lib/api/wordpress-internal";

export default async function HomePage() {
  let initialListings: TanyoraHomeListing[] | null = null;

  try {
    const result = await getWordPressPublicListings("classified", { page: 1, perPage: 8 });
    initialListings = result.items.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      location: item.location,
      image: item.image || item.images?.[0] || "",
      price: item.price,
      currency: item.currency,
    }));
  } catch (error) {
    console.error("[home] unable to load classified listings", error);
  }

  return <TanyoraHome initialListings={initialListings} />;
}
