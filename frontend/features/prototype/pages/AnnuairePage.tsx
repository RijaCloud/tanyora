// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import clsx from "clsx";
import svgPaths from "@/features/prototype/imports/svg-h6eue3h5ci";
import { buildListingSlug } from "@/lib/listings/slug";
import { extractPlainTextFromListingHtml } from "@/lib/content/listing-html";
import { formatRelativeTime } from "@/lib/dates/formatRelativeTime";
const imgAds3 = "/prototype-assets/0c81bdc5da5af2c126817a91e92fcc5d963eb4c6.png";
const imgAds02 = "/prototype-assets/5b10018d9d1c3cba1693af46cf071bfb676ebdee.png";
const imgAds4 = "/prototype-assets/f7f85b12cbfa7c7b47238d957537b7e5b33be8e5.png";
const imgRectangle4848 = "/prototype-assets/47b7587af10d29e7ce1f438f34a26475dd52c698.png";
import DetailsCard from "@/features/prototype/imports/DetailsCard";

// Industry categories for filtering
const industries = [
  "Tous",
  "Informatique",
  "Construction",
  "Services",
  "Commerce",
  "Transport",
  "Consulting",
  "Industrie",
  "Tourisme"
];

// Company sizes for filtering
const companySizes = [
  "TPE (1-10)",
  "PME (11-50)",
  "Moyenne (51-250)",
  "Grande (250+)"
];

// Locations for filtering
const locations = [
  "Antananarivo",
  "Toamasina",
  "Fianarantsoa",
  "Mahajanga",
  "Toliara",
  "Antsiranana",
  "Antsirabe",
  "Nosy Be",
  "Sainte-Marie",
  "Fort-Dauphin"
];

// Company data
interface CompanyData {
  id: number;
  name: string;
  nameLetter: string;
  nameColor: string;
  location: string;
  industry: string;
  description: string;
  phone: string;
  email: string;
  website?: string;
  thumbnail: string;
  featured?: boolean;
}

interface CompanyJobPreview {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  date: string;
  category: string;
  slug?: string;
  ownerWpUserId?: number;
}

