import "./HowItWorks.css";

const STEPS = [
  {
    n: 1,
    title: "Conseil & Cadrage stratégique",
    desc: "Un échange initial pour valider vos choix stratégiques (régime d'imposition, TVA, capital social) et définir le périmètre de la mission.",
  },
  {
    n: 2,
    title: "Rédaction & Collecte des pièces",
    desc: "Nos experts rédigent vos actes sur-mesure (statuts, PV, contrats). Nous centralisons les justificatifs et coordonnons le dépôt des fonds.",
  },
  {
    n: 3,
    title: "Signature & Téléprocédures",
    desc: "Signature électronique sécurisée (Yousign/Oneflow) et saisie immédiate sur le Guichet Unique (INPI) par nos formalistes dédiés.",
  },
  {
    n: 4,
    title: "Livraison & Livrables de synthèse",
    desc: "Réception de votre K-bis à jour et remise d'une plaquette de synthèse claire expliquant les impacts de l'opération réalisée.",
  },
];

export default function HowItWorks() {
  return (
    <section className="how">
      <div className="how-inner">
        <div className="how-header">
          <div className="how-header-left">
            <span className="section-label">Notre approche</span>
            <h2>Comment nous<br />collaborons ?</h2>
          </div>
          <div className="how-header-right">
            <p>Chez Thadéus Externalia Juris, nous avons modélisé des processus rigoureux pour vous garantir réactivité et sécurité à chaque étape de la vie de vos dossiers.</p>
          </div>
        </div>
        <div className="how-steps">
          {STEPS.map((step) => (
            <div className="step-card" key={step.n}>
              <div className="step-number"><span>{step.n}</span></div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
