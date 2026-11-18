"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { FileText, Paperclip, Send, Type, X } from "lucide-react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import RatingStars from "@/features/prototype/components/RatingStars";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import {
  getMessageAttachmentTotalBytes,
  MESSAGE_ATTACHMENT_MAX_TOTAL_BYTES,
  MESSAGE_ATTACHMENT_MIME_TYPES,
  normalizeMessageAttachments,
  type MessageAttachment,
} from "@/lib/messages/attachments";
import { extractMessagePlainText, sanitizeMessageHtml } from "@/lib/messages/message-content";

type ConversationListing = {
  id: number;
  slug: string;
  title: string;
  seller: string;
  image?: string;
  price: string;
  location: string;
  sidebarEyebrow?: string;
  details?: Array<{
    label: string;
    value: string;
  }>;
  ownerRatingAverage?: number;
  ownerRatingCount?: number;
};

type ThreadMessage = {
  id: string;
  content: string;
  attachment?: MessageAttachment;
  attachments?: MessageAttachment[];
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  createdAt: string;
  isMine: boolean;
};

type ClassifiedConversationPageProps = {
  listing: ConversationListing;
  kind?: "classified" | "job" | "tender";
  isOwner?: boolean;
  participantEmail?: string;
  ownerEditHref?: string;
  canStartConversation?: boolean;
  backHref?: string;
  backLabel?: string;
  title?: string;
  intro?: string;
  ownerEntityLabel?: string;
  sellerListingsHref?: string;
  sellerListingsLabel?: string;
};

const MESSAGE_ATTACHMENT_ACCEPT = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ...MESSAGE_ATTACHMENT_MIME_TYPES,
].join(",");
const MESSAGE_ATTACHMENT_ALLOWED_MIME_TYPES = new Set<string>(MESSAGE_ATTACHMENT_MIME_TYPES);

function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatFileSize(sizeBytes: number) {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return "";
  }

  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  return `${Math.ceil(sizeBytes / 1024)} Ko`;
}

