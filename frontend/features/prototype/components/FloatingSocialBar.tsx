// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { Facebook, Instagram, Linkedin, Youtube, Moon, Sun, ChevronLeft, X } from "lucide-react";

const THEME_KEY = "prototype-theme";
const SOCIAL_BAR_STATE_KEY = "prototype-floating-social-collapsed-v4";

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M16.6 5.82a4.14 4.14 0 0 1-2.83-2.83h-2.9v11.31a2.89 2.89 0 1 1-2-2.75V8.61a5.84 5.84 0 1 0 5.84 5.84V8.72a7.02 7.02 0 0 0 4.1 1.32V7.15a4.17 4.17 0 0 1-2.21-1.33Z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.9 2.25h3.68l-8.04 9.19L24 21.75h-7.41l-5.8-7.58-6.63 7.58H.48l8.6-9.83L0 2.25h7.6l5.24 6.93 6.06-6.93Zm-1.29 17.3h2.04L6.49 4.33H4.3l13.31 15.22Z" />
    </svg>
  );
}

export default function FloatingSocialBar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHoverPreview, setIsHoverPreview] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    const savedCollapsed = localStorage.getItem(SOCIAL_BAR_STATE_KEY);
    // Match the app-wide default: dark until the visitor explicitly selects light.
    const isDark = saved !== "light";
    setIsDarkMode(isDark);
    applyTheme(isDark);
    // The compact tab is the default. An explicit choice to open it is retained.
    setIsCollapsed(savedCollapsed !== "false");

    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SOCIAL_BAR_STATE_KEY, isCollapsed ? "true" : "false");
    } catch {
      // Ignore persistence errors and keep the widget usable.
    }
  }, [isCollapsed]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      return next;
    });
  };

  const socialLinks: Array<{ icon: typeof Facebook; label: string; color: string; href: string }> = [];
  const isRailVisible = !isCollapsed || isHoverPreview;

  return (
    <div
      className={`prototype-floating-social fixed bottom-[4.5rem] top-auto z-[60] flex translate-y-0 items-center transition-[right] duration-300 ease-out ${isCollapsed ? "right-0" : "right-4 md:right-6"}`}
      onMouseEnter={() => {
        if (isCollapsed) setIsHoverPreview(true);
      }}
      onMouseLeave={() => setIsHoverPreview(false)}
    >
      <div
        className={`prototype-social-rail flex origin-right flex-col items-center transition-all duration-300 ease-out ${
          isRailVisible ? "translate-x-0 scale-100 opacity-100" : "pointer-events-none translate-x-8 scale-95 opacity-0"
        }`}
        aria-hidden={!isRailVisible}
      >
        <button
          onClick={() => {
            setIsHoverPreview(false);
            setIsCollapsed(true);
          }}
          aria-label="Fermer les raccourcis sociaux"
          tabIndex={isRailVisible ? 0 : -1}
          className="prototype-social-dismiss prototype-social-tooltip"
        >
          <X className="h-4 w-4" strokeWidth={2} />
          <span className="prototype-social-tooltip-text">Masquer les raccourcis</span>
        </button>

        <div className="prototype-social-icons flex flex-col">
          {socialLinks.map((social, index) => {
            const Icon = social.icon;
            return (
              <a
                key={index}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                tabIndex={isRailVisible ? 0 : -1}
                className="prototype-social-link prototype-social-tooltip"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = social.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "";
                }}
              >
                <Icon className="h-[19px] w-[19px]" strokeWidth={1.8} />
                <span className="prototype-social-tooltip-text">{social.label}</span>
              </a>
            );
          })}
        </div>

        <button
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
          tabIndex={isRailVisible ? 0 : -1}
          className="prototype-theme-toggle prototype-social-tooltip group relative flex h-10 w-10 items-center justify-center"
        >
          <Sun
            className={`absolute h-5 w-5 transition-all duration-300 ${isDarkMode ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 text-gray-700 opacity-100 group-hover:text-white"}`}
            strokeWidth={2}
          />
          <Moon
            className={`absolute h-5 w-5 transition-all duration-300 ${isDarkMode ? "scale-100 rotate-0 text-gray-300 opacity-100 group-hover:text-white" : "scale-0 -rotate-90 opacity-0"}`}
            strokeWidth={2}
          />
          <span className="prototype-social-tooltip-text">{isDarkMode ? "Mode clair" : "Mode sombre"}</span>
        </button>
      </div>

      <div
        className={`transition-all duration-300 ease-out ${
          !isRailVisible ? "-mr-px translate-x-0 opacity-100" : "pointer-events-none translate-x-3 opacity-0"
        }`}
        aria-hidden={isRailVisible}
      >
        <button
          onClick={() => {
            setIsHoverPreview(false);
            setIsCollapsed(false);
          }}
          aria-label="Afficher les raccourcis sociaux"
          tabIndex={!isRailVisible ? 0 : -1}
          className="prototype-social-reveal prototype-social-tooltip"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          <span className="prototype-social-tooltip-text">Raccourcis</span>
        </button>
      </div>
    </div>
  );
}