const companiesData: CompanyData[] = [
  { id: 1, name: "BTP Construct", nameLetter: "B", nameColor: "#22c55e", location: "Antananarivo", industry: "Construction", description: "Leader dans la construction de bâtiments commerciaux et résidentiels à Madagascar depuis 15 ans", phone: "+261 20 22 345 67", email: "contact@btpconstruct.mg", website: "www.btpconstruct.mg", thumbnail: "https://images.unsplash.com/photo-1630259970029-7b1e1160243e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBidWlsZGluZyUyMHNpdGV8ZW58MXx8fHwxNzcxOTA1NTQzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", featured: true },
  { id: 2, name: "Madagascar Infra", nameLetter: "M", nameColor: "#fb923c", location: "Toamasina", industry: "Construction", description: "Spécialiste des infrastructures routières et autoroutières, expert en génie civil", phone: "+261 20 53 123 45", email: "info@madainfra.mg", thumbnail: "https://images.unsplash.com/photo-1611706313843-ff7e42b84e9d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2FkJTIwaW5mcmFzdHJ1Y3R1cmUlMjBoaWdod2F5fGVufDF8fHx8MTc3MTk2MjcxOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", featured: false },
  { id: 3, name: "TechSolutions MG", nameLetter: "T", nameColor: "#27624f", location: "Fianarantsoa", industry: "Informatique", description: "Développement logiciel, solutions cloud et services IT pour entreprises malgaches", phone: "+261 34 56 789 01", email: "hello@techsolutions.mg", website: "www.techsolutions.mg", thumbnail: "https://images.unsplash.com/photo-1616386261012-8a328c89d5b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwb2ZmaWNlJTIwd29ya3NwYWNlfGVufDF8fHx8MTc3MTk0NzIxMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", featured: true },
  { id: 4, name: "Hôtellerie Premium", nameLetter: "H", nameColor: "#3b82f6", location: "Nosy Be", industry: "Tourisme", description: "Chaîne d'hôtels de luxe spécialisée dans le tourisme balnéaire et écotourisme", phone: "+261 20 86 234 56", email: "reservations@hotelpremium.mg", thumbnail: "https://images.unsplash.com/photo-1729673766564-618fce6c835e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXNvcnQlMjBob3RlbHxlbnwxfHx8fDE3NzE5NjI3MTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", featured: false },
  { id: 5, name: "AgriMad Group", nameLetter: "A", nameColor: "#22c55e", location: "Antsirabe", industry: "Industrie", description: "Transformation agro-alimentaire, production et exportation de produits malgaches", phone: "+261 34 12 345 67", email: "contact@agrimad.mg", thumbnail: "https://images.unsplash.com/photo-1765897569589-effcccec14d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwZmFjdG9yeSUyMG1hbnVmYWN0dXJpbmd8ZW58MXx8fHwxNzcxODY2MTcwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", featured: false },
  { id: 6, name: "EnergyPlus", nameLetter: "E", nameColor: "#14b8a6", location: "Antananarivo", industry: "Consulting", description: "Bureau d'études en énergie renouvelable et efficacité énergétique", phone: "+261 33 98 765 43", email: "info@energyplus.mg", website: "www.energyplus.mg", thumbnail: "https://images.unsplash.com/photo-1545209575-704d1434f9cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2xhciUyMGVuZXJneSUyMHBhbmVsc3xlbnwxfHx8fDE3NzE5NjI3MTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", featured: true },
  { id: 7, name: "HealthCare MG", nameLetter: "H", nameColor: "#8b5cf6", location: "Toamasina", industry: "Services", description: "Clinique privée moderne offrant des soins de qualité et équipements médicaux avancés", phone: "+261 20 53 876 54", email: "accueil@healthcaremg.mg", thumbnail: "https://images.unsplash.com/photo-1758691461516-7e716e0ca135?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwY2xpbmljJTIwbWVkaWNhbHxlbnwxfHx8fDE3NzE5NjI3MTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", featured: false },
  { id: 8, name: "Éduc Formation", nameLetter: "E", nameColor: "#f59e0b", location: "Fianarantsoa", industry: "Services", description: "Centre de formation professionnelle certifié proposant plus de 30 programmes", phone: "+261 34 67 890 12", email: "inscription@educformation.mg", thumbnail: "https://images.unsplash.com/photo-1758691736067-b309ee3ef7b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjB0cmFpbmluZyUyMGNsYXNzcm9vbXxlbnwxfHx8fDE3NzE5NjI3MTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", featured: true },
  { id: 9, name: "LogiTransport", nameLetter: "L", nameColor: "#ec4899", location: "Mahajanga", industry: "Transport", description: "Solutions logistiques complètes, transport de marchandises national et international", phone: "+261 20 62 345 78", email: "operations@logitransport.mg", thumbnail: "https://images.unsplash.com/photo-1761666519980-e29488141562?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb2dpc3RpY3MlMjB0cmFuc3BvcnQlMjB0cnVja3N8ZW58MXx8fHwxNzcxOTYyNzEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", featured: false },
  { id: 10, name: "GreenBuilding", nameLetter: "G", nameColor: "black", location: "Antsiranana", industry: "Construction", description: "Architecture et construction écologique, projets durables et certifiés", phone: "+261 32 45 678 90", email: "contact@greenbuilding.mg", website: "www.greenbuilding.mg", thumbnail: "https://images.unsplash.com/photo-1619006323463-d4e1434612d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMGFyY2hpdGVjdHVyZSUyMGJ1aWxkaW5nfGVufDF8fHx8MTc3MTk2MjcxOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", featured: false },
  { id: 11, name: "SecuriTech", nameLetter: "S", nameColor: "#27624f", location: "Antananarivo", industry: "Informatique", description: "Solutions de sécurité informatique, surveillance vidéo et systèmes d'alarme", phone: "+261 33 12 345 67", email: "security@securitech.mg", thumbnail: "https://images.unsplash.com/photo-1765121689322-6befc57dc8db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWN1cml0eSUyMHRlY2hub2xvZ3klMjBzdXJ2ZWlsbGFuY2V8ZW58MXx8fHwxNzcxOTYyNzE5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", featured: true },
  { id: 12, name: "WaterWorks", nameLetter: "W", nameColor: "#3b82f6", location: "Toliara", industry: "Services", description: "Ingénierie hydraulique, installation et maintenance de réseaux d'eau potable", phone: "+261 20 94 567 89", email: "info@waterworks.mg", thumbnail: "https://images.unsplash.com/photo-1770048924540-e6311d4308ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlciUyMGluZnJhc3RydWN0dXJlJTIwZW5naW5lZXJpbmd8ZW58MXx8fHwxNzcxOTYyNzE5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", featured: false },
  { id: 13, name: "RetailMada", nameLetter: "R", nameColor: "#22c55e", location: "Antsirabe", industry: "Commerce", description: "Chaîne de distribution et centres commerciaux modernes à travers Madagascar", phone: "+261 34 23 456 78", email: "contact@retailmada.mg", thumbnail: "https://images.unsplash.com/photo-1595879171931-4ca27febc4bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXRhaWwlMjBzaG9wcGluZyUyMG1hbGx8ZW58MXx8fHwxNzcxOTYyNzE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", featured: false },
  { id: 14, name: "TourismDev", nameLetter: "T", nameColor: "#fb923c", location: "Sainte-Marie", industry: "Tourisme", description: "Agence de développement touristique, resorts et activités écotouristiques", phone: "+261 32 87 654 32", email: "info@tourismdev.mg", website: "www.tourismdev.mg", thumbnail: "https://images.unsplash.com/photo-1558117338-aa433feb1c62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMGJlYWNoJTIwcmVzb3J0fGVufDF8fHx8MTc3MTkzMzQxOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", featured: false },
  { id: 15, name: "MiningTech", nameLetter: "M", nameColor: "#14b8a6", location: "Fort-Dauphin", industry: "Industrie", description: "Équipements miniers, extraction responsable et technologie de pointe", phone: "+261 34 56 789 01", email: "contact@miningtech.mg", thumbnail: "https://images.unsplash.com/photo-1736664030438-251abe59a342?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbmclMjBlcXVpcG1lbnQlMjBtYWNoaW5lcnl8ZW58MXx8fHwxNzcxOTYyNzIwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", featured: true },
  { id: 16, name: "SmartCity", nameLetter: "S", nameColor: "#8b5cf6", location: "Antananarivo", industry: "Informatique", description: "Solutions IoT et smart city pour moderniser les villes malgaches", phone: "+261 33 45 678 90", email: "hello@smartcity.mg", website: "www.smartcity.mg", thumbnail: "https://images.unsplash.com/photo-1768224656445-33d078c250b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMGNpdHklMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc3MTg2OTY1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", featured: false },
  { id: 17, name: "CleanEnergy", nameLetter: "C", nameColor: "#22c55e", location: "Mahajanga", industry: "Consulting", description: "Conseil en énergies renouvelables, études de faisabilité et gestion de projets éoliens", phone: "+261 20 62 789 01", email: "info@cleanenergy.mg", thumbnail: "https://images.unsplash.com/photo-1732559207172-570f74930b07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kJTIwdHVyYmluZXMlMjBlbmVyZ3l8ZW58MXx8fHwxNzcxOTI2NTc3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", featured: false },
  { id: 18, name: "EducTech", nameLetter: "E", nameColor: "#f59e0b", location: "Antananarivo", industry: "Informatique", description: "Plateforme e-learning et technologies éducatives pour écoles et universités", phone: "+261 34 12 345 67", email: "contact@eductech.mg", thumbnail: "https://images.unsplash.com/photo-1765020553734-2c050ddb9494?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdWx0aW5nJTIwYnVzaW5lc3MlMjBtZWV0aW5nfGVufDF8fHx8MTc3MTkzMjg3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", featured: false },
];

