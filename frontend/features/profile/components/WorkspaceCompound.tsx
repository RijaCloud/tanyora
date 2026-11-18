"use client";

import type { ReactNode } from "react";

function Root({ children }: { children: ReactNode }) {
  return (
    <main className="profile-workspace-page ui-page px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-[1320px] space-y-6">{children}</div>
    </main>
  );
}

function Hero({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-white/6 bg-[#171717] px-5 py-4 text-white shadow-[0_20px_56px_rgba(17,17,17,0.14)] md:px-6 md:py-5">
      <p className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ffb6b8] backdrop-blur-sm">
        {eyebrow}
      </p>
      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] xl:items-stretch">
        <div className="min-w-0">
          <h1 className="max-w-[17ch] text-[1.65rem] font-semibold tracking-[-0.04em] md:text-[2.1rem]">{title}</h1>
          {description ? <p className="mt-3 max-w-[42ch] text-sm leading-6 text-white/64">{description}</p> : null}
        </div>
        {children ? <div className="flex min-w-0 flex-col gap-2.5">{children}</div> : null}
      </div>
    </section>
  );
}

function Surface({ children }: { children: ReactNode }) {
  return (
    <section className="ui-card rounded-[32px] p-6 md:p-8">
      {children}
    </section>
  );
}

function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="ui-border flex flex-col gap-3 border-b pb-3 md:flex-row md:items-center md:justify-between">
      {children}
    </div>
  );
}

function TwoColumn({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mt-6 grid gap-6 xl:grid-cols-[minmax(0,_1.18fr)_minmax(340px,_0.82fr)] ${className}`.trim()}>{children}</div>;
}

function Panel({ children, muted = false, className = "" }: { children: ReactNode; muted?: boolean; className?: string }) {
  return (
    <section
      className={`min-w-0 rounded-[28px] border p-6 ${className} ${
        muted ? "ui-border ui-surface-soft" : "ui-border ui-surface"
      }`}
    >
      {children}
    </section>
  );
}

function PanelHeader({ eyebrow, title, aside }: { eyebrow: string; title: string; aside?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27624f]">{eyebrow}</p>
        <h2 className="ui-text-main mt-3 text-2xl font-semibold">{title}</h2>
      </div>
      {aside}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="ui-border-strong ui-surface-soft ui-text-muted rounded-[22px] border border-dashed px-5 py-8 text-sm leading-6">
      Aucun élément dans {label.toLowerCase()} pour le moment.
    </div>
  );
}

function ActionIcon({ children, disabled = false }: { children: ReactNode; disabled?: boolean }) {
  return (
    <span
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${
        disabled
          ? "ui-border ui-surface-disabled cursor-not-allowed opacity-65"
          : "ui-border ui-surface ui-text-muted hover:border-[#27624f] hover:text-[#27624f]"
      }`}
    >
      {children}
    </span>
  );
}

export const WorkspaceCompound = Object.assign(Root, {
  Hero,
  Surface,
  Toolbar,
  TwoColumn,
  Panel,
  PanelHeader,
  EmptyState,
  ActionIcon,
});
