import { ListingFormRoute } from "@/features/profile/components/ListingFormRoute";

export default function EditTenderPage({ params }: { params: { itemId: string } }) {
  return <ListingFormRoute module="tenders" mode="edit" listingId={params.itemId} />;
}
