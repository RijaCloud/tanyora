export type DirectoryCompany = {
  id: string;
  name: string;
  initial: string;
  color: string;
  location: string;
  regions: string[];
  cities: string[];
  industry: string;
  description: string;
  phone: string;
  email: string;
  website?: string;
  featured?: boolean;
  imageUrl?: string | null;
  ownerWpUserId?: number;
  publishedJobsCount?: number;
  publishedJobsHref?: string;
};
