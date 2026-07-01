import "./SectionHeader.css";

type SectionHeaderProps = {
  badge?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
};

export default function SectionHeader({
  badge,
  title,
  highlight,
  subtitle,
  align = "left",
  className = "",
}: SectionHeaderProps) {
  const center = align === "center";
  return (
    <div className={`ox-section-header ${center ? "ox-section-header-center" : ""} ${className}`.trim()}>
      {badge && <div className="ox-section-header-badge">{badge}</div>}
      <h2 className="ox-section-header-title">
        {title}
        {highlight && <span className="ox-section-header-highlight"> {highlight}</span>}
      </h2>
      {subtitle && <p className="ox-section-header-subtitle">{subtitle}</p>}
    </div>
  );
}
