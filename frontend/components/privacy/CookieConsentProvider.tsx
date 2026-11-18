"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CONSENT_COOKIE = "2424_cookie_consent";
const CONSENT_VERSION = 2;
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export type CookieConsentCategory = "preferences" | "statistics" | "advertising";
type CookieSelections = Record<CookieConsentCategory, boolean>;

type StoredCookieConsent = {
  version: number;
  preferences: boolean;
  statistics: boolean;
  advertising: boolean;
};

type CookieConsentContextValue = {
  ready: boolean;
  hasConsent: (category: CookieConsentCategory) => boolean;
  openPreferences: () => void;
};

const REJECTED_SELECTIONS: CookieSelections = {
  preferences: false,
  statistics: false,
  advertising: false,
};

const ACCEPTED_SELECTIONS: CookieSelections = {
  preferences: true,
  statistics: true,
  advertising: true,
};

const CookieConsentContext = createContext<CookieConsentContextValue>({
  ready: false,
  hasConsent: () => false,
  openPreferences: () => undefined,
});

function readCookie(name: string) {
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix))
    ?.slice(prefix.length);
}

function readStoredConsent(): CookieSelections | null {
  const value = readCookie(CONSENT_COOKIE);
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<StoredCookieConsent>;
    if (parsed.version !== CONSENT_VERSION) {
      return null;
    }
    return {
      preferences: parsed.preferences === true,
      statistics: parsed.statistics === true,
      advertising: parsed.advertising === true,
    };
  } catch {
    return null;
  }
}

function persistConsent(selections: CookieSelections) {
  const payload: StoredCookieConsent = { version: CONSENT_VERSION, ...selections };
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(payload))}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

const categories: Array<{ key: CookieConsentCategory; title: string; description: string }> = [
  { key: "preferences", title: "Préférences", description: "Conservent vos choix d'affichage, comme le thème du site." },
  { key: "statistics", title: "Statistiques", description: "Mesurent l'utilisation du site afin d'améliorer nos contenus." },
  { key: "advertising", title: "Publicité", description: "Autorise les régies publicitaires et la mesure des campagnes." },
];

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [selections, setSelections] = useState<CookieSelections>(REJECTED_SELECTIONS);
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  useEffect(() => {
    const stored = readStoredConsent();
    if (stored) {
      setSelections(stored);
    } else {
      setIsOpen(true);
    }
    setReady(true);
  }, []);

  const save = useCallback((nextSelections: CookieSelections) => {
    setSelections(nextSelections);
    persistConsent(nextSelections);
    setIsOpen(false);
    setIsManaging(false);
  }, []);

  const openPreferences = useCallback(() => {
    setIsManaging(true);
    setIsOpen(true);
  }, []);

  const contextValue = useMemo<CookieConsentContextValue>(
    () => ({
      ready,
      hasConsent: (category) => selections[category] === true,
      openPreferences,
    }),
    [openPreferences, ready, selections],
  );

  return (
    <CookieConsentContext.Provider value={contextValue}>
      {children}
      {ready && isOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-[250] p-3 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="cookie-consent-title">
          <div className="mx-auto max-w-3xl rounded-[20px] border border-[var(--border-soft)] bg-[var(--surface-1)] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.2)] dark:border-white/15">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand-red)]">Votre confidentialité</p>
            <h2 id="cookie-consent-title" className="mt-1 text-[18px] font-bold tracking-[-0.03em] text-[var(--text-main)]">Vos choix de cookies</h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[var(--text-soft)]">
              Nous utilisons les cookies nécessaires au fonctionnement du site. Avec votre accord, nous activons aussi les statistiques et la publicité.
              {" "}
              <a className="font-semibold text-[var(--brand-red)] underline underline-offset-2" href="/politique-de-confidentialite">Consulter la politique de confidentialité</a>
            </p>

            {isManaging ? (
              <div className="mt-4 space-y-3 border-y border-[var(--border-soft)] py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-main)]">Nécessaires</p>
                    <p className="mt-0.5 text-[12px] leading-4 text-[var(--text-soft)]">Indispensables à la sécurité, à la session et au fonctionnement du site.</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold text-[var(--text-soft)]">Toujours actifs</span>
                </div>
                {categories.map((category) => (
                  <label key={category.key} className="flex cursor-pointer items-start justify-between gap-4">
                    <span>
                      <span className="block text-[13px] font-semibold text-[var(--text-main)]">{category.title}</span>
                      <span className="mt-0.5 block text-[12px] leading-4 text-[var(--text-soft)]">{category.description}</span>
                    </span>
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-[#27624f]"
                      checked={selections[category.key]}
                      onChange={(event) => setSelections((current) => ({ ...current, [category.key]: event.target.checked }))}
                    />
                  </label>
                ))}
              </div>
            ) : null}

            <div className="cookie-consent-actions mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="ui-button border border-[var(--border-strong)] bg-transparent px-4 py-2 text-[12px] text-[var(--text-main)]" onClick={() => save(REJECTED_SELECTIONS)}>Tout refuser</button>
              {!isManaging ? <button type="button" className="ui-button border border-[var(--border-strong)] bg-transparent px-4 py-2 text-[12px] text-[var(--text-main)]" onClick={() => setIsManaging(true)}>Personnaliser</button> : null}
              {isManaging ? <button type="button" className="ui-button border border-[var(--border-strong)] bg-transparent px-4 py-2 text-[12px] text-[var(--text-main)]" onClick={() => save(selections)}>Enregistrer mes choix</button> : null}
              <button type="button" className="ui-button ui-button-primary px-4 py-2 text-[12px] text-white" onClick={() => save(ACCEPTED_SELECTIONS)}>Tout accepter</button>
            </div>
          </div>
        </div>
      ) : null}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  return useContext(CookieConsentContext);
}
