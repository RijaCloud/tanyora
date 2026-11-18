const BLOCK_BREAK_TAGS = ["</p>", "</div>", "</li>", "</ul>", "</ol>", "<br>", "<br/>", "<br />"];
const SIMPLE_ALLOWED_TAGS = new Set(["p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "a"]);
const SIMPLE_ALLOWED_ATTRIBUTES = new Map<string, Set<string>>([["a", new Set(["href", "target", "rel"])]]);
const SAFE_LINK_PROTOCOLS = ["http:", "https:"];
const EMAIL_REGEX = /\b([a-z0-9._%+-]{2})[a-z0-9._%+-]*@([a-z0-9-]+(?:\.[a-z0-9-]+)+)\b/gi;
const PHONE_REGEX = /(?:\+?\d[\d\s().-]{7,}\d)/g;

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

export function looksLikeListingHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value) || /<!--[\s\S]*?-->/i.test(value);
}

function maskEmailAddress(value: string) {
  const [localPart, domainPart] = value.split("@");
  if (!localPart || !domainPart) {
    return value;
  }

  const visibleLocal = localPart.slice(0, Math.min(2, localPart.length));
  const domainSegments = domainPart.split(".");
  const topLevelDomain = domainSegments.pop() || "";
  const rootDomain = domainSegments.join(".");
  const visibleDomain = rootDomain ? `${rootDomain.slice(0, 1)}****` : "****";

  return `${visibleLocal}***@${visibleDomain}${topLevelDomain ? `.${topLevelDomain}` : ""}`;
}

function maskPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 12) {
    return value;
  }

  if (!digits.startsWith("0") && !digits.startsWith("261")) {
    return value;
  }

  const hasInternationalPrefix = value.trim().startsWith("+") && digits.startsWith("261");
  const visibleDigits = digits.slice(0, Math.min(3, digits.length));
  const hiddenDigitCount = Math.max(digits.length - visibleDigits.length, 0);
  const hiddenGroups = Array.from({ length: Math.max(1, Math.ceil(hiddenDigitCount / 2)) }, () => "**").join(" ");

  return `${hasInternationalPrefix ? "+" : ""}${visibleDigits}${hiddenGroups ? ` ${hiddenGroups}` : ""}`;
}

export function maskListingPublicText(value: string) {
  if (!value) {
    return "";
  }

  return value
    .replace(EMAIL_REGEX, (match) => maskEmailAddress(match))
    .replace(PHONE_REGEX, (match) => maskPhoneNumber(match));
}

function decodeBasicHtmlEntities(value: string) {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value;
    return textarea.value;
  }

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

export function extractPlainTextFromListingHtml(value: string) {
  if (!value) {
    return "";
  }

  const normalizedBreaks = BLOCK_BREAK_TAGS.reduce(
    (current, tag) => current.replaceAll(tag, "\n"),
    value.replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, ""),
  );

  return maskListingPublicText(decodeBasicHtmlEntities(normalizedBreaks.replace(/<[^>]+>/g, " ")))
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

export function sanitizeListingHtml(value: string) {
  if (!value || !looksLikeListingHtml(value) || typeof window === "undefined" || typeof DOMParser === "undefined") {
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
        if (child.nodeType === Node.TEXT_NODE) {
          child.textContent = maskListingPublicText(child.textContent || "");
        }
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
