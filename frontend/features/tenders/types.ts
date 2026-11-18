export type TenderItem = {
  id: string;
  organization: string;
  organizationInitial: string;
  organizationColor: string;
  location: string;
  title: string;
  description: string;
  budgetAr: number;
  deadline: string;
  category: string;
  featured?: boolean;
};