function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[character] || character));
}

export function previewRestrictedArticleHtml(html: string, separatorLimit: number): string {
  const plainText = stripHtml(html);
  if (!plainText) return "";

  const words = plainText.split(" ");
  return `${escapeHtml(words.slice(0, Math.min(words.length, separatorLimit + 1)).join(" "))} […]`;
}
