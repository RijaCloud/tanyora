// @ts-nocheck
"use client";

import { Link } from "@/features/prototype/router-compat";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { useCookieConsent } from "@/components/privacy/CookieConsentProvider";
import { MINING_RESOURCES } from "@/lib/mining-resources";
import { TANYORA_SHOP_VISIBLE } from "@/lib/tanyora-visibility";

const FOOTER_LOGO_URL = "/new-logo.svg?v=tanyora1";

const accountLinks = [
  { label: "Mes annonces", href: "/profil/petites-annonces" },
  { label: "Mes favoris", href: "/profil/saved" },
  { label: "Mes messages", href: "/profil/messages" },
];

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

type FooterSocialLinkKey = "facebook" | "tiktok" | "instagram" | "youtube" | "linkedin" | "x";

const DEFAULT_FOOTER_DESCRIPTION = "Tanyora facilite la mise en relation entre acheteurs, vendeurs et experts du secteur minier à Madagascar.";
const DEFAULT_SOCIAL_LINKS: Record<FooterSocialLinkKey, string> = {
  facebook: "",
  tiktok: "",
  instagram: "",
  youtube: "",
  linkedin: "",
  x: "",
};
const socialMediaLinks: Array<{ key: FooterSocialLinkKey; icon: typeof Facebook; title: string }> = [
  { key: "facebook", icon: Facebook, title: "Facebook" },
  { key: "tiktok", icon: TikTokIcon, title: "TikTok" },
  { key: "instagram", icon: Instagram, title: "Instagram" },
  { key: "youtube", icon: Youtube, title: "YouTube" },
  { key: "linkedin", icon: Linkedin, title: "LinkedIn" },
  { key: "x", icon: XIcon, title: "X" },
];

function SocialIcon({ icon: Icon, href, title }: { icon: typeof Facebook; href: string; title: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={title}
      title={title}
      className="inline-flex h-8 w-8 items-center justify-center text-[var(--text-muted)] transition-colors hover:text-[var(--brand-red)] focus-visible:text-[var(--brand-red)]"
    >
      <Icon className="size-[17px]" strokeWidth={1.8} />
    </a>
  );
}

export function Footer({ logoUrl }: { logoUrl?: string }) {
  const { openPreferences } = useCookieConsent();
  const [footerContent, setFooterContent] = useState({
    description: DEFAULT_FOOTER_DESCRIPTION,
    socialLinks: DEFAULT_SOCIAL_LINKS,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadFooterData() {
      try {
        const siteConfigResponse = await fetch("/api/public/site-config", { cache: "no-store" });

        const siteConfigPayload = await siteConfigResponse.json().catch(() => null);

        if (!cancelled && siteConfigResponse.ok) {
          const configuredSocialLinks = siteConfigPayload?.footer?.socialLinks;
          setFooterContent({
            description: typeof siteConfigPayload?.footer?.description === "string" && !/2424\.mg|united malagasy media/i.test(siteConfigPayload.footer.description)
              ? siteConfigPayload.footer.description
              : DEFAULT_FOOTER_DESCRIPTION,
            socialLinks: (Object.keys(DEFAULT_SOCIAL_LINKS) as FooterSocialLinkKey[]).reduce((links, key) => {
              const value = configuredSocialLinks?.[key];
              links[key] = typeof value === "string" && !/2424[.\-_]|24\/24|UCcjS1Us2l3yB8lLsDu3Vr6w/i.test(value) ? value.trim() : DEFAULT_SOCIAL_LINKS[key];
              return links;
            }, {} as Record<FooterSocialLinkKey, string>),
          });
        }

      } catch {}
    }

    void loadFooterData();
    return () => {
      cancelled = true;
    };
  }, []);

  const menuLinks = [
    { label: "Accueil", href: "/" },
    { label: "Exchange", href: "/exchange" },
    { label: "Annonces actuelles", href: "/petites-annonces" },
    ...(TANYORA_SHOP_VISIBLE ? [{ label: "Boutique", href: "/boutique" }] : []),
    { label: "Annuaire", href: "/annuaire" },
  ];

  return (
    <footer className="site-footer mt-10 border-t border-[var(--border-soft)] bg-[var(--surface-2)] text-[var(--text-main)]">
      <div className="mx-auto max-w-[1680px] px-5 py-8 lg:px-10 lg:py-10">
        <div className="grid gap-x-8 gap-y-7 lg:grid-cols-[1.3fr_0.6fr_0.9fr_1fr]">
          <div>
            <div className="mb-3 flex items-start">
              <img
                src={logoUrl || FOOTER_LOGO_URL}
                alt="Logo Tanyora"
                className="h-14 w-auto object-contain"
              />
            </div>
            <p className="max-w-[34ch] text-[12px] leading-5 text-[var(--text-muted)]">
              {footerContent.description}
            </p>
            {socialMediaLinks.some((social) => footerContent.socialLinks[social.key]) ? (
              <div className="mt-4 flex items-center gap-1" aria-label="Réseaux sociaux">
                {socialMediaLinks.map((social) => {
                  const href = footerContent.socialLinks[social.key];
                  return href ? <SocialIcon key={social.title} icon={social.icon} href={href} title={social.title} /> : null;
                })}
              </div>
            ) : null}
          </div>

          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-main)]">Menu</p>
            <ul className="space-y-2 text-[12px] leading-4 text-[var(--text-muted)]">
              {menuLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="transition-colors hover:text-[#27624f]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-main)]">Votre espace</p>
            <ul className="space-y-2 text-[12px] leading-4 text-[var(--text-muted)]">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="transition-colors hover:text-[#27624f]">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-main)]">Ressources officielles</p>
            <ul className="space-y-2 text-[12px] leading-4 text-[var(--text-muted)]">
              {MINING_RESOURCES.map((resource) => (
                <li key={resource.domain}>
                  <a href={resource.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#27624f]">
                    {resource.name} ↗
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] leading-4 text-[var(--text-muted)]">Sites externes indépendants de Tanyora.</p>
          </div>

        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[var(--border-soft)] pt-5 text-[11px] leading-4 text-[var(--text-muted)] lg:flex-row lg:items-center lg:justify-between">
          <p>© 2026 Tanyora</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/politique-de-confidentialite" className="transition-colors hover:text-[#27624f]">
              Politique de confidentialité
            </Link>
            <button type="button" onClick={openPreferences} className="transition-colors hover:text-[#27624f]">
              Gérer mes cookies
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
