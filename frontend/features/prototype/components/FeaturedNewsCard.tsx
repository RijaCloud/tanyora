// @ts-nocheck
"use client";

import { Clock, ArrowRight } from 'lucide-react';
import { useRouter } from "next/navigation";
import { AppImage } from "@/components/ui/AppImage";
import type { NewsArticle } from "@/features/news/types";

interface FeaturedNewsCardProps {
  image: string;
  imageSources?: NewsArticle["imageSources"];
  date: string;
  categories: string[];
  title: string;
  href?: string;
  large?: boolean;
  className?: string;
}

export function FeaturedNewsCard({ image, imageSources, date, categories, title, href = "/actualites", large = false, className = "" }: FeaturedNewsCardProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={`clickable-content block relative rounded-[20px] overflow-hidden group cursor-pointer transition-all duration-500 ease-out ${ 
        large ? 'h-[440px] sm:h-[500px]' : 'h-[280px]'
      } w-full text-left ${className}`}
    >
      {/* Background Image with Scale Effect */}
      <AppImage
        src={image}
        responsiveSources={imageSources}
        sizes="(min-width: 1024px) 50vw, 100vw"
        alt=""
        eager={large}
        withLoader
        wrapperClassName="absolute inset-0"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[var(--motion-ease-standard)] group-hover:scale-[1.025]"
      />
      
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-500 ease-out group-hover:opacity-90"></div>
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 text-white z-10">
        <div className="flex items-center gap-3 mb-3">
          {categories.map((category) => (
            <span
              key={category}
              className={`backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium ${
                category === '2424 RDV' ? 'bg-[#27624f] text-white' : 'bg-white/20'
              }`}
            >
              {category}
            </span>
          ))}
        </div>
        
        {!large ? (
          <div className="flex items-center gap-2 mb-3 text-sm opacity-90">
            <Clock className="w-4 h-4" />
            <span>{date}</span>
          </div>
        ) : null}
        
        <h3 className={`font-bold mb-3 tracking-[-0.045em] ${large ? 'max-w-3xl text-[clamp(1.55rem,2.05vw,2.15rem)] leading-[1.04]' : 'text-[20px]'}`}>
          {title}
        </h3>
        
        <span className="inline-flex items-center gap-2 text-[#27624f] transition-all duration-300 ease-in-out">
          <span className="text-white">Lire Plus</span>
          <ArrowRight className="w-5 h-5 text-[#27624f]" />
        </span>
      </div>
    </button>
  );
}
