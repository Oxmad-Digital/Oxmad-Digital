import "./ServiceCard.css";

type ServiceCardProps = {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
};

export default function ServiceCard({ number, icon, title, description }: ServiceCardProps) {
  return (
    <div className="ox-service-card">
      <div className="ox-service-card-number">{number}</div>
      <div className="ox-service-card-icon">{icon}</div>
      <h3 className="ox-service-card-title">{title}</h3>
      <p className="ox-service-card-desc">{description}</p>
      <div className="ox-service-card-arrow">→</div>
    </div>
  );
}
