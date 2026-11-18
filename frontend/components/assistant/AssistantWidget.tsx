"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
import styles from "./AssistantWidget.module.css";

type Message = { role: "user" | "assistant"; content: string };
const suggestions = ["Comment publier une annonce ?", "Comment trouver un géologue ?", "Je n'ai pas encore mes documents"];

export function AssistantWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (process.env.NEXT_PUBLIC_TANYORA_ASSISTANT_ENABLED !== "true" || !user || user.onboardingCompleted === false) return null;

  async function send(question = input) {
    const content = question.trim();
    if (!content || sending || content.length > 800) return;
    const history = [...messages, { role: "user" as const, content }].slice(-8);
    setMessages(history);
    setInput("");
    setError("");
    setSending(true);
    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || typeof payload?.answer !== "string") throw new Error(payload?.error || "L'assistant est indisponible.");
      setMessages([...history, { role: "assistant", content: payload.answer }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "L'assistant est indisponible.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.root}>
      {open ? (
        <section className={styles.panel} aria-label="Assistant Tanyora">
          <header className={styles.header}><div><span>GUIDE TANYORA</span><h2>Une question ?</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Fermer l'assistant"><X size={20} /></button></header>
          <div className={styles.conversation} aria-live="polite">
            {messages.length === 0 ? <><p className={styles.intro}>Je peux vous aider à explorer, publier et trouver un spécialiste sur Tanyora.</p><div className={styles.suggestions}>{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => void send(suggestion)}>{suggestion}</button>)}</div></> : messages.map((message, index) => <p key={index} className={message.role === "user" ? styles.userMessage : styles.assistantMessage}>{message.content}</p>)}
            {sending ? <p className={styles.status}>L'assistant prépare sa réponse...</p> : null}
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
          </div>
          <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void send(); }}><label htmlFor="tanyora-assistant-question" className={styles.srOnly}>Votre question</label><textarea id="tanyora-assistant-question" ref={inputRef} rows={2} maxLength={800} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Posez votre question..." /><button type="submit" disabled={!input.trim() || sending} aria-label="Envoyer la question"><Send size={18} /></button></form>
          <p className={styles.disclaimer}>Ne partagez pas de coordonnées ni de documents. Vos questions sont transmises à un service d'IA. Pour les démarches réglementaires, faites confirmer la réponse par un professionnel.</p>
        </section>
      ) : null}
      <button type="button" className={styles.launcher} onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant Tanyora"}><MessageCircle size={20} aria-hidden="true" /><span>Besoin d'aide ?</span></button>
    </div>
  );
}
