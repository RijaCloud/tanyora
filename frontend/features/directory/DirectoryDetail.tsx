"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Bookmark, Mail, MapPin, Phone } from "lucide-react";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
import type { DirectoryCompany } from "@/features/directory/types";
import styles from "./DirectoryDetail.module.css";

function getLocation(company: DirectoryCompany) {
  const location = company.location.trim();
  if (location && location.toLowerCase() !== "madagascar") return location;
  return [...new Set([...company.regions, ...company.cities])].join(" · ") || "Madagascar";
}

function getWebsiteHref(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function DirectoryDetail({ company, demoMode }: { company: DirectoryCompany; demoMode: boolean }) {
  const { isLoggedIn, setShowLoginModal } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaveReady, setIsSaveReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const location = getLocation(company);
  const phone = company.phone.trim();
  const phoneHref = !demoMode && /\d/.test(phone) ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const email = company.email.trim();
  const emailHref = !demoMode && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : null;
  const websiteHref = demoMode ? null : getWebsiteHref(company.website);

  useEffect(() => {
    if (demoMode || !isLoggedIn) {
      setIsSaveReady(!demoMode);
      setIsSaved(false);
      return;
    }
    const controller = new AbortController();
    setIsSaveReady(false);
    fetch(`/api/saved-items?kind=directory&itemId=${encodeURIComponent(company.id)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => { if (!controller.signal.aborted) setIsSaved(Boolean(result?.saved)); })
      .catch(() => { if (!controller.signal.aborted) setIsSaved(false); })
      .finally(() => { if (!controller.signal.aborted) setIsSaveReady(true); });
    return () => controller.abort();
  }, [company.id, demoMode, isLoggedIn]);

  async function toggleSaved() {
    if (demoMode || isSaving || !isSaveReady) return;
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setIsSaving(true);
    setSaveError("");
    try {
      const response = await fetch("/api/saved-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", item: {
          kind: "directory", itemId: company.id, title: company.name,
          description: company.description, image: company.imageUrl || "",
          location, sourceLabel: company.industry,
        } }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error("Impossible de mettre à jour vos favoris.");
      setIsSaved(Boolean(result?.saved));
    } catch {
      setSaveError("Impossible de mettre à jour vos favoris.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href={demoMode ? "/annuaire?demo=1" : "/annuaire"} className={styles.back}><ArrowLeft size={17} aria-hidden="true" /> Retour à l'annuaire</Link>
        {demoMode ? <div className={styles.notice} role="note"><strong>Démonstration.</strong> Ce profil est fictif. Il ne représente pas un partenaire vérifié et ne peut pas être contacté.</div> : null}
        <article className={styles.detail}>
          <div className={styles.identity}>
            <div className={styles.visual}>
              {company.imageUrl && !demoMode ? <img src={company.imageUrl} alt={company.name} /> : <span style={{ backgroundColor: company.color }}>{company.initial}</span>}
            </div>
            <p className={styles.eyebrow}>Tanyora / Annuaire / {company.industry}</p>
            <h1>{company.name}</h1>
            <p className={styles.place}><MapPin size={16} aria-hidden="true" />{location}</p>
          </div>
          <div className={styles.content}>
            <section aria-labelledby="directory-about-title">
              <p className={styles.eyebrow}>01 / Présentation</p>
              <h2 id="directory-about-title">À propos</h2>
              <p className={styles.description}>{company.description || "Ce professionnel n'a pas encore renseigné de présentation."}</p>
            </section>
            <section className={styles.facts} aria-label="Informations de la fiche">
              <div><span>Spécialité</span><strong>{company.industry}</strong></div>
              <div><span>Région</span><strong>{company.regions.join(", ") || "Non précisée"}</strong></div>
              <div><span>Ville</span><strong>{company.cities.join(", ") || location}</strong></div>
            </section>
            <section className={styles.contact} aria-labelledby="directory-contact-title">
              <p className={styles.eyebrow}>02 / Mise en relation</p>
              <h2 id="directory-contact-title">Prendre contact</h2>
              {demoMode ? <p>Les coordonnées seront disponibles uniquement sur les fiches réelles publiées dans l'annuaire.</p> : (
                <div className={styles.contactLinks}>
                  {phoneHref ? <a href={phoneHref}><Phone size={16} aria-hidden="true" />{phone}</a> : null}
                  {emailHref ? <a href={emailHref}><Mail size={16} aria-hidden="true" />{email}</a> : null}
                  {websiteHref ? <a href={websiteHref} target="_blank" rel="noopener noreferrer">Visiter le site web <ArrowUpRight size={16} aria-hidden="true" /></a> : null}
                  {!phoneHref && !emailHref && !websiteHref ? <p>Aucune coordonnée communiquée pour le moment.</p> : null}
                </div>
              )}
              {!demoMode ? (
                <div className={styles.saveArea}>
                  <button type="button" onClick={() => void toggleSaved()} disabled={!isSaveReady || isSaving} aria-pressed={isSaved}>
                    <Bookmark size={17} fill={isSaved ? "currentColor" : "none"} aria-hidden="true" />{isSaving ? "Mise à jour…" : isSaved ? "Retirer des favoris" : "Ajouter aux favoris"}
                  </button>
                  {saveError ? <p role="alert">{saveError}</p> : null}
                </div>
              ) : null}
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}
