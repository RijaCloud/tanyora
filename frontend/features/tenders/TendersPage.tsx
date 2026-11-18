"use client";

import { useMemo, useState } from "react";
import type { TenderItem } from "@/features/tenders/types";

function formatAr(value: number): string {
  return `${value.toLocaleString("fr-FR")} Ar`;
}

function TenderCard({ item, onSelect }: { item: TenderItem; onSelect: (item: TenderItem) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-1 hover:border-[#27624f] hover:shadow-lg"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: item.organizationColor }}>
          {item.organizationInitial}
        </span>
        <div>
          <p className="text-sm font-semibold">{item.organization}</p>
          <p className="text-xs text-slate-500">{item.location}</p>
        </div>
      </div>
      <h3 className="mb-2 text-sm font-semibold">{item.title}</h3>
      <p className="line-clamp-2 text-xs text-slate-600">{item.description}</p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="rounded bg-slate-100 px-2 py-1">{item.deadline}</span>
        {item.featured ? <span className="font-semibold text-[#27624f]">Mise en avant</span> : null}
      </div>
    </button>
  );
}

function TenderModal({ item, onClose }: { item: TenderItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="listing-detail-close" aria-label="Fermer l'aperçu">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="mb-4 pr-10">
            <h2 className="text-2xl font-bold">{item.title}</h2>
            <p className="text-sm text-slate-500">{item.organization} - {item.location}</p>
        </div>
        <p className="mb-4 text-sm text-slate-700">{item.description}</p>
        <p className="mb-4 text-lg font-bold text-[#27624f]">Budget: {formatAr(item.budgetAr)}</p>
        <button type="button" className="rounded-lg bg-[#27624f] px-4 py-2 text-sm font-semibold text-white">Telecharger TDR</button>
      </div>
    </div>
  );
}

export function TendersPage({ tenders, categories }: { tenders: TenderItem[]; categories: readonly string[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TenderItem | null>(null);

  const filtered = useMemo(() => {
    return tenders.filter((item) => {
      const byCategory = selectedCategory === "Tous" || item.category === selectedCategory;
      const bySearch = `${item.title} ${item.description} ${item.organization}`.toLowerCase().includes(search.toLowerCase());
      return byCategory && bySearch;
    });
  }, [tenders, selectedCategory, search]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Appels d'offres</h1>
        <p className="text-slate-600">Migration du prototype Make vers module Next.js.</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${selectedCategory === category ? "bg-[#27624f] text-white" : "border border-slate-300"}`}
            >
              {category}
            </button>
          ))}
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Recherche" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </section>

      <section>
        <p className="mb-3 text-sm text-slate-500">Resultats: {filtered.length}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((item) => (
            <TenderCard key={item.id} item={item} onSelect={setSelected} />
          ))}
        </div>
      </section>

      {selected ? <TenderModal item={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
