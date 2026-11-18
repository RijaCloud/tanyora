"use client";

import { useMemo, useState } from "react";
import type { ClassifiedAd } from "@/features/classifieds/types";

function currencyAr(value: number): string {
  return `${value.toLocaleString("fr-FR")} Ar`;
}

function ClassifiedCard({ ad, onSelect }: { ad: ClassifiedAd; onSelect: (ad: ClassifiedAd) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(ad)}
      className="group ui-card-flat overflow-hidden rounded-[20px] text-left transition hover:-translate-y-1 hover:border-[#27624f] hover:shadow-[0_20px_40px_rgba(17,17,17,0.12)]"
    >
      <div className="ui-surface-soft h-40 w-full overflow-hidden">
        <div className="h-full w-full bg-cover bg-center transition duration-500 group-hover:scale-[1.03]" style={{ backgroundImage: `url(${ad.imageUrl})` }} />
      </div>
      <div className="space-y-2 p-3">
        <div className="ui-text-soft flex items-center justify-between text-xs">
          <span>{ad.location}</span>
          {ad.featured ? <span className="rounded bg-[#27624f]/10 px-2 py-0.5 font-semibold text-[#27624f]">Premium</span> : null}
        </div>
        <h3 className="ui-text-main line-clamp-1 text-sm font-semibold">{ad.title}</h3>
        <p className="ui-text-muted line-clamp-2 text-xs">{ad.description}</p>
        <p className="ui-text-main text-sm font-bold">{currencyAr(ad.priceAr)}</p>
      </div>
    </button>
  );
}

function ClassifiedModal({ ad, onClose }: { ad: ClassifiedAd; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="ui-surface relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border ui-border" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="listing-detail-close" aria-label="Fermer l'aperçu">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="ui-surface-soft h-72 w-full bg-cover bg-center" style={{ backgroundImage: `url(${ad.imageUrl})` }} />
        <div className="space-y-4 p-6">
          <div className="pr-10">
            <h2 className="ui-text-main text-2xl font-bold">{ad.title}</h2>
          </div>
          <p className="ui-text-soft text-sm">{ad.location} - Publie il y a {ad.dateLabel}</p>
          <p className="ui-text-muted text-sm">{ad.description}</p>
          <p className="text-xl font-bold text-[#27624f]">{currencyAr(ad.priceAr)}</p>
          <div className="ui-surface-soft ui-text-main rounded-lg border ui-border p-3 text-sm">
            Contact vendeur: +261 31 00 000 00 - vendeur@example.invalid
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClassifiedsPage({ ads, categories }: { ads: ClassifiedAd[]; categories: readonly string[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [search, setSearch] = useState("");
  const [selectedAd, setSelectedAd] = useState<ClassifiedAd | null>(null);

  const filtered = useMemo(() => {
    return ads.filter((ad) => {
      const byCategory = selectedCategory === "Tous" || ad.category === selectedCategory;
      const bySearch = `${ad.title} ${ad.description}`.toLowerCase().includes(search.toLowerCase());
      return byCategory && bySearch;
    });
  }, [ads, search, selectedCategory]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="ui-text-main text-3xl font-bold">Petites annonces</h1>
        <p className="ui-text-muted">Inspire du prototype Make, restructure en module Next.js.</p>
      </header>

      <section className="ui-card-flat rounded-xl p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                selectedCategory === category ? "bg-[#27624f] text-white" : "ui-surface border ui-border text-[color:var(--text-muted)]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Recherche"
          className="ui-input w-full rounded-md px-3 py-2"
        />
      </section>

      <section>
        <p className="ui-text-soft mb-3 text-sm">Resultats: {filtered.length}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((ad) => (
            <ClassifiedCard key={ad.id} ad={ad} onSelect={setSelectedAd} />
          ))}
        </div>
      </section>

      {selectedAd ? <ClassifiedModal ad={selectedAd} onClose={() => setSelectedAd(null)} /> : null}
    </div>
  );
}
