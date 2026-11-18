import { appendListingMessage, getListingMessages, type ListingMessage } from "@/lib/messages/listing-messages";

export type ClassifiedMessage = ListingMessage;

export async function getClassifiedMessages(listingId: number): Promise<ClassifiedMessage[]> {
  return getListingMessages("classified", listingId);
}

export async function appendClassifiedMessage(message: Omit<ClassifiedMessage, "kind"> | ClassifiedMessage): Promise<ClassifiedMessage[]> {
  return appendListingMessage({
    ...message,
    kind: "classified",
  });
}
