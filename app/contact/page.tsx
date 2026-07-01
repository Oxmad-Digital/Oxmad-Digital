"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import "./contact.css";

const team = [
  { name: "Antoine Ponthieu", role: "Juriste", photo: "/juryD.png", linkedin: "https://linkedin.com" },
  { name: "Antoine Ponthieu", role: "Juriste", photo: "/juryh.png", linkedin: "https://linkedin.com" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ nom: "", telephone: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setSent(true);
      else alert("Erreur lors de l'envoi, réessayez.");
    } catch {
      alert("Erreur serveur.");
    }
  };

  return (
    <>
      {/* ── HERO ── */}
     <Hero small={true} />

      {/* ── SECTION ÉQUIPE ── */}
      <section className="team-section">
  <div className="team-inner">
    <div className="team-title-container">
  <div className="team-heading-wrapper">
    <p className="section-label-gold">Nos membres</p>
    <h2 className="team-title">Découvrez les membres de l&apos;équipe</h2>
  </div>
  <div className="team-subtitle-wrapper">
    <p className="team-subtitle">
      Des spécialistes passionnés, unis par une mission commune : protéger vos intérêts et libérer votre potentiel.
    </p>
  </div>
</div>
    <div className="team-grid">
      {team.map((member, i) => (
        <div className="team-card" key={i}>
          <div className="team-photo-wrapper">
            <img src={member.photo} alt={member.name} className="team-photo"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x400/1a2744/ffffff?text=" + member.name.split(" ")[0]; }}
            />
          </div>
          <div className="team-card-footer">
            <p className="team-name">{member.name}</p>
            <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="team-linkedin">in</a>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* ── SECTION FORMULAIRE ── */}
      <section className="contact-section">
        <div className="contact-inner">
         <div className="contact-left">
  <p className="section-label-gold">Contact</p>
  <h2 className="contact-title">Restons en contact !</h2>
  <p className="contact-desc">
    Vous avez envie de vous lancer mais vous avez encore des questions ? 
    Remplissez le formulaire et nous reviendrons vers vous dans les meilleurs délais.
  </p>
</div>
          <div className="contact-form-wrapper">
            {sent ? (
              <div className="contact-success"><p>✅ Message envoyé ! Nous vous répondrons bientôt.</p></div>
            ) : (
              <div className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nom</label>
                    <input type="text" name="nom" placeholder="Thadeus Externalia" value={form.nom} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Numéro de téléphone</label>
                    <input type="tel" name="telephone" placeholder="+261 32 17 575 66" value={form.telephone} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Adresse mail</label>
                  <input type="email" name="email" placeholder="thadeus@jurisexternalia.com" value={form.email} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea name="message" placeholder="Écrivez votre message ici..." rows={5} value={form.message} onChange={handleChange} />
                </div>
                <button className="form-submit" onClick={handleSubmit}>Envoyer</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SECTION CARTE ── */}
      <section className="map-section">
        <div className="map-wrapper">
         <iframe
  title="Localisation cabinet"
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3784!2d47.4211471!3d-18.7960779!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTjCsDQ3JzQ1LjkiUyA0N8KwMjUnMjUuNCJF!5e0!3m2!1sfr!2smg!4v1700000000000"
  width="100%"
  height="100%"
  style={{ border: 0 }}
  allowFullScreen
  loading="lazy"
  referrerPolicy="no-referrer-when-downgrade"
/>
        </div>
      </section>
    </>
  );
}
