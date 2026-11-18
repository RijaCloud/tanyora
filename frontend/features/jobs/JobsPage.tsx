"use client";

import { useMemo, useState } from "react";
import type { JobOffer } from "@/features/jobs/types";

function Badge({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium ${active ? "bg-[#27624f] text-white" : "ui-surface border ui-border text-[color:var(--text-muted)]"}`}
    >
      {label}
    </button>
  );
}

function JobCard({ job, onSelect }: { job: JobOffer; onSelect: (job: JobOffer) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(job)}
      className="ui-card-flat rounded-xl p-4 text-left transition hover:-translate-y-1 hover:border-[#27624f] hover:shadow-lg"
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: job.companyColor }}
        >
          {job.companyInitial}
        </span>
        <div>
          <p className="ui-text-main text-sm font-semibold">{job.company}</p>
          <p className="ui-text-soft text-xs">{job.location}</p>
        </div>
      </div>
      <h3 className="ui-text-main mb-2 text-sm font-semibold">{job.title}</h3>
      <p className="ui-text-muted line-clamp-2 text-xs">{job.description}</p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="ui-surface-soft ui-text-muted rounded px-2 py-1">{job.dateLabel}</span>
        {job.featured ? <span className="font-semibold text-[#27624f]">Mise en avant</span> : null}
      </div>
    </button>
  );
}

function JobModal({ job, onClose }: { job: JobOffer; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="ui-surface relative w-full max-w-2xl rounded-2xl border ui-border p-6" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="listing-detail-close" aria-label="Fermer l'aperçu">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="mb-4 pr-10">
            <h2 className="ui-text-main text-2xl font-bold">{job.title}</h2>
            <p className="ui-text-soft text-sm">
              {job.company} - {job.location}
            </p>
        </div>
        <p className="ui-text-muted mb-4 text-sm">{job.description}</p>
        <div className="ui-surface-soft ui-text-main rounded-lg p-3 text-sm">Candidature: recrutement@example.invalid - Date: {job.dateLabel}</div>
      </div>
    </div>
  );
}

export function JobsPage({ jobs, categories }: { jobs: JobOffer[]; categories: readonly string[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      const byCategory = selectedCategory === "Tous" || job.category === selectedCategory;
      const bySearch = `${job.title} ${job.company} ${job.description}`.toLowerCase().includes(search.toLowerCase());
      return byCategory && bySearch;
    });
  }, [jobs, search, selectedCategory]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="ui-text-main text-3xl font-bold">Offres d'emploi</h1>
        <p className="ui-text-muted">Migration du prototype Make vers un module Next.js maintenable.</p>
      </header>

      <section className="ui-card-flat rounded-xl p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge key={category} label={category} active={selectedCategory === category} onClick={() => setSelectedCategory(category)} />
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
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} onSelect={setSelectedJob} />
          ))}
        </div>
      </section>

      {selectedJob ? <JobModal job={selectedJob} onClose={() => setSelectedJob(null)} /> : null}
    </div>
  );
}
