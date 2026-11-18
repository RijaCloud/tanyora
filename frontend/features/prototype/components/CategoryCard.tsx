// @ts-nocheck
"use client";

import { ArrowRight } from 'lucide-react';
import { Link } from "@/features/prototype/router-compat";

interface CategoryCardProps {
  image: string;
  title: string;
  description: string;
  link: string;
}

export function CategoryCard({ image, title, description, link }: CategoryCardProps) {
  return (
    <Link 
      to={link}
      className="relative rounded-[20px] overflow-hidden h-[240px] cursor-pointer group transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl block"
    >
      {/* Background Image with Scale Effect */}
      <div 
        className="absolute inset-0 transition-transform duration-300 ease-in-out group-hover:scale-105"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>
      
      <div className="absolute inset-0 p-6 flex flex-col justify-end text-white z-10">
        <h3 className="font-bold text-[20px] mb-2">
          {title}
        </h3>
        <p className="text-sm mb-4 opacity-90 line-clamp-2">
          {description}
        </p>
        <div 
          className="inline-flex items-center gap-2 text-[#27624f] transition-all duration-300 ease-in-out group-hover:gap-3"
        >
          <span className="text-white">Lire Plus</span>
          <ArrowRight className="w-5 h-5 text-[#27624f]" />
        </div>
      </div>
    </Link>
  );
}