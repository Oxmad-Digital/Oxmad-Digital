"use client";

import { useState } from "react";
import "./Faq.css";

const FAQS = [
  {
    q: "Quels types de structures accompagnez-vous ?",
    a: "Nous intervenons pour tous types de formes juridiques françaises (SARL, SAS, SCI, Holding, etc.), qu'il s'agisse de créations, de gestion courante ou d'opérations complexes de restructuration. Nous travaillons principalement en partenariat avec des experts-comptables.",
  },
  {
    q: "Comment garantissez-vous la sécurité de mes données ?",
    a: "La confidentialité est au cœur de notre métier. Nous utilisons des outils de signature électronique sécurisés (Yousign/Oneflow) et pouvons travailler directement sur vos logiciels métiers (Pennylane, Sage, etc.) via des accès sécurisés pour garantir une continuité parfaite sans rupture de données.",
  },
  {
    q: "Quels sont vos délais pour l'obtention d'un Kbis ?",
    a: "Pour une création classique, nous obtenons généralement le Kbis en 2 à 5 jours ouvrés après le dépôt sur le Guichet Unique. Pour les activités artisanales (CMA), les délais peuvent varier entre 4 et 6 semaines selon les chambres consulaires.",
  },
  {
    q: "Pouvez-vous travailler sur nos propres outils métiers ?",
    a: "Tout à fait. Nos équipes sont formées aux logiciels standards du marché (Pennylane, Sage, Cegid, MyUnisoft, etc.). Nous nous intégrons directement à votre écosystème digital pour que notre intervention soit transparente et n'ajoute aucune friction à vos processus actuels.",
  },
  {
    q: "Comment gérez-vous la distance ?",
    a: "Madagascar ne possède qu'une à deux heures de décalage avec la France (selon la saison). Cela nous permet de travailler en parfaite synchro avec vos horaires de bureau. Nos processus sont 100% digitalisés, vous offrant une réactivité identique, voire supérieure, à un collaborateur en interne.",
  },
];

export default function Faq() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="faq">
      <div className="faq-inner">
        <div className="faq-header">
          <span className="section-label">FAQ</span>
          <h2>Vous avez des questions ?</h2>
          <p>Nous répondons aux interrogations les plus fréquentes des cabinets et entreprises pour faciliter votre transition vers l&apos;externalisation.</p>
        </div>
        <div className="faq-list">
          {FAQS.map((faq, i) => (
            <div className="faq-item" key={i}>
              <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{faq.q}</span>
                <span className="faq-chevron">
                  {openFaq === i ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                </span>
              </button>
              {openFaq === i && <div className="faq-answer">{faq.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
