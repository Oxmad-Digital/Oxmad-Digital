import "./Tag.css";

export default function Tag({ children }: { children: React.ReactNode }) {
  return <span className="ox-tag">{children}</span>;
}
