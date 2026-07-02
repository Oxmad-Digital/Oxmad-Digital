import SectionHeader from "@/components/ui/SectionHeader";
import ServiceCard from "@/components/cards/ServiceCard";
import "./Services.css";

const SERVICES = [
  { number: "01", icon: "ti-layout-2", title: "Site vitrine", desc: "Un site professionnel qui reflète votre image et convertit vos visiteurs en clients qualifiés." },
  { number: "02", icon: "ti-shopping-cart", title: "E-commerce", desc: "Boutique en ligne performante avec paiement sécurisé, gestion des stocks et tunnel de vente optimisé." },
  { number: "03", icon: "ti-search", title: "SEO & Performance", desc: "Positionnement durable sur Google Madagascar et optimisation de la vitesse, du Core Web Vitals et de l'expérience mobile pour maximiser les conversions." },
  { number: "04", icon: "ti-refresh", title: "Refonte & Migration", desc: "Modernisation de votre ancien site sans perdre votre référencement ni vos données clients." },
  { number: "05", icon: "ti-tool", title: "Maintenance", desc: "Suivi mensuel, mises à jour de sécurité, sauvegardes automatiques et rapports de performance." },
  { number: "06", icon: "ti-code", title: "Développement à la demande", desc: "Fonctionnalités sur mesure, intégrations et outils internes développés selon vos besoins spécifiques." },
];

export default function Services() {
  return (
    <section className="ox-services" id="services">
      <SectionHeader
        badge="Services"
        title="Ce que nous proposons."
        subtitle="De la création de sites vitrines au développement e-commerce, nous couvrons tous vos besoins digitaux avec une expertise locale."
        className="ox-services-header"
      />
      <div className="ox-services-grid">
        {SERVICES.map((s) => (
          <ServiceCard
            key={s.number}
            number={s.number}
            icon={<i className={`ti ${s.icon}`} />}
            title={s.title}
            description={s.desc}
          />
        ))}
      </div>
    </section>
  );
}
