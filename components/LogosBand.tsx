import "./LogosBand.css";

const LOGOS = [
  "Ocibel MG",
  "Bitumad",
  "AgriMada",
  "TechStart",
  "MG Commerce",
  "Mada Services",
];

export default function LogosBand() {
  const items = [...LOGOS, ...LOGOS];
  return (
    <div className="ox-logos-band">
      <span className="ox-logos-band-label">Ils nous font confiance</span>
      <div className="ox-logos-band-divider" />
      <div className="ox-logos-wrap">
        <div className="ox-logos-scroll">
          {items.map((l, i) => (
            <div key={i} className="ox-logo-chip" title={l}>
              <span className="ox-logo-chip-mk">{l.charAt(0)}</span>
              <span className="ox-logo-chip-wm">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
