import { ListingFormRoute } from "@/features/profile/components/ListingFormRoute";

export default function EditClassifiedPage({ params }: { params: { itemId: string } }) {
  return <ListingFormRoute module="classifieds" mode="edit" listingId={params.itemId} />;
}
