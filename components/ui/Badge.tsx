import "./Badge.css";

type BadgeProps = {
  children: React.ReactNode;
  icon?: React.ReactNode;
  dot?: boolean;
  className?: string;
};

export default function Badge({ children, icon, dot = false, className = "" }: BadgeProps) {
  return (
    <div className={`ox-badge ${className}`.trim()}>
      {dot && <span className="ox-badge-dot">✦</span>}
      {icon && <span className="ox-badge-icon">{icon}</span>}
      {children}
    </div>
  );
}
