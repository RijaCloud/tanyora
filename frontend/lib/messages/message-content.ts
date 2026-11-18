const BLOCK_BREAK_TAGS = [
  "</p>",
  "</div>",
  "</li>",
  "</ul>",
  "</ol>",
  "</blockquote>",
  "</h1>",
  "</h2>",
  "</h3>",
  "<br>",
  "<br/>",
  "<br />",
];

const HTML_ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#039;": "'",
  "&apos;": "'",
  "&rsquo;": "'",
  "&lsquo;": "'",
  "&rdquo;": '"',
  "&ldquo;": '"',
  "&ndash;": "–",
  "&mdash;": "—",
  "&hellip;": "…",
  "&eacute;": "é",
  "&egrave;": "è",
  "&ecirc;": "ê",
  "&agrave;": "à",
  "&acirc;": "â",
  "&ccedil;": "ç",
  "&ugrave;": "ù",
  "&ucirc;": "û",
  "&ocirc;": "ô",
  "&icirc;": "î",
  "&iuml;": "ï",
};

const SIMPLE_ALLOWED_TAGS = new Set(["p", "br", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "a", "h1", "h2", "h3", "blockquote"]);
const SIMPLE_ALLOWED_ATTRIBUTES = new Map<string, Set<string>>([["a", new Set(["href", "target", "rel"])]]); 
const SAFE_LINK_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];

export function looksLikeMessageHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value) || /<!--[\s\S]*?-->/i.test(value);
}

function decodeBasicHtmlEntities(value: string) {
  let output = value;
  for (const [entity, decoded] of Object.entries(HTML_ENTITY_MAP)) {
    output = output.split(entity).join(decoded);
  }
  return output.replace(/&#(\d+);/g, (_, codePoint) => {
    const parsed = Number.parseInt(codePoint, 10);
    return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
  }).replace(/&#x([0-9a-f]+);/gi, (_, codePoint) => {
    const parsed = Number.parseInt(codePoint, 16);
    return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
  });
}

export function extractMessagePlainText(value: string) {
  if (!value) {
    return "";
  }

  if (!looksLikeMessageHtml(value)) {
    return value
      .replace(/\r/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  const normalizedBreaks = BLOCK_BREAK_TAGS.reduce(
    (current, tag) => current.replaceAll(tag, "\n"),
    value.replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, ""),
  );

  return decodeBasicHtmlEntities(normalizedBreaks.replace(/<[^>]+>/g, " "))
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function sanitizeAnchorHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed, "https://tanyora.mijary.tech");
    return SAFE_LINK_PROTOCOLS.includes(parsed.protocol) ? trimmed : "";
  } catch {
    return "";
  }
}

export function sanitizeMessageHtml(value: string) {
  if (!value || !looksLikeMessageHtml(value) || typeof window === "undefined" || typeof DOMParser === "undefined") {
    return "";
  }

  const parser = new DOMParser();
  const documentFragment = parser.parseFromString(`<div>${value}</div>`, "text/html");
  const root = documentFragment.body.firstElementChild;
  if (!root) {
    return "";
  }

  const sanitizeNode = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.parentNode?.removeChild(child);
        continue;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }

      const element = child as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      if (!SIMPLE_ALLOWED_TAGS.has(tagName)) {
        sanitizeNode(element);
        element.replaceWith(...Array.from(element.childNodes));
        continue;
      }

      const allowedAttributes = SIMPLE_ALLOWED_ATTRIBUTES.get(tagName) ?? new Set<string>();
      for (const attribute of Array.from(element.attributes)) {
        if (!allowedAttributes.has(attribute.name.toLowerCase())) {
          element.removeAttribute(attribute.name);
        }
      }

      if (tagName === "a") {
        sanitizeNode(element);
        const safeHref = sanitizeAnchorHref(element.getAttribute("href") || "");
        if (!safeHref) {
          element.replaceWith(...Array.from(element.childNodes));
          continue;
        }
        element.setAttribute("href", safeHref);
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noopener noreferrer");
        continue;
      }

      sanitizeNode(element);
    }
  };

  sanitizeNode(root);
  return root.innerHTML.trim();
}
