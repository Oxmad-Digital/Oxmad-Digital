"use client";

import { useLanguage } from "./Language/LanguageContext";
import "./LogosBand.css";

const LOGOS: { name: string; logo: string; darkLogo?: string }[] = [
  {
    name: "Ocibel MG",
    logo: "https://res.cloudinary.com/eee2cbey/image/upload/v1783618534/oxmad-digital_ocibel_logo_bandeau_chhsxt.webp",
  },
  {
    name: "Bitumad",
    logo: "https://res.cloudinary.com/eee2cbey/image/upload/v1783609937/oxmad-digital_logo_bitumad_bandeau_xkzqep.webp",
  },
  {
    name: "M&S Care",
    logo: "https://res.cloudinary.com/eee2cbey/image/upload/v1783620463/oxmad-digital_m_s-care_logo_bandeau_iwjgrj.webp",
  },
  {
    name: "Tsaralevenana",
    logo: "https://res.cloudinary.com/eee2cbey/image/upload/v1783620313/logo_tsaralevenana_czjash.webp",
  },
  {
    name: "Thadeus",
    logo: "https://res.cloudinary.com/eee2cbey/image/upload/v1783696516/Thadeus_logo_fond-blanc_tgayua.webp",
  },
  {
    name: "Lake View Hotel",
    logo: "https://res.cloudinary.com/eee2cbey/image/upload/v1783696817/oxmad-digital_logo_lake_view_hotel_bandeau_a2z2oy.webp",
  },
  {
    name: "Wybob",
    logo: "https://res.cloudinary.com/eee2cbey/image/upload/v1783697019/oxmad-digital_logo_wybob_bandeau_udit0y.webp",
    darkLogo: "https://res.cloudinary.com/eee2cbey/image/upload/v1783699217/oxmad-digital_logo_wybob_bandeau_dark-mode_pjqvl8.webp",
  },
];

const LABEL = {
  fr: "Ils nous font confiance",
  en: "Trusted by",
};

export default function LogosBand() {
  const { lang } = useLanguage();
  const items = [...LOGOS, ...LOGOS];
  return (
    <div className="ox-logos-band">
      <span className="ox-logos-band-label">{LABEL[lang]}</span>
      <div className="ox-logos-band-divider" />
      <div className="ox-logos-wrap">
        <div className="ox-logos-scroll">
          {items.map((l, i) => (
            <div key={i} className="ox-logo-chip" title={l.name}>
              {l.darkLogo ? (
                <>
                  <img className="ox-logo-chip-img ox-logo-light" src={l.logo} alt={l.name} />
                  <img className="ox-logo-chip-img ox-logo-dark" src={l.darkLogo} alt={l.name} />
                </>
              ) : (
                <img className="ox-logo-chip-img" src={l.logo} alt={l.name} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
