"use client";

import type { ComponentType, ErrorInfo, ReactNode } from "react";
import { Component, useEffect, useMemo, useState } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  minHeight?: number;
  variant?: "default" | "listing";
};

type ReactQuillComponentLike = ComponentType<{
  theme?: string;
  value: string;
  onChange: (value: string) => void;
  modules?: Record<string, unknown> | { toolbar: false };
  formats?: string[];
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}>;

let reactQuillModulePromise: Promise<ReactQuillComponentLike> | null = null;
let quillCssLoaded = false;

class RichTextEditorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // The plain textarea fallback keeps publishing available if Quill fails.
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function loadReactQuillComponent() {
  if (!reactQuillModulePromise) {
    reactQuillModulePromise = import("react-quill").then(
      (module) => module.default as unknown as ReactQuillComponentLike,
    );
  }

  return reactQuillModulePromise;
}

async function loadQuillCssOnce() {
  if (quillCssLoaded || typeof window === "undefined") {
    return;
  }

  await import("react-quill/dist/quill.snow.css");
  quillCssLoaded = true;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Rédigez votre contenu ici",
  className = "",
  editable = true,
  minHeight = 200,
}: RichTextEditorProps) {
  const [ReactQuillComponent, setReactQuillComponent] = useState<ReactQuillComponentLike | null>(null);
  const [canRenderClientEditor, setCanRenderClientEditor] = useState(false);

  const modules = useMemo(
    () =>
      editable
        ? {
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ["bold", "italic", "underline", "strike"],
              [{ list: "ordered" }, { list: "bullet" }],
              [{ indent: "-1" }, { indent: "+1" }],
              [{ align: [] }],
              ["clean"],
            ],
          }
        : { toolbar: false as const },
    [editable],
  );

  const formats = useMemo(
    () => ["header", "bold", "italic", "underline", "strike", "list", "bullet", "indent", "align"],
    [],
  );

  useEffect(() => {
    let isCancelled = false;

    async function setup() {
      if (typeof window === "undefined") {
        return;
      }

      try {
        await loadQuillCssOnce();
        const component = await loadReactQuillComponent();
        if (!isCancelled) {
          setReactQuillComponent(() => component);
          setCanRenderClientEditor(true);
        }
      } catch {
        if (!isCancelled) {
          setReactQuillComponent(null);
          setCanRenderClientEditor(false);
        }
      }
    }

    void setup();

    return () => {
      isCancelled = true;
    };
  }, []);

  const wrapperClassName = className ? `rich-text-editor ${className}` : "rich-text-editor";
  const textareaFallback = (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      readOnly={!editable}
      className="rich-text-editor__fallback"
      style={{ minHeight }}
    />
  );
  const showTextareaFallback = typeof window === "undefined" || !canRenderClientEditor || !ReactQuillComponent;

  return (
    <div className={wrapperClassName}>
      {showTextareaFallback ? (
        textareaFallback
      ) : (
        <RichTextEditorBoundary fallback={textareaFallback}>
          <ReactQuillComponent
            theme="snow"
            value={value}
            onChange={onChange}
            modules={modules}
            formats={formats}
            placeholder={placeholder}
            readOnly={!editable}
          />
        </RichTextEditorBoundary>
      )}

      <style jsx global>{`
        .rich-text-editor .ql-toolbar {
          background-color: #f9fafb;
          border-color: #e5e7eb;
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
        }

        .dark .rich-text-editor .ql-toolbar {
          background-color: transparent;
          border-color: var(--border-subtle);
        }

        .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: #4b5563;
        }

        .rich-text-editor .ql-toolbar .ql-fill {
          fill: #4b5563;
        }

        .rich-text-editor .ql-toolbar .ql-picker {
          color: #4b5563;
        }

        .rich-text-editor .ql-toolbar .ql-picker-options {
          background-color: #ffffff;
          border-color: #e5e7eb;
          color: #111827;
        }

        .dark .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: #ffffff;
        }

        .dark .rich-text-editor .ql-toolbar .ql-fill {
          fill: #ffffff;
        }

        .dark .rich-text-editor .ql-toolbar .ql-picker {
          color: #ffffff;
        }

        .dark .rich-text-editor .ql-toolbar .ql-picker-options {
          background-color: var(--surface-1);
          border-color: var(--border-subtle);
          color: var(--text-main);
        }

        .dark .rich-text-editor .ql-toolbar button:hover .ql-stroke,
        .dark .rich-text-editor .ql-toolbar button.ql-active .ql-stroke,
        .dark .rich-text-editor .ql-toolbar .ql-picker-label:hover .ql-stroke,
        .dark .rich-text-editor .ql-toolbar .ql-picker-label.ql-active .ql-stroke,
        .dark .rich-text-editor .ql-toolbar .ql-picker-item:hover .ql-stroke,
        .dark .rich-text-editor .ql-toolbar .ql-picker-item.ql-selected .ql-stroke {
          stroke: #ffb5b8;
        }

        .dark .rich-text-editor .ql-toolbar button:hover .ql-fill,
        .dark .rich-text-editor .ql-toolbar button.ql-active .ql-fill,
        .dark .rich-text-editor .ql-toolbar .ql-picker-label:hover .ql-fill,
        .dark .rich-text-editor .ql-toolbar .ql-picker-label.ql-active .ql-fill,
        .dark .rich-text-editor .ql-toolbar .ql-picker-item:hover .ql-fill,
        .dark .rich-text-editor .ql-toolbar .ql-picker-item.ql-selected .ql-fill {
          fill: #ffb5b8;
        }

        .dark .rich-text-editor .ql-toolbar button:hover,
        .dark .rich-text-editor .ql-toolbar button.ql-active,
        .dark .rich-text-editor .ql-toolbar .ql-picker-label:hover,
        .dark .rich-text-editor .ql-toolbar .ql-picker-label.ql-active,
        .dark .rich-text-editor .ql-toolbar .ql-picker-item:hover,
        .dark .rich-text-editor .ql-toolbar .ql-picker-item.ql-selected {
          color: #ffb5b8;
        }

        .rich-text-editor .ql-container {
          min-height: ${minHeight}px;
          font-size: 15px;
          font-family: inherit;
          border-color: #e5e7eb;
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
        }

        .dark .rich-text-editor .ql-container {
          border-color: var(--border-subtle);
          background: transparent;
        }

        .rich-text-editor .ql-editor {
          min-height: ${minHeight}px;
          padding: 12px 15px;
        }

        .dark .rich-text-editor .ql-editor {
          color: var(--text-main);
        }

        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }

        .rich-text-editor .ql-editor ul,
        .rich-text-editor .ql-editor ol {
          padding-left: 1.5em;
        }

        .rich-text-editor .ql-editor li {
          margin-bottom: 0.5em;
        }

        .rich-text-editor .ql-editor h1 {
          font-size: 2em;
          font-weight: 700;
          margin-bottom: 0.5em;
        }

        .rich-text-editor .ql-editor h2 {
          font-size: 1.5em;
          font-weight: 700;
          margin-bottom: 0.5em;
        }

        .rich-text-editor .ql-editor h3 {
          font-size: 1.17em;
          font-weight: 700;
          margin-bottom: 0.5em;
        }

        .rich-text-editor__fallback {
          width: 100%;
          min-height: ${minHeight}px;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          padding: 12px 15px;
          font: inherit;
          font-size: 15px;
          line-height: 1.6;
          color: #111827;
          background: #ffffff;
          resize: vertical;
          outline: none;
        }

        .rich-text-editor__fallback::placeholder {
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