function Union() {
  return (
    <div className="relative shrink-0 size-[15px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
        <path d={svgPaths.p1d0f4800} fill="var(--fill-0, #27624f)" id="Union" />
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents inset-[6.93%_0_6.92%_0]">
      <div className="absolute inset-[6.93%_0_6.92%_0]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.00007 11.1998">
          <path d={svgPaths.p133f400} fill="var(--fill-0, #737373)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

type LogoTextProps = {
  text: string;
  bg: string;
};

function LogoText({ text, bg }: LogoTextProps) {
  return (
    <div className="overflow-clip relative rounded-[30px] shrink-0 size-[35px]" style={{ backgroundColor: bg }}>
      <div className="-translate-y-1/2 absolute flex flex-col font-['Acumin_Pro:Bold',sans-serif] justify-center leading-[0] left-[calc(50%-4.5px)] not-italic text-[15px] text-white top-[calc(50%+2px)] whitespace-nowrap">
        <p className="leading-[15px]">{text}</p>
      </div>
    </div>
  );
}

function Ads({ className }: { className?: string }) {
  return (
    null
  );
}

// Featured "Annuaire" card
function FeaturedCard() {
  return (
    <div className="relative h-[338px] w-[236px] shrink-0 cursor-pointer group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="absolute bg-[#15181d] h-full left-0 rounded-[15.703px] top-0 w-full overflow-hidden">
        <div aria-hidden="true" className="absolute border border-[#f2f2f2] border-solid inset-0 pointer-events-none rounded-[15.703px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" />
        
        <div className="absolute content-stretch flex flex-col gap-[13.086px] items-center justify-end left-[5px] top-[5px] right-[5px] bottom-[5px]">
          <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-[12px] w-full">
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[12px]">
              <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgRectangle4848} />
              <div className="absolute bg-gradient-to-b from-[50.251%] from-[rgba(21,24,29,0)] inset-0 rounded-[12px] to-[#15181d]" />
            </div>
          </div>
          <div className="relative shrink-0 w-full">
            <div className="content-stretch flex flex-col gap-[13.086px] items-start leading-[0] not-italic px-[15px] pb-[5px] relative w-full">
              <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center relative shrink-0 text-[24px] text-white w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="leading-[16px] whitespace-pre-wrap">Annuaires</p>
              </div>
              <div className="flex flex-col font-['Roboto_Flex:Medium',sans-serif] font-medium justify-center relative shrink-0 text-[#a3a3a3] text-[16px] w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="leading-[normal] whitespace-pre-wrap">{`Le carnet d'adresses qui fait la différence. `}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility Card for Pharmacie de Garde
function PharmacieCard({ onClick }: { onClick?: () => void }) {
  return (
    <div onClick={onClick} className="bg-white h-[338px] relative rounded-[12px] shrink-0 w-[218px] cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group overflow-hidden">
      <div aria-hidden="true" className="absolute border-[2px] border-[#f2f2f2] border-solid inset-0 pointer-events-none rounded-[12px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" />
      
      <div className="flex flex-col gap-[20px] p-[5px] h-full">
        {/* Thumbnail Image */}
        <div className="h-[135px] w-full rounded-[6px] overflow-hidden shrink-0">
          <img src="https://images.unsplash.com/photo-1771315763139-629702d6c49e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaGFybWFjeSUyMG1lZGljYWwlMjBncmVlbiUyMGNyb3NzfGVufDF8fHx8MTc3MTk2NTMxN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" alt="Pharmacie de Garde" className="w-full h-full object-cover" />
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-[20px] px-[14px] pb-[14px] flex-1">
          {/* Profile - Logo + Title */}
          <div className="flex gap-[10px] items-center w-full">
            <div className="overflow-clip relative rounded-[30px] shrink-0 size-[35px] bg-[#22c55e]">
              <div className="absolute flex items-center justify-center size-full">
                <svg className="w-[20px] h-[20px]" fill="white" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                </svg>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="leading-[normal] whitespace-pre-wrap">Pharmacie de Garde</p>
              </div>
            </div>
          </div>

          {/* Blog texte section */}
          <div className="flex flex-col gap-[10px] flex-1">
            {/* Description */}
            <div className="flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center text-[#0a0a0a] text-[12px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
              <p className="leading-[normal] line-clamp-2">Trouvez rapidement les pharmacies ouvertes 24h/24 et services d'urgence</p>
            </div>

            {/* Contact info */}
            <div className="flex flex-col gap-2 mt-auto">
              <div className="flex items-center gap-2">
                <svg className="w-[14px] h-[14px] shrink-0" fill="#27624f" viewBox="0 0 24 24">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
                <p className="font-['Roboto_Flex:Medium',sans-serif] font-medium text-[11px] text-[#27624f]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  +261 20 22 XXX XX
                </p>
              </div>
              <div className="inline-flex items-center gap-1 bg-[#dcfce7] px-2 py-1 rounded-md">
                <span style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="text-[10px] font-['Roboto_Flex:Medium',sans-serif] font-medium text-[#16a34a] whitespace-nowrap">
                  Service d'urgence
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility Card for Agence JIRAMA
function JiramaCard({ onClick }: { onClick?: () => void }) {
  return (
    <div onClick={onClick} className="bg-white h-[338px] relative rounded-[12px] shrink-0 w-[218px] cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group overflow-hidden">
      <div aria-hidden="true" className="absolute border-[2px] border-[#f2f2f2] border-solid inset-0 pointer-events-none rounded-[12px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" />
      
      <div className="flex flex-col gap-[20px] p-[5px] h-full">
        {/* Thumbnail Image */}
        <div className="h-[135px] w-full rounded-[6px] overflow-hidden shrink-0">
          <img src="https://images.unsplash.com/photo-1768120234482-12c6450dcf4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2l0eSUyMHBvd2VyJTIwdXRpbGl0eSUyMGluZnJhc3RydWN0dXJlfGVufDF8fHx8MTc3MTk2NTMxOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" alt="Agence JIRAMA" className="w-full h-full object-cover" />
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-[20px] px-[14px] pb-[14px] flex-1">
          {/* Profile - Logo + Title */}
          <div className="flex gap-[10px] items-center w-full">
            <div className="overflow-clip relative rounded-[30px] shrink-0 size-[35px] bg-[#3b82f6]">
              <div className="absolute flex items-center justify-center size-full">
                <svg className="w-[20px] h-[20px]" fill="white" viewBox="0 0 24 24">
                  <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                </svg>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="leading-[normal] whitespace-pre-wrap">Agence JIRAMA</p>
              </div>
            </div>
          </div>

          {/* Blog texte section */}
          <div className="flex flex-col gap-[10px] flex-1">
            {/* Description */}
            <div className="flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center text-[#0a0a0a] text-[12px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
              <p className="leading-[normal] line-clamp-2">Services d'eau et d'électricité - Contacts des agences JIRAMA</p>
            </div>

            {/* Contact info */}
            <div className="flex flex-col gap-2 mt-auto">
              <div className="flex items-center gap-2">
                <svg className="w-[14px] h-[14px] shrink-0" fill="#27624f" viewBox="0 0 24 24">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
                <p className="font-['Roboto_Flex:Medium',sans-serif] font-medium text-[11px] text-[#27624f]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  +261 20 22 XXX XX
                </p>
              </div>
              <div className="inline-flex items-center gap-1 bg-[#dbeafe] px-2 py-1 rounded-md">
                <span style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="text-[10px] font-['Roboto_Flex:Medium',sans-serif] font-medium text-[#2563eb] whitespace-nowrap">
                  Services publics
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility Card for Numero d'urgence
function UrgenceCard({ onClick }: { onClick?: () => void }) {
  return (
    <div onClick={onClick} className="bg-white h-[338px] relative rounded-[12px] shrink-0 w-[218px] cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group overflow-hidden">
      <div aria-hidden="true" className="absolute border-[2px] border-[#f2f2f2] border-solid inset-0 pointer-events-none rounded-[12px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" />
      
      <div className="flex flex-col gap-[20px] p-[5px] h-full">
        {/* Thumbnail Image */}
        <div className="h-[135px] w-full rounded-[6px] overflow-hidden shrink-0">
          <img src="https://images.unsplash.com/photo-1767990375666-8df94ab0f9e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbWVyZ2VuY3klMjBhbWJ1bGFuY2UlMjByZWQlMjBsaWdodHN8ZW58MXx8fHwxNzcxOTY1MzE4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" alt="Numero d'urgence" className="w-full h-full object-cover" />
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-[20px] px-[14px] pb-[14px] flex-1">
          {/* Profile - Logo + Title */}
          <div className="flex gap-[10px] items-center w-full">
            <div className="overflow-clip relative rounded-[30px] shrink-0 size-[35px] bg-[#27624f]">
              <div className="absolute flex items-center justify-center size-full">
                <svg className="w-[20px] h-[20px]" fill="white" viewBox="0 0 24 24">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="leading-[normal] whitespace-pre-wrap">Numéro d'urgence</p>
              </div>
            </div>
          </div>

          {/* Blog texte section */}
          <div className="flex flex-col gap-[10px] flex-1">
            {/* Description */}
            <div className="flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center text-[#0a0a0a] text-[12px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
              <p className="leading-[normal] line-clamp-2">Police, pompiers, SAMU - Tous les numéros d'urgence essentiels</p>
            </div>

            {/* Contact info */}
            <div className="flex flex-col gap-2 mt-auto">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <svg className="w-[14px] h-[14px] shrink-0" fill="#27624f" viewBox="0 0 24 24">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                  </svg>
                  <p className="font-['Roboto_Flex:Bold',sans-serif] font-bold text-[13px] text-[#27624f]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    117 • 18 • 124
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 bg-[#fee2e2] px-2 py-1 rounded-md">
                <span style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="text-[10px] font-['Roboto_Flex:Medium',sans-serif] font-medium text-[#dc2626] whitespace-nowrap">
                  Urgences
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small Company Card (338px height for sponsored section)
function SmallCompanyCard({ company, onClick }: { company: CompanyData; onClick?: () => void }) {
  return (
    <div onClick={onClick} className="bg-white h-[338px] relative rounded-[12px] shrink-0 w-[218px] cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group overflow-hidden">
      <div aria-hidden="true" className="absolute border-[2px] border-[#f2f2f2] border-solid inset-0 pointer-events-none rounded-[12px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" />
      
      <div className="flex flex-col gap-[20px] p-[5px] h-full">
        {/* Thumbnail Image */}
        <div className="h-[135px] w-full rounded-[6px] overflow-hidden shrink-0">
          <img src={company.thumbnail} alt={company.name} className="w-full h-full object-cover" />
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-[20px] px-[14px] pb-[14px] flex-1">
          {/* Profile - Logo + Company Name */}
          <div className="flex gap-[10px] items-center w-full">
            <LogoText text={company.nameLetter} bg={company.nameColor} />
            <div className="flex-1 overflow-hidden">
              <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="leading-[normal] whitespace-pre-wrap">{company.name}</p>
              </div>
            </div>
          </div>

          {/* Blog texte section */}
          <div className="flex flex-col gap-[10px] flex-1">
            {/* Description */}
            <div className="flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center text-[#0a0a0a] text-[12px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
              <p className="leading-[normal] line-clamp-2">{company.description}</p>
            </div>

            {/* Location info */}
            <div className="flex items-center gap-1">
              <div className="h-[12px] relative shrink-0 w-[13px]">
                <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]">
                  <Group />
                </div>
              </div>
              <p className="font-['Roboto_Flex:Regular',sans-serif] font-normal text-[12px] text-[#737373]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                {company.location}
              </p>
            </div>

            {/* Bottom section with industry badge and featured badge */}
            <div className="flex items-center justify-between w-full mt-auto">
              <div className="inline-flex items-center gap-1 bg-[#f5f5f5] px-2 py-1 rounded-md">
                <span style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="text-[10px] font-['Roboto_Flex:Regular',sans-serif] font-normal text-[#737373] whitespace-nowrap">
                  {company.industry}
                </span>
              </div>
              {company.featured && (
                <div className="shrink-0">
                  <Union />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Regular Company Card (for main grid)
function CompanyCard({ company, onClick }: { company: CompanyData; onClick?: () => void }) {
  return (
    <div onClick={onClick} className="bg-white h-[338px] relative rounded-[12px] shrink-0 w-[218px] cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group overflow-hidden">
      <div aria-hidden="true" className="absolute border-[2px] border-[#f2f2f2] border-solid inset-0 pointer-events-none rounded-[12px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" />
      
      <div className="flex flex-col gap-[20px] p-[5px] h-full">
        {/* Thumbnail Image */}
        <div className="h-[135px] w-full rounded-[6px] overflow-hidden shrink-0">
          <img src={company.thumbnail} alt={company.name} className="w-full h-full object-cover" />
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-[20px] px-[14px] pb-[14px] flex-1">
          {/* Profile - Logo + Company Name */}
          <div className="flex gap-[10px] items-center w-full">
            <LogoText text={company.nameLetter} bg={company.nameColor} />
            <div className="flex-1 overflow-hidden">
              <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center text-[#0a0a0a] text-[14px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="leading-[normal] whitespace-pre-wrap">{company.name}</p>
              </div>
            </div>
          </div>

          {/* Blog texte section */}
          <div className="flex flex-col gap-[10px] flex-1">
            {/* Description */}
            <div className="flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center text-[#0a0a0a] text-[12px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
              <p className="leading-[normal] line-clamp-2">{company.description}</p>
            </div>

            {/* Location info */}
            <div className="flex items-center gap-1">
              <div className="h-[12px] relative shrink-0 w-[13px]">
                <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]">
                  <Group />
                </div>
              </div>
              <p className="font-['Roboto_Flex:Regular',sans-serif] font-normal text-[12px] text-[#737373]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                {company.location}
              </p>
            </div>

            {/* Bottom section with industry badge and featured badge */}
            <div className="flex items-center justify-between w-full mt-auto">
              <div className="inline-flex items-center gap-1 bg-[#f5f5f5] px-2 py-1 rounded-md">
                <span style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="text-[10px] font-['Roboto_Flex:Regular',sans-serif] font-normal text-[#737373] whitespace-nowrap">
                  {company.industry}
                </span>
              </div>
              {company.featured && (
                <div className="shrink-0">
                  <Union />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnnuairePage() {
  const [selectedIndustry, setSelectedIndustry] = useState("Tous");
  const [isIndustriesOpen, setIsIndustriesOpen] = useState(true);
  const [isSizeOpen, setIsSizeOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [companyJobs, setCompanyJobs] = useState<CompanyJobPreview[]>([]);
  const [companyJobsLoading, setCompanyJobsLoading] = useState(false);
  const [companyJobsError, setCompanyJobsError] = useState("");

  const filteredCompanies = selectedIndustry === "Tous"
    ? companiesData
    : companiesData.filter(company => company.industry === selectedIndustry);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedCompany) {
        setSelectedCompany(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedCompany]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (selectedCompany) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedCompany]);

  useEffect(() => {
    const companyName = String(selectedCompany?.name || "").trim();
    if (!companyName) {
      setCompanyJobs([]);
      setCompanyJobsError("");
      setCompanyJobsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadCompanyJobs() {
      setCompanyJobsLoading(true);
      setCompanyJobsError("");

      try {
        const response = await fetch(`/api/public/listings/job?search=${encodeURIComponent(companyName)}&perPage=12`, {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger les offres d'emploi.");
        }
        if (cancelled) {
          return;
        }

        const normalizedCompanyName = companyName.trim().toLowerCase();
        const nextJobs = Array.isArray(payload?.items)
          ? payload.items
              .filter((item: any) => String(item?.companyName || "").trim().toLowerCase() === normalizedCompanyName)
              .map((item: any) => ({
                id: Number(item?.id || 0),
                title: String(item?.title || "Offre d'emploi"),
                company: String(item?.companyName || companyName),
                location: String(item?.location || "Madagascar"),
                description: extractPlainTextFromListingHtml(String(item?.description || item?.content || "")),
                date: String(item?.date || ""),
                category: String(item?.category || ""),
                slug: String(item?.slug || ""),
                ownerWpUserId: Number(item?.ownerWpUserId || 0),
              }))
              .filter((item: CompanyJobPreview) => item.id > 0)
          : [];

        setCompanyJobs(nextJobs.slice(0, 3));
      } catch (error: any) {
        if (cancelled) {
          return;
        }
        setCompanyJobs([]);
        setCompanyJobsError(error?.message || "Impossible de charger les offres d'emploi.");
      } finally {
        if (!cancelled) {
          setCompanyJobsLoading(false);
        }
      }
    }

    void loadCompanyJobs();

    return () => {
      cancelled = true;
    };
  }, [selectedCompany]);

  return (
    <div className="bg-white dark:bg-[#1a1a1a] relative w-full min-h-screen pb-[50px] transition-colors duration-300">
      <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-center left-1/2 px-[32px] top-0 w-[1440px]">
        {/* SPONSORISÉS Section */}
        <div className="content-stretch flex flex-col gap-[16px] items-end relative shrink-0 w-[1376px] pt-[20px]">
          <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[normal] not-italic relative shrink-0 text-[12px] text-black text-right uppercase w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
            
          </div>
          
          {/* Sponsored Cards Row */}
          <div className="flex gap-[14px] items-start w-full overflow-x-auto py-2">
            <FeaturedCard />
            <PharmacieCard onClick={() => {}} />
            <JiramaCard onClick={() => {}} />
            <UrgenceCard onClick={() => {}} />
            <Ads className="bg-[#27624f] h-[338px] relative rounded-[12px] shrink-0 w-[218px] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer" />
          </div>
        </div>

        {/* PUBLICITÉ Banner Section */}
        <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[1376px] pt-[32px]">
          <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[normal] not-italic relative shrink-0 text-[12px] text-[#737373] dark:text-[#a3a3a3] uppercase w-full transition-colors duration-300" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
            <p className="leading-[1.4]">PUBLICITÉ</p>
          </div>
          
          {/* Three Banner Ads */}
          <div className="flex gap-[14px] items-start w-full">
            <div className="h-[116px] relative rounded-[12px] flex-1 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
              <img src={imgAds3} alt="Ad" className="w-full h-full object-cover" />
            </div>
            <div className="h-[116px] relative rounded-[12px] flex-1 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
              <img src={imgAds02} alt="Ad" className="w-full h-full object-cover" />
            </div>
            <div className="h-[116px] relative rounded-[12px] flex-1 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
              <img src={imgAds4} alt="Ad" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Main Content: Sidebar + Company List */}
        <div className="content-stretch flex gap-[14px] items-start relative shrink-0 w-[1376px] pt-[32px]">
          
          {/* Sidebar Filters */}
          <div className="listing-filter-panel prototype-listing-sidebar bg-[#fcfcfc] dark:bg-[#2a2a2a] content-stretch flex flex-col items-start relative rounded-[12px] shrink-0 w-[202px] transition-colors duration-300">
            <div className="relative w-full">
              <div aria-hidden="true" className="absolute border-[#e8e8e8] dark:border-[#404040] border-r border-solid inset-0 pointer-events-none rounded-[12px] transition-colors duration-300" />
              <div className="content-stretch flex flex-col items-start relative w-full">
                
                {/* Secteurs Section */}
                <div className="relative shrink-0 w-full pt-[12px]">
                  <button
                    onClick={() => setIsIndustriesOpen(!isIndustriesOpen)}
                    className="content-stretch flex flex-col items-start pl-[10px] pr-[16px] relative w-full"
                  >
                    <div className="h-[32px] relative shrink-0 w-full">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[5px] items-center relative size-full">
                        <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative">
                          <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[1.2] not-italic relative shrink-0 text-[#191919] dark:text-white text-[12px] whitespace-nowrap transition-colors duration-300" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                            <p className="leading-[1.2]">Secteurs</p>
                          </div>
                        </div>
                        <svg className={`w-[10px] h-[10px] transition-transform duration-300 ease-in-out ${isIndustriesOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 10 10">
                          <path d={svgPaths.p9344b80} className="fill-[#474747] dark:fill-white transition-colors duration-300" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Industries List */}
                  <div className={`relative shrink-0 w-full overflow-hidden transition-all duration-300 ease-in-out ${isIndustriesOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div aria-hidden="true" className="absolute border-[#e8e8e8] dark:border-[#404040] border-solid border-t inset-0 pointer-events-none transition-colors duration-300" />
                    <div className="content-stretch flex flex-col items-start pb-[10px] pl-[10px] pr-[15px] pt-[11px] relative w-full">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6px] items-start py-[6px] relative w-full">
                        {industries.map((industry) => {
                          const isActive = selectedIndustry === industry;
                          return (
                            <button
                              key={industry}
                              onClick={() => setSelectedIndustry(industry)}
                              className="content-stretch flex flex-col items-start relative shrink-0 w-full cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3a3a] rounded-md px-2 py-1.5 transition-all duration-200 ease-in-out text-left group"
                            >
                              <div className="relative shrink-0 w-full">
                                <div className="content-stretch flex items-start pl-[25px] pt-[2px] relative w-full">
                                  <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={`flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[1.4] not-italic relative shrink-0 text-[12px] transition-colors duration-200 ease-in-out ${isActive ? 'text-[#171717] dark:text-white font-medium' : 'text-[#171717] dark:text-[#e5e5e5] group-hover:text-[#27624f]'}`}>
                                    <p className="leading-[1.4] whitespace-nowrap overflow-hidden text-ellipsis">{industry}</p>
                                  </div>
                                </div>
                                
                                {/* Radio Button */}
                                <div className="absolute left-0 size-[16px] top-[2.49px] transition-all duration-200 ease-in-out">
                                  <div className={`-translate-y-1/2 absolute bg-white dark:bg-[#2a2a2a] border ${
                                    isActive ? 'border-[#27624f]' : 'border-[#d4d4d4] dark:border-[#555] group-hover:border-[#27624f]'
                                  } rounded-full size-full top-[calc(50%+2px)] transition-colors duration-200 ease-in-out`}>
                                    {isActive && (
                                      <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[#27624f] left-1/2 rounded-full size-[8px] top-1/2" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Taille Section */}
                <div className="relative shrink-0 w-full">
                  <button
                    onClick={() => setIsSizeOpen(!isSizeOpen)}
                    className="content-stretch flex flex-col items-start pl-[10px] pr-[16px] relative w-full"
                  >
                    <div className="h-[32px] relative shrink-0 w-full">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[5px] items-center relative size-full">
                        <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative">
                          <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[1.2] not-italic relative shrink-0 text-[#191919] dark:text-white text-[12px] whitespace-nowrap transition-colors duration-300" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                            <p className="leading-[1.2]">Taille</p>
                          </div>
                        </div>
                        <svg className={`w-[10px] h-[10px] transition-transform duration-200 ${isSizeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 10 10">
                          <path d={svgPaths.p9344b80} className="fill-[#474747] dark:fill-white transition-colors duration-300" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Size List */}
                  <div className={`relative shrink-0 w-full overflow-hidden transition-all duration-300 ease-in-out ${isSizeOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div aria-hidden="true" className="absolute border-[#e8e8e8] dark:border-[#404040] border-solid border-t inset-0 pointer-events-none transition-colors duration-300" />
                    <div className="content-stretch flex flex-col items-start pb-[10px] pl-[10px] pr-[15px] pt-[11px] relative w-full">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6px] items-start py-[6px] relative w-full">
                        {companySizes.map((size) => (
                          <button
                            key={size}
                            className="content-stretch flex flex-col items-start relative shrink-0 w-full cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3a3a] rounded-md px-2 py-1.5 transition-all duration-200 ease-in-out text-left group"
                          >
                            <div className="relative shrink-0 w-full">
                              <div className="content-stretch flex items-start pl-[25px] pt-[2px] relative w-full">
                                <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[1.4] not-italic relative shrink-0 text-[#171717] dark:text-[#e5e5e5] text-[12px] transition-colors duration-200 ease-in-out group-hover:text-[#27624f]">
                                  <p className="leading-[1.4] whitespace-nowrap overflow-hidden text-ellipsis">{size}</p>
                                </div>
                              </div>
                              
                              {/* Checkbox */}
                              <div className="absolute left-0 size-[16px] top-[2.49px] transition-all duration-200 ease-in-out">
                                <div className="-translate-y-1/2 absolute bg-white dark:bg-[#2a2a2a] border border-[#d4d4d4] dark:border-[#555] rounded-[4px] size-full top-[calc(50%+2px)] transition-colors duration-200 ease-in-out group-hover:border-[#27624f]" />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Localisation Section */}
                <div className="relative shrink-0 w-full pb-[12px]">
                  <button
                    onClick={() => setIsLocationOpen(!isLocationOpen)}
                    className="content-stretch flex flex-col items-start pl-[10px] pr-[16px] relative w-full"
                  >
                    <div className="h-[32px] relative shrink-0 w-full">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[5px] items-center relative size-full">
                        <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative">
                          <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[1.2] not-italic relative shrink-0 text-[#191919] dark:text-white text-[12px] whitespace-nowrap transition-colors duration-300" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                            <p className="leading-[1.2]">Localisation</p>
                          </div>
                        </div>
                        <svg className={`w-[10px] h-[10px] transition-transform duration-200 ${isLocationOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 10 10">
                          <path d={svgPaths.p9344b80} className="fill-[#474747] dark:fill-white transition-colors duration-300" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Location List */}
                  <div className={`relative shrink-0 w-full overflow-hidden transition-all duration-300 ease-in-out ${isLocationOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div aria-hidden="true" className="absolute border-[#e8e8e8] dark:border-[#404040] border-solid border-t inset-0 pointer-events-none transition-colors duration-300" />
                    <div className="content-stretch flex flex-col items-start pb-[10px] pl-[10px] pr-[15px] pt-[11px] relative w-full">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6px] items-start py-[6px] relative w-full">
                        {locations.map((location) => (
                          <button
                            key={location}
                            className="content-stretch flex flex-col items-start relative shrink-0 w-full cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3a3a] rounded-md px-2 py-1.5 transition-all duration-200 ease-in-out text-left group"
                          >
                            <div className="relative shrink-0 w-full">
                              <div className="content-stretch flex items-start pl-[25px] pt-[2px] relative w-full">
                                <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[1.4] not-italic relative shrink-0 text-[#171717] dark:text-[#e5e5e5] text-[12px] transition-colors duration-200 ease-in-out group-hover:text-[#27624f]">
                                  <p className="leading-[1.4] whitespace-nowrap overflow-hidden text-ellipsis">{location}</p>
                                </div>
                              </div>
                              
                              {/* Checkbox */}
                              <div className="absolute left-0 size-[16px] top-[2.49px] transition-all duration-200 ease-in-out">
                                <div className="-translate-y-1/2 absolute bg-white dark:bg-[#2a2a2a] border border-[#d4d4d4] dark:border-[#555] rounded-[4px] size-full top-[calc(50%+2px)] transition-colors duration-200 ease-in-out group-hover:border-[#27624f]" />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Company Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-5 gap-[14px] auto-rows-min">
              {filteredCompanies.map((company) => (
                <CompanyCard key={company.id} company={company} onClick={() => setSelectedCompany(company)} />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Modal for Company Details */}
      {selectedCompany && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedCompany(null);
            }
          }}
        >
          <div className="relative w-full max-w-[800px] max-h-[90vh] overflow-y-auto bg-white rounded-[20px]">
            {/* Close button */}
            <button
              onClick={() => setSelectedCompany(null)}
              className="absolute right-4 top-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <DetailsCard />
            <div className="px-6 pb-6">
              <div className="mb-6 rounded-[18px] border border-[#ececec] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#27624f]">Recrutement</p>
                    <h3 className="mt-2 text-[20px] font-semibold text-[#111111]">Offres d'emploi de cette entreprise</h3>
                  </div>
                  <span className="rounded-full bg-[#f5f5f5] px-3 py-1 text-[11px] font-medium text-[#525252]">
                    {companyJobsLoading ? "Chargement..." : `${companyJobs.length} offre${companyJobs.length > 1 ? "s" : ""}`}
                  </span>
                </div>

                {companyJobsLoading ? (
                  <div className="space-y-3">
                    {[0, 1].map((index) => (
                      <div key={index} className="animate-pulse rounded-[14px] border border-[#f1f1f1] p-4">
                        <div className="h-4 w-2/3 rounded bg-[#f1f1f1]" />
                        <div className="mt-3 h-3 w-1/3 rounded bg-[#f1f1f1]" />
                        <div className="mt-3 h-3 w-full rounded bg-[#f5f5f5]" />
                        <div className="mt-2 h-3 w-5/6 rounded bg-[#f5f5f5]" />
                      </div>
                    ))}
                  </div>
                ) : companyJobsError ? (
                  <div className="rounded-[14px] border border-[#f7cfd3] bg-[#fff2f3] px-4 py-3 text-[13px] text-[#8c1d24]">
                    {companyJobsError}
                  </div>
                ) : companyJobs.length > 0 ? (
                  <div className="space-y-3">
                    {companyJobs.map((job) => (
                      <a
                        key={job.id}
                        href={`/offres-emploi/${job.slug || buildListingSlug(job.id, job.title, "offre")}`}
                        className="block rounded-[14px] border border-[#ececec] p-4 transition hover:border-[#27624f] hover:bg-[#fafafa]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-[15px] font-semibold leading-[1.3] text-[#111111]">{job.title}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#737373]">
                              {job.category ? <span>{job.category}</span> : null}
                              {job.location ? <span>{job.location}</span> : null}
                              {job.date ? <span>{formatRelativeTime(job.date)}</span> : null}
                            </div>
                          </div>
                          <span className="shrink-0 text-[12px] font-semibold text-[#27624f]">Ouvrir</span>
                        </div>
                        {job.description ? (
                          <p className="mt-3 line-clamp-2 text-[13px] leading-[1.6] text-[#525252]">{job.description}</p>
                        ) : null}
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[14px] border border-dashed border-[#e5e5e5] px-4 py-4 text-[13px] text-[#737373]">
                    Aucune offre d'emploi publiée pour cette entreprise pour le moment.
                  </div>
                )}
              </div>
              <a
                href={`/offres-emploi?company=${encodeURIComponent(selectedCompany.name)}`}
                className="inline-flex w-full items-center justify-center rounded-[12px] bg-[#111111] px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-[#27624f]"
              >
                Voir les offres d'emploi de cette entreprise
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
