import { ListingFormRoute } from "@/features/profile/components/ListingFormRoute";

export default function EditJobPage({ params }: { params: { itemId: string } }) {
  return <ListingFormRoute module="jobs" mode="edit" listingId={params.itemId} />;
}
