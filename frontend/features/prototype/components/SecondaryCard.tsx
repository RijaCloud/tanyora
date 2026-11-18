// @ts-nocheck
"use client";

import { ArrowRight, Clock, Heart, MessageCircle } from 'lucide-react';
import { useRouter } from "next/navigation";
import { AppImage } from "@/components/ui/AppImage";

interface SecondaryCardProps {
  image: string;
  date: string;
  categories: string[];
  title: string;
  text: string;
  href?: string;
  variant?: "cream" | "rose";
}

export function SecondaryCard({ image, date, categories, title, text, href = "/actualites", variant }: SecondaryCardProps) {
  const router = useRouter();

  if (variant) {
    const isCream = variant === "cream";
    return (
      <button
        type="button"
        onClick={() => router.push(href)}
        className={`clickable-content group relative block h-[220px] w-full cursor-pointer overflow-hidden rounded-[20px] text-left transition-[transform,box-shadow] duration-300 ease-[var(--motion-ease-standard)] hover:-translate-y-1 hover:shadow-[0_16px_28px_rgba(25,10,10,0.16)] ${
          isCream
            ? "bg-[var(--color-cream)] text-[var(--color-dark)]"
            : "bg-[#fdebef] text-[var(--color-dark)]"
        }`}
      >
        <div className="absolute left-5 right-5 top-4 flex items-start justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.12em]">
          <span className="line-clamp-1">{categories[0] || "Actualité"}</span>
          <span className="shrink-0">{date}</span>
        </div>
        <p className="absolute left-5 right-5 top-11 max-w-[85%] line-clamp-4 text-[clamp(1.25rem,1.75vw,1.65rem)] font-bold leading-[1.04] tracking-[-0.04em]">
          {title || text}
        </p>
        <span className="absolute bottom-5 left-5 inline-flex gap-3 opacity-45" aria-hidden="true">
          <Heart className="h-4 w-4" strokeWidth={1.8} />
          <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <span className="absolute bottom-5 right-5 grid h-10 w-10 place-items-center rounded-full bg-[var(--color-red)] text-white transition-transform duration-300 ease-[var(--motion-ease-standard)] group-hover:translate-x-0.5">
          <ArrowRight className="h-4 w-4" />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className="clickable-content group block relative h-[220px] w-full cursor-pointer overflow-hidden rounded-[20px] text-left transition-all duration-500 ease-out"
    >
      {/* Background Image with Scale Effect */}
      <AppImage
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[var(--motion-ease-standard)] group-hover:scale-[1.025]"
      />
      
      {/* Floating glass card overlay */}
      <div className="absolute inset-4 bg-white/90 backdrop-blur-md rounded-[16px] p-4 flex flex-col justify-between z-10">
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs text-[#6B6B6B]">
            <Clock className="w-3 h-3" />
            <span>{date}</span>
          </div>
          
          <div className="flex gap-2 mb-2">
            {categories.map((category) => (
              <span
                key={category}
                className="border border-black rounded-full px-2 py-0.5 text-[10px] font-bold text-black"
              >
                {category}
              </span>
            ))}
          </div>
          
          <p className="text-[#0a0a0a] text-sm line-clamp-3">
            {text}
          </p>
        </div>
        
        <span className="inline-flex items-center gap-2 text-[13px] text-black transition-all duration-300 ease-in-out">
          <span>Lire Plus</span>
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </button>
  );
}
