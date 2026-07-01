import SectionHeader from "@/components/ui/SectionHeader";
import "./About.css";

const FEATURES = [
  {
    icon: "ti-stack-2",
    title: "Une stack moderne (Next.js)",
    desc: "Nous avons fait le choix de technologies de pointe pour que vous ne soyez jamais limité en termes de design ou de fonctionnalités.",
  },
  {
    icon: "ti-key",
    title: "Une totale indépendance",
    desc: "Nous vous livrons le site avec sa base de code (codebase) et créons l'ensemble des comptes de services tiers à votre nom. Vous êtes ainsi le véritable propriétaire de votre site.",
  },
];

export default function About() {
  return (
    <section className="ox-about" id="apropos">
      <div className="ox-about-glow" />
      <div className="ox-about-grid">
        <div className="ox-about-image">
          <span className="ox-about-image-label">
            <i className="ti ti-photo" />
            Photo de l&apos;équipe
          </span>
        </div>

        <div className="ox-about-copy">
          <SectionHeader
            badge="À propos"
            title="Des solutions digitales performantes et"
            highlight="durables."
            subtitle="Chez Oxmad Digital, nous sommes spécialisés dans la création de solutions digitales sur mesure, adaptées à vos besoins. Nous concevons des sites web à votre image et des outils performants, conçus pour durer."
            className="ox-about-header"
          />
          <div className="ox-about-features">
            <h3 className="ox-about-features-title">Notre approche technique &amp; engagement</h3>
            {FEATURES.map((f, i) => (
              <div className="ox-about-feature" key={i}>
                <div className="ox-about-feature-head">
                  <span className="ox-about-feature-icon">
                    <i className={`ti ${f.icon}`} />
                  </span>
                  <h4>{f.title}</h4>
                </div>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
