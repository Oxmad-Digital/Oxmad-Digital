"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

/** The request as a ready-to-paste prompt for Claude Code, with a copy button. */
export default function CopyPrompt({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState<boolean | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      setCopied(false);
    }
    setTimeout(() => setCopied(null), 2500);
  }

  return (
    <details className="adm-card adm-details">
      <summary>Prompt Claude Code</summary>
      <p className="adm-muted">À coller dans Claude Code, ouvert dans le dépôt du site du client.</p>
      <div className="adm-prompt-actions">
        <button type="button" className="adm-btn adm-btn-primary" onClick={copy}>
          <Copy size={14} aria-hidden="true" /> Copier le prompt
        </button>
        {copied === true && <span className="adm-ok" role="status">Copié.</span>}
        {copied === false && <span className="adm-error" role="alert">Copie impossible : sélectionnez le texte ci-dessous.</span>}
      </div>
      <pre className="adm-prompt">{prompt}</pre>
    </details>
  );
}
