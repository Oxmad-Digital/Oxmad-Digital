import SectionHeader from "@/components/ui/SectionHeader";
import "./Process.css";

const PROCESS = [
  { label: "Analyse", desc: "Audit de votre présence actuelle, étude de vos concurrents et définition des objectifs mesurables.", icon: "ti-zoom-scan" },
  { label: "Design", desc: "Maquettes haute fidélité validées avec vous avant tout développement — zéro surprise.", icon: "ti-pencil" },
  { label: "Développement", desc: "Code propre, rapide et scalable. Tests sur tous les appareils avant livraison.", icon: "ti-code" },
  { label: "Optimisation SEO & performance", desc: "Référencement, vitesse de chargement et Core Web Vitals optimisés pour un site visible et rapide.", icon: "ti-brand-speedtest" },
  { label: "Lancement", desc: "Mise en ligne, formation, et suivi post-lancement pour s'assurer que tout fonctionne parfaitement.", icon: "ti-rocket" },
];

export default function Process() {
  return (
    <section className="ox-process">
      <div className="ox-process-glow" />
      <div className="ox-process-header">
        <SectionHeader
          badge="Processus"
          title="Comment nous"
          highlight="travaillons."
          subtitle="Une méthode claire en cinq étapes, de la première analyse jusqu'au lancement — pour avancer ensemble, sans surprise."
          align="center"
          className="ox-process-section-header"
        />
      </div>

      <div className="ox-process-timeline">
        <div className="ox-process-line" />
        {PROCESS.map((s, i) => {
          const dir = i % 2 === 0 ? "up" : "down";
          return (
            <div className="ox-process-node-wrap" key={i}>
              <div className={`ox-process-bubble ox-process-bubble-${dir}`}>
                <div className="ox-process-bubble-title">{s.label}</div>
                <p>{s.desc}</p>
                <span className="ox-process-bubble-tail" />
              </div>
              <div className="ox-process-node">
                <i className={`ti ${s.icon}`} />
                <span className="ox-process-node-index">{i + 1}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
