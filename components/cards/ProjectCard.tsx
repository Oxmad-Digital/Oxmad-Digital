import "./ProjectCard.css";

type Kpi = { value?: string; icon?: string; label: string };

type ProjectCardProps = {
  url: string;
  category?: string;
  name: string;
  description?: string;
  kpis?: Kpi[];
  image?: string;
  inProgress?: boolean;
  inRefonte?: boolean;
};

export default function ProjectCard({
  url,
  category,
  name,
  description,
  kpis = [],
  image,
  inProgress = false,
  inRefonte = false,
}: ProjectCardProps) {
  const visitHref = inProgress
    ? "/site-en-developpement"
    : inRefonte
    ? "/site-en-refonte"
    : `https://${url}`;
  const isInternal = inProgress || inRefonte;
  return (
    <div className="ox-project-card">
      <div className="ox-project-card-browserbar">
        <div className="ox-project-card-dots">
          <span style={{ background: "#ff5f57" }} />
          <span style={{ background: "#ffbd2e" }} />
          <span style={{ background: "#28c840" }} />
        </div>
        <div className="ox-project-card-url">
          <i className="ti ti-lock" />
          {url}
        </div>
      </div>

      <div className="ox-project-card-shot">
        {image ? (
          <img src={image} alt={name} className="ox-project-card-shot-img" />
        ) : (
          <div className="ox-project-card-shot-placeholder">{name}</div>
        )}
        <div className="ox-project-card-shot-fade" />
      </div>

      <div className="ox-project-card-body">
        {category && <span className="ox-project-card-category">{category}</span>}
        <div className="ox-project-card-name">{name}</div>
        {description && <div className="ox-project-card-desc">{description}</div>}

        <div className="ox-project-card-footer">
          <div className="ox-project-card-kpis">
            {kpis.map((kpi, i) => (
              <div className="ox-project-card-kpi" key={i}>
                {kpi.icon ? (
                  <span className="ox-project-card-kpi-icon">
                    <i className={`ti ${kpi.icon}`} />
                  </span>
                ) : (
                  <span className="ox-project-card-kpi-value">{kpi.value}</span>
                )}
                <span className="ox-project-card-kpi-label">{kpi.label}</span>
              </div>
            ))}
          </div>
          <a
            href={visitHref}
            target={isInternal ? undefined : "_blank"}
            rel={isInternal ? undefined : "noopener noreferrer"}
            aria-label="Voir le site"
            title="Voir le site"
            className="ox-project-card-visit"
          >
            <i className="ti ti-world" />
          </a>
        </div>
      </div>
    </div>
  );
}
