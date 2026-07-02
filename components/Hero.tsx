import LogosBand from "./LogosBand";
import "./hero.css";

export default function Hero() {
  return (
    <section className="ox-hero">
      <div className="ox-hero-inner">
        <div className="ox-hero-x">
          <svg viewBox="0 0 374 313" preserveAspectRatio="xMidYMid meet">
            <polygon
              fill="var(--r)"
              points="271,5 340,5 236,133 351,265 282,265 201,175 87,312 18,312 131,173 22,48 90,48 166,130"
            />
          </svg>
        </div>
        <div className="ox-hero-blob ox-hero-blob-a" />
        <div className="ox-hero-blob ox-hero-blob-b" />
        <div className="ox-hero-grid" />

        <div className="ox-hero-left">
          <h1 className="ox-hero-title">
            Votre présence
            <br />
            digitale,
            <br />
            <span className="ox-hero-title-accent">enfin au niveau.</span>
          </h1>
          <p className="ox-hero-subtitle">
            Sites vitrines, e-commerce et SEO conçus pour évoluer avec votre business. Modernes,
            performants et durables.
          </p>
        </div>

        <div className="ox-hero-right">
          <div className="ox-hero-glow" />
          <div className="ox-hero-orbit">
            <span className="ox-hero-orbit-dot" />
          </div>
          <div className="ox-hero-robot">
            <div className="ox-hero-bubble">Hey, bienvenue sur notre site</div>
            <img src="/robot-oxmad.svg" alt="Mascotte Oxmad Digital" />
          </div>
        </div>
      </div>

      <LogosBand />
    </section>
  );
}
