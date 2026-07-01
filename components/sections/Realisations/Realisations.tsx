import "./Realisations.css";

const REALISATIONS = [
  {
    num: "01",
    name: "LINEA",
    category: "Industrie pharmaceutique",
    highlight: ["Un site vitrine qui inspire ", "confiance", "."],
    features: [
      { i: "ti-pencil", t: "Design sur mesure" },
      { i: "ti-device-mobile", t: "Responsive" },
      { i: "ti-search", t: "SEO" },
      { i: "ti-sparkles", t: "Animations" },
      { i: "ti-forms", t: "Formulaire avancé" },
      { i: "ti-language", t: "Multilingue" },
    ],
    shot: "Site vitrine",
  },
  {
    num: "02",
    name: "NATURALHY",
    category: "Compléments alimentaires",
    highlight: ["Une boutique en ligne fluide, des achats ", "simplifiés", "."],
    features: [
      { i: "ti-shopping-cart", t: "E-commerce" },
      { i: "ti-shield-check", t: "Paiement sécurisé" },
      { i: "ti-box", t: "Gestion des stocks" },
      { i: "ti-truck-delivery", t: "Livraison" },
      { i: "ti-user", t: "Espace client" },
      { i: "ti-adjustments", t: "Produits filtrés" },
    ],
    shot: "Boutique e-commerce",
  },
  {
    num: "03",
    name: "HÔTEL DU MOULIN",
    category: "Hôtellerie & séminaires",
    highlight: ["Des réservations en ligne, ", "simples et rapides", "."],
    features: [
      { i: "ti-calendar-event", t: "Réservation en ligne" },
      { i: "ti-credit-card", t: "Paiement en ligne" },
      { i: "ti-calendar", t: "Agenda" },
      { i: "ti-circle-check", t: "Confirmation auto." },
      { i: "ti-mail", t: "E-mails" },
      { i: "ti-calendar-stats", t: "Gestion des dispo." },
    ],
    shot: "Plateforme de réservation",
  },
  {
    num: "04",
    name: "IHLE",
    category: "Distribution de pneus",
    highlight: ["Un espace pro pensé pour aller ", "à l'essentiel", "."],
    features: [
      { i: "ti-briefcase", t: "Espace professionnel" },
      { i: "ti-book", t: "Catalogue interactif" },
      { i: "ti-file-invoice", t: "Demande de devis" },
      { i: "ti-package", t: "Suivi des commandes" },
      { i: "ti-download", t: "Documents téléchargeables" },
      { i: "ti-users", t: "Multi-accès" },
    ],
    shot: "Portail B2B",
  },
];

const ProjectMockup = ({ label }: { label: string }) => (
  <div className="ox-real-mockup">
    <div className="ox-real-mockup-laptop">
      <div className="ox-real-mockup-bar">
        <span style={{ background: "#ff5f57" }} />
        <span style={{ background: "#ffbd2e" }} />
        <span style={{ background: "#28c840" }} />
      </div>
      <div className="ox-real-mockup-screen">
        <span>{label}</span>
      </div>
    </div>
    <div className="ox-real-mockup-phone">
      <span className="ox-real-mockup-phone-notch" />
      <div className="ox-real-mockup-phone-screen" />
    </div>
  </div>
);

type Realisation = (typeof REALISATIONS)[number];

const RealCard = ({ p, perched }: { p: Realisation; perched?: boolean }) => (
  <div className="ox-real-card">
    {perched && (
      <img
        src="/robot-perched.svg"
        alt="Mascotte Oxmad Digital"
        className="ox-real-card-robot"
      />
    )}
    {perched && (
      <div className="ox-real-card-note">
        <p>Voici quelques connexions que nous avons créées !</p>
        <i className="ti ti-arrow-down-right" />
      </div>
    )}

    <div className="ox-real-card-head">
      <span className="ox-real-card-num">{p.num}</span>
      <div>
        <div className="ox-real-card-name">{p.name}</div>
        <div className="ox-real-card-category">{p.category}</div>
      </div>
    </div>

    <div className="ox-real-card-highlight">
      {p.highlight[0]}
      <span className="ox-real-card-highlight-accent">{p.highlight[1]}</span>
      {p.highlight[2]}
    </div>

    <ul className="ox-real-card-features">
      {p.features.map((f, i) => (
        <li key={i}>
          <span className="ox-real-card-feature-icon">
            <i className={`ti ${f.i}`} />
          </span>
          {f.t}
        </li>
      ))}
    </ul>

    <ProjectMockup label={p.shot} />

    <a href="/realisations" className="ox-real-card-link">
      Voir le projet
      <span className="ox-real-card-link-arrow">→</span>
    </a>
  </div>
);

export default function Realisations() {
  return (
    <section id="realisations" className="ox-realisations">
      <div className="ox-realisations-header">
        <div className="ox-realisations-kicker">
          <span />
          Portfolio
        </div>
        <h2 className="ox-realisations-title">
          Nos réalisations<span className="ox-realisations-title-dot">.</span>
        </h2>
        <p className="ox-realisations-subtitle">
          Des projets différents.
          <br />
          Des objectifs communs :
          <br />
          <span className="ox-realisations-subtitle-accent">créer les bonnes connexions.</span>
        </p>
        <span className="ox-realisations-rule" />
      </div>

      <div className="ox-realisations-grid">
        {REALISATIONS.map((p, i) => (
          <RealCard key={p.num} p={p} perched={i === REALISATIONS.length - 1} />
        ))}
      </div>
    </section>
  );
}
