import Link from "next/link";
import "./Cta.css";

export default function Cta() {
  return (
    <section className="cta" id="contact">
      <div className="cta-inner">
        <div className="txt-container">
          <h2>Besoin de plus d&apos;informations ?</h2>
          <p>Notre équipe se tient à disposition pour répondre à toutes vos questions.</p>
        </div>
        <Link href="/contact" className="btn-gold">Contactez-nous !</Link>
      </div>
    </section>
  );
}