function resolveAttachmentMimeType(file: File) {
  const normalizedType = String(file.type || "").trim().toLowerCase();
  const normalizedName = String(file.name || "").trim().toLowerCase();

  if (MESSAGE_ATTACHMENT_ALLOWED_MIME_TYPES.has(normalizedType)) {
    return normalizedType;
  }

  if (normalizedName.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (normalizedName.endsWith(".doc")) {
    return "application/msword";
  }

  if (normalizedName.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  if (normalizedName.endsWith(".xls")) {
    return "application/vnd.ms-excel";
  }

  if (normalizedName.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }

  return normalizedType;
}

async function requestAttachmentPresign(mimeType: string, sizeBytes: number) {
  const response = await fetch("/api/media/message-attachment-presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mimeType, sizeBytes }),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        uploadUrl?: string;
        publicUrl?: string;
        error?: string;
      }
    | null;

  if (!response.ok || !payload?.uploadUrl || !payload.publicUrl) {
    throw new Error(getUserFacingErrorMessage(payload?.error, "Impossible de préparer l'envoi de ce fichier."));
  }

  return {
    uploadUrl: payload.uploadUrl,
    publicUrl: payload.publicUrl,
  };
}

async function uploadAttachmentToStorage(file: File): Promise<MessageAttachment> {
  const mimeType = resolveAttachmentMimeType(file);
  if (!MESSAGE_ATTACHMENT_ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error("Seuls les fichiers PDF, Word et Excel sont autorisés.");
  }

  if (file.size > MESSAGE_ATTACHMENT_MAX_TOTAL_BYTES) {
    throw new Error("La taille totale des fichiers ne doit pas dépasser 6 Mo.");
  }

  const presign = await requestAttachmentPresign(mimeType, file.size);
  const uploadResponse = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Impossible de téléverser ce fichier pour le moment.");
  }

  return {
    url: presign.publicUrl,
    fileName: file.name,
    mimeType,
    sizeBytes: file.size,
  };
}

function renderMessageHtml(content: string) {
  const sanitized = sanitizeMessageHtml(content);
  if (!sanitized) {
    return null;
  }

  return { __html: sanitized };
}

function ConversationAvatar({
  image,
  name,
  className,
}: {
  image?: string;
  name: string;
  className: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = String(name || "P").trim().charAt(0).toUpperCase() || "P";

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  if (!image || imageFailed) {
    return (
      <div aria-hidden="true" className={`${className} flex items-center justify-center bg-[#27624f] font-bold text-white`}>
        {initial}
      </div>
    );
  }

  return (
    <div className={className}>
      <img
        alt=""
        className="h-full w-full object-cover"
        onError={() => setImageFailed(true)}
        src={image}
      />
    </div>
  );
}

export default function ClassifiedConversationPage({
  listing,
  kind = "classified",
  isOwner = false,
  participantEmail,
  ownerEditHref = "/profil/petites-annonces",
  canStartConversation = true,
  backHref,
  backLabel,
  ownerEntityLabel = "Annonceur",
  sellerListingsHref,
  sellerListingsLabel,
}: ClassifiedConversationPageProps) {
  const usesRichComposer = kind === "job" || kind === "tender";
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const hasConversationMessages = messages.length > 0;
  const messagePlaceholder = hasConversationMessages
    ? kind === "job"
      ? isOwner
        ? "Écrivez votre réponse au candidat..."
        : "Écrivez votre réponse concernant votre candidature..."
      : kind === "tender"
        ? isOwner
          ? "Écrivez votre réponse au soumissionnaire..."
          : "Écrivez votre message de suivi..."
        : isOwner
          ? "Écrivez votre réponse..."
          : "Écrivez votre message..."
    : kind === "job" && isOwner
      ? "Bonjour, nous avons bien reçu votre candidature pour ce poste et reviendrons vers vous dans les meilleurs délais. Cordialement."
      : kind === "job"
        ? "Bonjour, je souhaite soumettre ma candidature pour ce poste..."
        : kind === "tender"
          ? isOwner
            ? "Bonjour, nous avons bien reçu votre soumission et accusons réception de votre dossier. Nous reviendrons vers vous à l'issue de la période d'évaluation. Cordialement."
            : "Bonjour, nous souhaitons soumettre notre candidature pour cet appel d'offres..."
          : isOwner
            ? "Bonjour, merci pour votre message. L'article est toujours disponible. N'hésitez pas à me contacter pour plus de détails."
            : "Bonjour, je suis intéressé(e) par votre annonce et souhaite obtenir plus d'informations. Êtes-vous toujours disponible ?";
  const [draft, setDraft] = useState("");
  const [showRichComposer, setShowRichComposer] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);
  const [attachmentInputKey, setAttachmentInputKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [threadParticipantName, setThreadParticipantName] = useState("");
  const [canRateSeller, setCanRateSeller] = useState(false);
  const [hasRatedSeller, setHasRatedSeller] = useState(false);
  const [sellerRatingScore, setSellerRatingScore] = useState(0);
  const [sellerRatingAverage, setSellerRatingAverage] = useState(Number(listing.ownerRatingAverage || 0));
  const [sellerRatingCount, setSellerRatingCount] = useState(Number(listing.ownerRatingCount || 0));
  const [hoveredSellerRating, setHoveredSellerRating] = useState(0);
  const [sellerRatingMessage, setSellerRatingMessage] = useState("");
  const [sellerRatingMessageTone, setSellerRatingMessageTone] = useState<"success" | "error" | "info">("info");
  const [isSubmittingSellerRating, setIsSubmittingSellerRating] = useState(false);

  async function loadThread() {
    if (!canStartConversation) {
      setMessages([]);
      setError("Cette publication ne dispose pas encore d'une adresse de contact pour la messagerie.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setThreadParticipantName("");

    try {
      const url = new URL(`/api/messages/${kind}/thread`, window.location.origin);
      url.searchParams.set("listingId", String(listing.id));
      if (participantEmail) {
        url.searchParams.set("participant", participantEmail);
      }

      const response = await fetch(url.toString(), {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(getUserFacingErrorMessage(payload?.error, "Impossible de charger la conversation."));
      }
      setMessages(Array.isArray(payload?.messages) ? payload.messages : []);
      setThreadParticipantName(typeof payload?.participantName === "string" ? payload.participantName : "");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("notifications:refresh"));
      }
    } catch (fetchError) {
      setError(getUserFacingErrorMessage(fetchError, "Impossible de charger la conversation."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadThread();
  }, [kind, listing.id, participantEmail]);

  useEffect(() => {
    let cancelled = false;

    async function loadSellerRating() {
      if (isOwner) {
        setCanRateSeller(false);
        return;
      }

      try {
        const response = await fetch(`/api/ratings/${kind}?listingId=${encodeURIComponent(String(listing.id))}`, {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || cancelled) {
          return;
        }

        setCanRateSeller(Boolean(payload?.canRate));
        setHasRatedSeller(Boolean(payload?.hasRated));
        setSellerRatingScore(Number(payload?.currentScore || 0));
        setSellerRatingAverage(Number(payload?.ownerRatingAverage || 0));
        setSellerRatingCount(Number(payload?.ownerRatingCount || 0));
      } catch {
        if (!cancelled) {
          setCanRateSeller(false);
        }
      }
    }

    void loadSellerRating();

    return () => {
      cancelled = true;
    };
  }, [isOwner, kind, listing.id]);

  const draftPlainTextLength = useMemo(
    () => (usesRichComposer ? extractMessagePlainText(draft).trim().length : draft.trim().length),
    [draft, usesRichComposer],
  );

  const canSend = useMemo(
    () => draftPlainTextLength >= 2 && (!isOwner || Boolean(participantEmail)),
    [draftPlainTextLength, isOwner, participantEmail],
  );

  const selectedAttachmentsTotalBytes = useMemo(
    () => getMessageAttachmentTotalBytes(selectedAttachments),
    [selectedAttachments],
  );
  const sidebarDetails = useMemo(() => {
    if (Array.isArray(listing.details) && listing.details.length > 0) {
      return listing.details.filter((detail) => String(detail.value || "").trim().length > 0);
    }

    return [
      { label: ownerEntityLabel, value: listing.seller },
      { label: "Prix", value: listing.price || "-" },
      { label: "Lieu", value: listing.location || "-" },
    ];
  }, [listing.details, listing.location, listing.price, listing.seller, ownerEntityLabel]);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedMessage = draft.trim();
    if (draftPlainTextLength < 2 || sending) {
      return;
    }

    setSending(true);
    setError("");
    try {
      const attachments = selectedAttachments.length > 0
        ? await Promise.all(selectedAttachments.map((attachment) => uploadAttachmentToStorage(attachment)))
        : [];
      const response = await fetch(`/api/messages/${kind}/thread`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId: listing.id,
          message: normalizedMessage,
          recipientEmail: isOwner ? participantEmail : undefined,
          attachments,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(getUserFacingErrorMessage(payload?.error, "Impossible d'envoyer votre message."));
      }

      setMessages((previous) => [...previous, payload.message].filter(Boolean));
      setDraft("");
      setSelectedAttachments([]);
      setAttachmentInputKey((current) => current + 1);
    } catch (submitError) {
      setError(getUserFacingErrorMessage(submitError, "Impossible d'envoyer votre message."));
    } finally {
      setSending(false);
    }
  }

  async function handleSellerRating(score: number) {
    if (!canRateSeller || hasRatedSeller || isSubmittingSellerRating || isOwner) {
      return;
    }

    setIsSubmittingSellerRating(true);
    setSellerRatingMessage("");

    try {
      const response = await fetch(`/api/ratings/${kind}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId: listing.id,
          score,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(getUserFacingErrorMessage(payload?.error, "Impossible d'enregistrer cette note."));
      }

      setHasRatedSeller(Boolean(payload?.hasRated ?? true));
      setSellerRatingScore(Number(payload?.score || score));
      setSellerRatingAverage(Number(payload?.ownerRatingAverage || 0));
      setSellerRatingCount(Number(payload?.ownerRatingCount || 0));
      setSellerRatingMessage("Note enregistrée avec succès.");
      setSellerRatingMessageTone("success");
    } catch (submitError) {
      setSellerRatingMessage(getUserFacingErrorMessage(submitError, "Impossible d'enregistrer cette note."));
      setSellerRatingMessageTone("error");
    } finally {
      setIsSubmittingSellerRating(false);
    }
  }

  return (
    <div className="profile-messages-page ui-page min-h-screen bg-[var(--page-bg)] pb-16 pt-8 font-['Roboto_Flex',sans-serif] text-[color:var(--text-main)]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 px-1">
          <a
            href={backHref || `/petites-annonces/${listing.slug}`}
            className="ui-text-main inline-flex items-center rounded-full border ui-border bg-[var(--surface-1)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:border-[#27624f] hover:text-[#27624f]"
          >
            {backLabel || "Retour à l'annonce"}
          </a>
          <p className="ui-text-soft hidden max-w-[52%] truncate text-right text-[13px] font-medium sm:block">{listing.title}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="ui-card overflow-hidden rounded-[28px] border ui-border bg-[var(--surface-1)] shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3 border-b ui-border bg-[var(--surface-1)] px-4 py-4 sm:px-5">
              <ConversationAvatar
                image={listing.image}
                name={threadParticipantName || listing.seller}
                className="ui-border h-10 w-10 shrink-0 overflow-hidden rounded-full border bg-[var(--surface-2)] text-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#27624f]">Conversation</p>
                <p className="ui-text-main truncate text-[15px] font-bold">{threadParticipantName || listing.seller}</p>
                <p className="ui-text-soft truncate text-[12px]">{listing.title}</p>
              </div>
            </div>

            <div className="message-thread-scroll min-h-[400px] max-h-[620px] overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(99,91,203,0.11),transparent_38%),var(--surface-2)] px-4 py-5 sm:px-5" aria-live="polite" aria-label="Fil de conversation">
              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center"><p className="ui-text-muted text-[14px]">Chargement des messages...</p></div>
              ) : !canStartConversation ? (
                <div className="flex min-h-[300px] items-center justify-center"><p className="ui-text-muted max-w-md text-center text-[14px] leading-6">Cette publication ne dispose pas encore d'une adresse de contact pour la messagerie.</p></div>
              ) : messages.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center"><p className="ui-text-muted max-w-sm text-center text-[14px] leading-6">Aucun message pour le moment. Écrivez le premier message pour commencer la discussion.</p></div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message, index) => {
                    const sanitizedHtml = usesRichComposer ? renderMessageHtml(message.content) : null;
                    const plainMessage = usesRichComposer ? extractMessagePlainText(message.content) : message.content;
                    const followsSameSender = index > 0 && messages[index - 1]?.isMine === message.isMine;

                    return (
                      <div key={message.id} className={`flex ${message.isMine ? "justify-end" : "justify-start"} ${followsSameSender ? "mt-[-2px]" : "mt-3"}`}>
                        <div
                          className={`max-w-[88%] rounded-[18px] px-4 py-2.5 text-[14px] leading-[1.55] [overflow-wrap:anywhere] shadow-sm ${
                            message.isMine
                              ? "rounded-br-[5px] bg-[var(--m3-secondary)] text-white"
                              : "ui-surface ui-text-main rounded-bl-[5px] border ui-border bg-[var(--surface-1)]"
                          }`}
                        >
                          {usesRichComposer ? (
                            sanitizedHtml ? (
                              <div className="thread-message-content" dangerouslySetInnerHTML={sanitizedHtml} />
                            ) : (
                              <p className="whitespace-pre-wrap">{plainMessage}</p>
                            )
                          ) : (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          )}
                          {normalizeMessageAttachments(message).length > 0 ? (
                            <div className="mt-3 flex flex-col gap-2">
                              {normalizeMessageAttachments(message).map((attachment) => (
                                <a
                                  key={`${message.id}:${attachment.url}:${attachment.fileName}`}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex max-w-full items-center gap-2 rounded-[12px] border px-3 py-2 text-[12px] font-semibold transition ${message.isMine ? "border-white/30 bg-white/10 text-white hover:bg-white/20" : "ui-border ui-surface-soft ui-text-main hover:border-[var(--m3-secondary)] hover:text-[var(--m3-secondary)]"}`}
                                >
                                  <span className="truncate">{attachment.fileName}</span>
                                  <span className="shrink-0">Télécharger</span>
                                </a>
                              ))}
                            </div>
                          ) : null}
                          <p className={`mt-1.5 text-right text-[10px] ${message.isMine ? "text-white/75" : "ui-text-soft"}`}>{formatMessageTime(message.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {isOwner && !participantEmail ? (
              <div className="ui-surface-soft ui-border mt-4 rounded-[12px] border bg-[var(--surface-2)] p-4">
                <p className="ui-text-main text-[13px] leading-[1.6]">
                  Ouvrez la conversation depuis le lien reçu par email pour répondre à un contact précis, ou revenez à votre espace profil.
                </p>
                <a
                  href={ownerEditHref}
                  className="ui-surface ui-text-main ui-border mt-3 inline-flex w-full items-center justify-center rounded-[12px] border bg-[var(--surface-1)] px-4 py-3 text-[14px] font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
                >
                  Modifier la publication
                </a>
              </div>
            ) : !canStartConversation ? null : (
              <form onSubmit={handleSubmit} className="border-t ui-border bg-[var(--surface-1)] p-3 sm:p-4">
                {usesRichComposer && showRichComposer ? (
                  <div className="mb-3 rounded-[16px] border ui-border-strong bg-[var(--surface-2)] p-2">
                      <RichTextEditor
                        value={draft}
                        onChange={(value) => {
                          setDraft(value);
                          if (error) {
                            setError("");
                          }
                        }}
                        placeholder={messagePlaceholder}
                        minHeight={130}
                        className="message-rich-text-editor"
                      />
                  </div>
                ) : null}

                {selectedAttachments.length > 0 ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selectedAttachments.map((attachment, index) => (
                      <div key={`${attachment.name}:${attachment.size}:${index}`} className="ui-surface-soft ui-border inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[12px]">
                        <FileText size={14} aria-hidden="true" className="shrink-0 text-[var(--m3-secondary)]" />
                        <span className="ui-text-main max-w-[150px] truncate">{attachment.name}</span>
                        <button type="button" onClick={() => setSelectedAttachments((current) => current.filter((_, currentIndex) => currentIndex !== index))} className="ui-text-soft rounded-full p-0.5 hover:text-[var(--m3-secondary)]" aria-label={`Retirer ${attachment.name}`}>
                          <X size={14} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                    <span className="ui-text-soft self-center text-[11px]">{formatFileSize(selectedAttachmentsTotalBytes)} / 6 Mo</span>
                  </div>
                ) : null}

                <div className="flex items-center gap-2 rounded-[18px] border ui-border-strong bg-[var(--surface-2)] p-1.5">
                  <label htmlFor={`message-attachment-${listing.id}`} className="ui-text-muted inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition hover:bg-[var(--m3-secondary)]/10 hover:text-[var(--m3-secondary)]" title="Ajouter une pièce jointe">
                    <Paperclip size={19} aria-hidden="true" />
                    <span className="sr-only">Ajouter une pièce jointe</span>
                    <input
                      id={`message-attachment-${listing.id}`}
                      key={attachmentInputKey}
                      type="file"
                      multiple
                      accept={MESSAGE_ATTACHMENT_ACCEPT}
                      onChange={(event) => {
                        const files = Array.from(event.target.files || []);
                        if (files.length === 0) {
                          return;
                        }

                        const invalidFile = files.find((file) => !MESSAGE_ATTACHMENT_ALLOWED_MIME_TYPES.has(resolveAttachmentMimeType(file)));
                        if (invalidFile) {
                          setAttachmentInputKey((current) => current + 1);
                          setError("Seuls les fichiers PDF, Word et Excel sont autorisés.");
                          return;
                        }

                        const nextAttachments = [...selectedAttachments, ...files];
                        if (getMessageAttachmentTotalBytes(nextAttachments) > MESSAGE_ATTACHMENT_MAX_TOTAL_BYTES) {
                          setAttachmentInputKey((current) => current + 1);
                          setError("La taille totale des fichiers ne doit pas dépasser 6 Mo.");
                          return;
                        }

                        setSelectedAttachments(nextAttachments);
                        if (error) {
                          setError("");
                        }
                        setAttachmentInputKey((current) => current + 1);
                      }}
                      className="sr-only"
                    />
                  </label>
                  {usesRichComposer ? (
                    <button type="button" onClick={() => setShowRichComposer((current) => !current)} className={`inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-3 text-[12px] font-semibold transition ${showRichComposer ? "bg-[var(--m3-secondary)]/10 text-[var(--m3-secondary)]" : "ui-text-muted hover:bg-[var(--m3-secondary)]/10 hover:text-[var(--m3-secondary)]"}`} aria-pressed={showRichComposer}>
                      <Type size={16} aria-hidden="true" /> Format
                    </button>
                  ) : null}
                  {!showRichComposer ? (
                    <textarea rows={1} value={usesRichComposer ? extractMessagePlainText(draft) : draft} onChange={(event) => { setDraft(event.target.value); if (error) setError(""); }} placeholder={messagePlaceholder} className="ui-text-main min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-[14px] leading-5 outline-none placeholder:text-[color:var(--text-soft)]" aria-label="Votre message" />
                  ) : <span className="ui-text-soft flex-1 px-2 text-[13px]">Mise en forme activée</span>}
                  <button type="submit" disabled={!canSend || sending} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--m3-secondary)] text-white transition hover:bg-[#4f47aa] disabled:cursor-not-allowed disabled:opacity-45" aria-label={sending ? "Envoi en cours" : "Envoyer le message"}>
                    <Send size={17} aria-hidden="true" />
                  </button>
                </div>
                <p className="ui-text-soft mt-2 pl-1 text-[11px]">PDF, Word et Excel, 6 Mo maximum.</p>
                {error ? <p className="text-[12px] text-[#27624f]">{error}</p> : null}
              </form>
            )}
          </section>

          <aside className="ui-card order-first h-fit rounded-[24px] border ui-border bg-[var(--surface-1)] p-5 shadow-[var(--shadow-soft)] lg:order-none lg:sticky lg:top-5">
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#27624f]">{listing.sidebarEyebrow || "Publication"}</p>
            <h2 className="ui-text-main mt-2 break-words text-[21px] font-bold leading-[1.2] [overflow-wrap:anywhere]">{listing.title}</h2>
            {!isOwner ? (
              <div className="mt-4">
                <div className="flex items-center gap-3">
                  <ConversationAvatar
                    image={listing.image}
                    name={listing.seller}
                    className="ui-border h-[62px] w-[62px] shrink-0 overflow-hidden rounded-[16px] border bg-[var(--surface-2)] text-[24px]"
                  />
                  <div className="min-w-0">
                    <p className="ui-text-main break-words text-[17px] font-bold leading-[1.2] [overflow-wrap:anywhere]">{listing.seller}</p>
                    <p className="ui-text-muted mt-1 text-[13px]">
                      {ownerEntityLabel}
                      {listing.location ? ` • ${listing.location}` : ""}
                    </p>
                    {sellerRatingCount > 0 ? (
                      <div className="ui-text-muted mt-1 flex flex-wrap items-center gap-2 text-[13px]">
                        <RatingStars value={sellerRatingAverage} size={14} />
                        <span>{sellerRatingAverage.toFixed(1)}/5 - {sellerRatingCount} avis</span>
                      </div>
                    ) : (
                      <p className="ui-text-muted mt-1 text-[13px]">Aucune note pour le moment.</p>
                    )}
                  </div>
                </div>
                {sellerListingsHref ? (
                  <a
                    href={sellerListingsHref}
                    className="ui-surface ui-text-main ui-border mt-4 inline-flex w-full items-center justify-center rounded-[12px] border bg-[var(--surface-1)] px-4 py-3 text-[14px] font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
                  >
                    {sellerListingsLabel || "Voir les autres publications"}
                  </a>
                ) : null}
              </div>
            ) : null}
            <div className="ui-text-muted mt-4 space-y-2 text-[14px]">
              {sidebarDetails.map((detail) => (
                <p key={`${detail.label}:${detail.value}`} className="break-words [overflow-wrap:anywhere]">
                  <span className="ui-text-main font-semibold">{detail.label}:</span> {detail.value}
                </p>
              ))}
            </div>
            {!isOwner ? (
              <div className="ui-surface-soft ui-border mt-5 rounded-[16px] border p-4">
                <p className="ui-text-main text-[12px] font-bold uppercase tracking-[0.16em]">
                  {hasRatedSeller ? "Votre évaluation" : "Évaluation"}
                </p>
                {hasRatedSeller ? (
                  <div className="mt-3">
                    <RatingStars value={sellerRatingScore} size={22} />
                    <p className="mt-2 text-[12px] font-medium text-[#15803d]">{sellerRatingScore}/5</p>
                  </div>
                ) : (
                  <>
                    <p className="ui-text-muted mt-2 text-[13px] leading-[1.6]">
                      {canRateSeller
                        ? "Notez cet annonceur une seule fois après votre échange."
                        : "La notation sera disponible après un échange de messagerie avec cet annonceur."}
                    </p>
                    <div className="mt-3">
                      <RatingStars
                        value={0}
                        size={22}
                        interactive
                        disabled={!canRateSeller || isSubmittingSellerRating}
                        hoverValue={hoveredSellerRating}
                        onHoverChange={setHoveredSellerRating}
                        onChange={(score) => void handleSellerRating(score)}
                      />
                    </div>
                  </>
                )}
                {sellerRatingMessage ? (
                  <p
                    className={`mt-3 text-[12px] ${
                      sellerRatingMessageTone === "success"
                        ? "text-[#15803d]"
                        : sellerRatingMessageTone === "error"
                          ? "text-[#27624f]"
                          : "ui-text-muted"
                    }`}
                  >
                    {sellerRatingMessage}
                  </p>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      </div>
      <style jsx global>{`
        .message-rich-text-editor .ql-toolbar {
          border: 0;
          border-bottom: 1px solid var(--border-subtle);
          background: transparent;
        }

        .message-rich-text-editor .ql-container {
          border: 0;
          min-height: 130px;
        }

        .message-rich-text-editor .ql-editor {
          min-height: 130px;
          color: var(--text-main);
        }

        .message-rich-text-editor .ql-editor.ql-blank::before {
          color: var(--text-soft);
        }

        .message-thread-scroll {
          scrollbar-color: rgba(99, 91, 203, 0.42) transparent;
          scrollbar-width: thin;
        }

        .message-thread-scroll::-webkit-scrollbar {
          width: 7px;
        }

        .message-thread-scroll::-webkit-scrollbar-thumb {
          background: rgba(99, 91, 203, 0.38);
          border-radius: 999px;
        }

        .thread-message-content p:first-child,
        .thread-message-content h1:first-child,
        .thread-message-content h2:first-child,
        .thread-message-content h3:first-child,
        .thread-message-content blockquote:first-child,
        .thread-message-content ul:first-child,
        .thread-message-content ol:first-child {
          margin-top: 0;
        }

        .thread-message-content p:last-child,
        .thread-message-content h1:last-child,
        .thread-message-content h2:last-child,
        .thread-message-content h3:last-child,
        .thread-message-content blockquote:last-child,
        .thread-message-content ul:last-child,
        .thread-message-content ol:last-child {
          margin-bottom: 0;
        }

        .thread-message-content p,
        .thread-message-content ul,
        .thread-message-content ol,
        .thread-message-content blockquote {
          margin: 0 0 0.75rem;
        }

        .thread-message-content ul,
        .thread-message-content ol {
          padding-left: 1.25rem;
        }

        .thread-message-content a {
          color: inherit;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .thread-message-content blockquote {
          border-left: 3px solid currentColor;
          padding-left: 0.85rem;
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}



