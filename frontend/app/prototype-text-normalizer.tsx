"use client";

import { useEffect } from "react";
import { fixMojibake, looksMojibake } from "@/lib/text/mojibake";

function normalizeTextNodes(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const toFix: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const value = node.nodeValue ?? "";

    if (!value.trim()) continue;
    if (!looksMojibake(value)) continue;

    const parentTag = node.parentElement?.tagName;
    if (parentTag === "SCRIPT" || parentTag === "STYLE" || parentTag === "NOSCRIPT") {
      continue;
    }

    toFix.push(node);
  }

  for (const node of toFix) {
    const currentValue = node.nodeValue ?? "";
    const normalizedValue = fixMojibake(currentValue);

    // Assigning an unchanged value still emits a MutationObserver record in
    // some browsers. Do not let an unfixable legacy character re-trigger the
    // observer indefinitely and block the article page.
    if (normalizedValue !== currentValue) {
      node.nodeValue = normalizedValue;
    }
  }
}

function normalizeTextNode(node: Text) {
  const currentValue = node.nodeValue ?? "";
  if (!looksMojibake(currentValue)) {
    return;
  }

  const normalizedValue = fixMojibake(currentValue);
  if (normalizedValue !== currentValue) {
    node.nodeValue = normalizedValue;
  }
}

export default function PrototypeTextNormalizer() {
  useEffect(() => {
    normalizeTextNodes(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          normalizeTextNode(mutation.target as Text);
          continue;
        }

        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              normalizeTextNode(node as Text);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              normalizeTextNodes(node as Element);
            }
          });
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
