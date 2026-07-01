"use client";
import Link from "next/link";
import "./hero.css";

export default function Hero({ small = false }: { small?: boolean }) {
  return (
    <section className="hero">
      <div className={`hero-inner ${small ? 'hero-small' : ''}`}>
        <div className="hero-title-container">
          <h1 className="hero-title">
            Thadeus Externalia Juris
          </h1>
        </div>
        <div className="hero-subtitle-container">
        <p className="hero-subtitle">
         Externalisation Juridique, Sociale et Fiscale (BPO)
        </p>
        </div>
      </div>
    </section>
  );
}