// @ts-nocheck
"use client";

import { Plus, Plane, Search, Bell, User, Settings, ChevronDown } from 'lucide-react';
import svgPaths from "@/features/prototype/imports/svg-6np2fa2gib";

export function Navigation() {
  const navLinks = [
    'Accueil',
    'Actualités',
    'Petites Annonces',
    "Appel d'Offres",
    "Offres d'emploi",
    'Web Radio',
    'Annuaire',
  ];

  return (
    <div className="bg-white border-b border-[#EAEAEA]">
      <div className="max-w-[1320px] mx-auto px-6 h-[80px] flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-6">
          <div className="relative w-[42px] h-[42px]">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 42 42">
              <path d={svgPaths.p3b8d2580} fill="#27624f" />
            </svg>
          </div>

          {/* Center: Navigation Links */}
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="text-[#1A1A1A] text-[14px] font-medium hover:text-[#27624f] transition-colors"
              >
                {link}
              </a>
            ))}
          </nav>
        </div>

        {/* Right: Icons and Widgets */}
        <div className="flex items-center gap-6">
          <Plus className="w-5 h-5 text-[#1A1A1A] cursor-pointer hover:text-[#27624f]" />
          <Plane className="w-5 h-5 text-[#1A1A1A] cursor-pointer hover:text-[#27624f]" />
          
          {/* Weather Widget */}
          <div className="bg-[#4992ff] rounded-full px-4 py-2 flex items-center gap-2">
            <span className="text-white font-bold text-[16px]">25°C</span>
            <div className="w-6 h-6 bg-white/30 rounded-full"></div>
          </div>

          {/* Currency Dropdown */}
          <div className="flex items-center gap-2 text-[14px]">
            <span className="text-[#404040]">USA / MGA</span>
            <ChevronDown className="w-4 h-4 text-[#404040]" />
          </div>

          <Search className="w-5 h-5 text-[#1A1A1A] cursor-pointer hover:text-[#27624f]" />
          <Bell className="w-5 h-5 text-[#1A1A1A] cursor-pointer hover:text-[#27624f]" />
          <User className="w-5 h-5 text-[#1A1A1A] cursor-pointer hover:text-[#27624f]" />
          <span className="text-[#1A1A1A] text-[14px] font-medium">Username</span>
          <Settings className="w-5 h-5 text-[#1A1A1A] cursor-pointer hover:text-[#27624f]" />
        </div>
      </div>
    </div>
  );
}
