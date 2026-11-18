export const MESSAGE_ATTACHMENT_MAX_TOTAL_BYTES = 6 * 1024 * 1024;

export const MESSAGE_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export type MessageAttachment = {
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

type MessageAttachmentCarrier = {
  attachment?: Partial<MessageAttachment> | null;
  attachments?: Array<Partial<MessageAttachment>> | null;
};

export function normalizeMessageAttachments(value: MessageAttachmentCarrier | null | undefined): MessageAttachment[] {
  const next: MessageAttachment[] = [];
  const source = Array.isArray(value?.attachments) && value?.attachments.length > 0
    ? value.attachments
    : value?.attachment
      ? [value.attachment]
      : [];

  for (const entry of source) {
    if (!entry?.url || !entry?.fileName) {
      continue;
    }

    const normalized: MessageAttachment = {
      url: String(entry.url || "").trim(),
      fileName: String(entry.fileName || "").trim(),
      mimeType: String(entry.mimeType || "").trim().toLowerCase(),
      sizeBytes: Number(entry.sizeBytes || 0),
    };

    if (!normalized.url || !normalized.fileName) {
      continue;
    }

    if (!next.some((item) => item.url === normalized.url && item.fileName === normalized.fileName)) {
      next.push(normalized);
    }
  }

  return next;
}

export function getMessageAttachmentPreviewLabel(value: MessageAttachmentCarrier | null | undefined): string {
  const attachments = normalizeMessageAttachments(value);
  if (attachments.length === 0) {
    return "";
  }

  if (attachments.length === 1) {
    return `Fichier joint : ${attachments[0].fileName}`;
  }

  return `${attachments.length} fichiers joints`;
}

export function getMessageAttachmentTotalBytes(attachments: Array<{ sizeBytes?: number } | File>): number {
  return attachments.reduce((total, attachment) => {
    const sizeBytes =
      typeof File !== "undefined" && attachment instanceof File
        ? attachment.size
        : Number((attachment as { sizeBytes?: number } | null | undefined)?.sizeBytes || 0);
    return total + (Number.isFinite(sizeBytes) && sizeBytes > 0 ? sizeBytes : 0);
  }, 0);
}
