"use client";

import { useContact } from "@/components/Contact/ContactContext";

export default function ContactButton() {
  const { open } = useContact();

  return (
    <button className="btn btn-accent cta-big" type="button" data-cursor="Écrire" data-magnetic onClick={open}>
      Démarrer une conversation
    </button>
  );
}
