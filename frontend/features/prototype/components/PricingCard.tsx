// @ts-nocheck
"use client";

interface Feature {
  text: string;
  isNew?: boolean;
}

interface FeatureSection {
  title: string;
  features: Feature[];
}

interface PricingCardProps {
  title: string;
  price: string | number;
  period?: string;
  description: string;
  buttonText: string;
  sections: FeatureSection[];
  highlighted?: boolean;
  onSelect: () => void;
}

import { Sparkles } from 'lucide-react';
import { formatGroupedNumber } from "@/lib/pricing/format-money";

export default function PricingCard({
  title,
  price,
  period = "/mois",
  description,
  buttonText,
  sections,
  highlighted = false,
  onSelect,
}: PricingCardProps) {
  return (
    <div
      className={`bg-white rounded-[20px] p-6 flex flex-col relative transition-all duration-300 border-2 ${
        highlighted
          ? "border-[#27624f] shadow-[0_10px_40px_rgba(214,31,38,0.2)] scale-[1.02]"
          : "border-[#e5e5e5] hover:border-[#27624f] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1"
      }`}
    >
      {/* Decorative Corner Element */}
      {highlighted && (
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#27624f] to-transparent opacity-10 rounded-bl-[100%]" />
      )}

      {/* Popular Badge */}
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
            <Sparkles className="w-3 h-3" />
            PLUS POPULAIRE
          </div>
        </div>
      )}

      {/* Header */}
      <div className={highlighted ? 'mt-4 mb-6' : 'mb-6'}>
        <div className="flex items-center gap-3">
          {/* Icon based on plan type */}
          <div className="flex-shrink-0">
            {title.toLowerCase().includes('gratuit') || title.toLowerCase().includes('free') ? (
              <svg className="w-8 h-8 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            ) : title.toLowerCase().includes('pro') ? (
              <svg className="w-8 h-8 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ) : title.toLowerCase().includes('premium') || title.toLowerCase().includes('entreprise') ? (
              <svg className="w-8 h-8 text-[#27624f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          
          {/* Title */}
          <h3 className="text-2xl font-bold text-[#1A1A1A] uppercase tracking-tight">
            {title}
          </h3>
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          {typeof price === "number" || price !== "Custom" ? (
            <>
              <span className={`font-bold text-[#1A1A1A] ${price === 0 ? 'text-3xl' : 'text-4xl'}`}>
                {price === 0 ? "Gratuit" : formatGroupedNumber(price)}
              </span>
              {price !== 0 && (
                <>
                  <span className="text-lg font-medium text-[#666]">Ar</span>
                  <span className="text-sm text-[#999]">{period}</span>
                </>
              )}
            </>
          ) : (
            <span className="text-4xl font-bold text-[#1A1A1A]">{price}</span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-[#666] text-xs mb-5 min-h-[32px]">{description}</p>

      {/* Divider */}
      <div className="h-[1px] mb-4 rounded-full bg-[#e5e5e5]" />

      {/* Sections */}
      <div className="flex-grow mb-5 space-y-4">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-1.5">
            {/* Section Title */}
            <h4 className={`text-[11px] font-semibold mb-2 uppercase tracking-wide ${
              section.title.toLowerCase().includes('actualités') ? 'text-[#27624f]' :
              section.title.toLowerCase().includes('job') ? 'text-[#10B981]' :
              section.title.toLowerCase().includes('petites') || section.title.toLowerCase().includes('annonces') ? 'text-[#F59E0B]' :
              section.title.toLowerCase().includes('appel') || section.title.toLowerCase().includes('offre') ? 'text-[#3B82F6]' :
              'text-[#1A1A1A]'
            }`}>{section.title}</h4>
            
            {/* Section Features */}
            <div className="space-y-1.5">
              {section.features.map((feature, index) => {
                return (
                  <div key={index} className="flex items-start gap-2">
                    <div 
                      className="flex-shrink-0 w-3.5 h-3.5 rounded-sm flex items-center justify-center mt-0.5 bg-[#E5E5E5]"
                    >
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="#999999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-[11px] leading-tight text-[#666666]">
                      {feature.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Button */}
      <button
        onClick={onSelect}
        className={`w-full font-semibold py-3 px-4 rounded-[12px] transition-all duration-200 text-sm ${
          highlighted
            ? "bg-gradient-to-r from-[#27624f] to-[#A01820] text-white hover:shadow-lg hover:scale-[1.02]"
            : "bg-[#1A1A1A] text-white hover:bg-[#27624f] hover:scale-[1.02]"
        }`}
      >
        {buttonText}
      </button>

      {/* Bottom Accent */}
      {highlighted && (
        null
      )}
    </div>
  );
}
