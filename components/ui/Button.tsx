import Link from "next/link";
import "./Button.css";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost" | "filter" | "filter-active";
  size?: "sm" | "md" | "lg";
  href?: string;
  onClick?: () => void;
  arrow?: boolean;
  className?: string;
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  arrow = false,
  className = "",
}: ButtonProps) {
  const classes = `ox-btn ox-btn-${variant} ox-btn-${size} ${className}`.trim();
  const arrowEl = arrow ? (
    <span className="ox-btn-arrow">
      <i className="ti ti-chevron-right" />
    </span>
  ) : null;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
        {arrowEl}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} onClick={onClick}>
      {children}
      {arrowEl}
    </button>
  );
}
