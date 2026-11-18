export type ClassifiedAd = {
  id: string;
  seller: string;
  sellerInitial: string;
  sellerColor: string;
  location: string;
  title: string;
  description: string;
  priceAr: number;
  dateLabel: string;
  category: string;
  featured?: boolean;
  imageUrl: string;
};