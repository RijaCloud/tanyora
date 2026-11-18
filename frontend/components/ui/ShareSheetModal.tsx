"use client";

import { createPortal } from "react-dom";
import { useState } from "react";

type ShareSheetModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
  text?: string;
};

function buildShareUrl(network: "facebook" | "x" | "email", url: string, title: string, text?: string) {
  if (network === "facebook") {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  }

  if (network === "x") {
    const content = text || title;
    return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(content)}`;
  }

  const subject = title;
  const body = `${text || title}\n\n${url}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function writeToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = value;
  helper.setAttribute("readonly", "true");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.appendChild(helper);
  helper.select();
  document.execCommand("copy");
  document.body.removeChild(helper);
}

function ShareIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="ui-surface-soft ui-text-main flex h-[58px] w-[58px] items-center justify-center rounded-[18px] border ui-border transition hover:border-[#27624f] hover:bg-[#fff4f5] hover:text-[#27624f] dark:hover:bg-[#2a2223]"
    >
      {children}
    </button>
  );
}

export function ShareSheetModal({ open, onClose, title, url, text }: ShareSheetModalProps) {
  const [feedback, setFeedback] = useState("");

  if (!open || typeof document === "undefined") {
    return null;
  }

  async function handleCopyLink(message = "Lien copié dans le presse-papiers.") {
    try {
      await writeToClipboard(url);
      setFeedback(message);
    } catch {
      setFeedback("Impossible de copier automatiquement le lien.");
    }
  }

  async function handleInstagramShare() {
    await handleCopyLink("Lien copié. Vous pouvez maintenant le coller dans Instagram.");
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }

  function handleOpen(network: "facebook" | "x" | "email") {
    const href = buildShareUrl(network, url, title, text);

    if (network === "email") {
      window.location.href = href;
      return;
    }

    window.open(href, "_blank", "noopener,noreferrer");
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 px-4 py-6">
      <button type="button" aria-label="Fermer" className="absolute inset-0" onClick={onClose} />
      <div className="ui-surface relative w-full max-w-[460px] rounded-[28px] border ui-border p-6 shadow-[0_32px_90px_rgba(0,0,0,0.28)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le partage"
          className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-[#111111] shadow-lg transition-colors hover:bg-gray-100"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="pr-14">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#27624f]">Partager</p>
            <h3 className="ui-text-main mt-3 text-[24px] font-bold leading-[1.15]">{title}</h3>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <ShareIconButton label="Partager sur Facebook" onClick={() => handleOpen("facebook")}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M13.5 21v-7h2.3l.4-3h-2.7V9.2c0-.9.3-1.5 1.6-1.5H16V5.1c-.2 0-.9-.1-1.8-.1-1.8 0-3.1 1.1-3.1 3.3V11H9v3h2.3v7h2.2Z" />
            </svg>
          </ShareIconButton>
          <ShareIconButton label="Partager sur X" onClick={() => handleOpen("x")}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.9 3H21l-4.6 5.3L22 21h-4.8l-3.8-5.1L9 21H6.9l4.9-5.7L2 3h4.9l3.4 4.7L14.4 3h4.5Zm-1.7 16h1.3L7.2 4.9H5.8L17.2 19Z" />
            </svg>
          </ShareIconButton>
          <ShareIconButton label="Partager sur Instagram" onClick={() => { void handleInstagramShare(); }}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </ShareIconButton>
          <ShareIconButton label="Partager par email" onClick={() => handleOpen("email")}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 6h16v12H4z" />
              <path d="m4 7 8 6 8-6" />
            </svg>
          </ShareIconButton>
          <ShareIconButton label="Copier le lien" onClick={() => { void handleCopyLink(); }}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </ShareIconButton>
        </div>

        <div className="ui-surface-soft mt-5 rounded-[18px] border ui-border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="ui-text-soft text-[11px] font-semibold uppercase tracking-[0.18em]">Lien</p>
            <button
              type="button"
              onClick={() => { void handleCopyLink(); }}
              className="text-[12px] font-semibold text-[#27624f] transition hover:text-[#a61b22]"
            >
              Copier
            </button>
          </div>
          <p className="ui-text-main mt-2 break-all text-[13px] leading-[1.6]">{url}</p>
        </div>

        {feedback ? <p className="mt-4 text-[12px] text-[#27624f]">{feedback}</p> : null}
      </div>
    </div>,
    document.body,
  );
}
