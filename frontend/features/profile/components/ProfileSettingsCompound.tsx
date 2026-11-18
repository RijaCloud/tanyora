"use client";

import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  isValid?: boolean;
  children: ReactNode;
};

function Root({ children }: { children: ReactNode }) {
  return (
    <main className="profile-settings-page ui-page px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-[1320px] space-y-8">{children}</div>
    </main>
  );
}

function Toast({ title, message }: { title: string; message: string }) {
  return (
    <div className="fixed right-4 top-4 z-[120] max-w-sm rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-[0_18px_50px_rgba(17,17,17,0.12)] dark:border-emerald-900/70 dark:bg-[#1d2b23]">
      <p className="text-sm font-semibold text-emerald-700">{title}</p>
      <p className="mt-1 text-sm text-[#444444] dark:text-[#d5ddd8]">{message}</p>
    </div>
  );
}

function TwoColumn({ children }: { children: ReactNode }) {
  return <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">{children}</section>;
}

function Hero({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[32px] bg-[linear-gradient(135deg,#111111,#222222)] p-8 text-white shadow-[0_28px_80px_rgba(17,17,17,0.18)] md:p-10 dark:border dark:border-white/10">
      {children}
    </div>
  );
}

function HeroCard({ children }: { children: ReactNode }) {
  return <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5">{children}</div>;
}

function FormCard({ children }: { children: ReactNode }) {
  return <section className="ui-card rounded-[32px] p-8 md:p-10">{children}</section>;
}

function HeaderRow({ children }: { children: ReactNode }) {
  return <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">{children}</div>;
}

function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-8 xl:grid-cols-[170px_minmax(0,1fr)]">{children}</div>;
}

function Sidebar({ children }: { children: ReactNode }) {
  return <aside className="space-y-5">{children}</aside>;
}

function Content({ children }: { children: ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

function Field({ label, required = false, error, hint, isValid = false, children }: FieldProps) {
  return (
    <label className="block">
      <span className={`mb-2 block text-sm font-medium ${isValid ? "text-emerald-700" : "ui-text-main"}`}>
        {label}
        {required ? <span className={isValid ? "text-emerald-700" : "text-[#27624f]"}> *</span> : null}
      </span>
      {children}
      {error ? <p className="mt-2 text-xs text-[#27624f]">{error}</p> : null}
      {!error && hint ? <div className="ui-text-muted mt-2 text-xs">{hint}</div> : null}
    </label>
  );
}

function StaticField({ label, required = false, hint, value, isValid = false }: { label: string; required?: boolean; hint?: ReactNode; value: ReactNode; isValid?: boolean }) {
  return (
    <Field label={label} required={required} hint={hint} isValid={isValid}>
      <div className={`ui-surface-soft ui-border-strong ui-text-main w-full rounded-2xl border px-4 py-3 text-sm ${isValid ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20" : ""}`}>{value}</div>
    </Field>
  );
}

function AvatarFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-[4px] border-[#27624f] bg-[var(--surface-2)] shadow-[0_10px_30px_rgba(214,31,38,0.14)] xl:mx-0">
      {children}
    </div>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 pt-2">{children}</div>;
}

export const ProfileSettingsCompound = Object.assign(Root, {
  Toast,
  TwoColumn,
  Hero,
  HeroCard,
  FormCard,
  HeaderRow,
  FormGrid,
  Sidebar,
  Content,
  Field,
  StaticField,
  AvatarFrame,
  Actions,
});
