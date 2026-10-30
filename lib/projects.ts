import { PROJECT_IMAGES, type MediaImage } from "./media";

export type ProjectFilter = "Sites vitrines" | "E-commerce" | "Applications";

export type Project = {
  id: string;
  name: string;
  tag: string;
  filter: ProjectFilter;
  /** Shown in the preview window bar. */
  domain: string;
  /** `null` for private tools: no link is shown. */
  url: string | null;
  image: MediaImage | null;
  desc: string;
  /** Explains in the project modal why there is no link. */
  notice?: { label: string; text: string };
  features: string[];
  /** Background and text colours of the mobile preview tile. */
  palette: [string, string];
};

// Feeds the search, filters, pagination and preview of the Réalisations index.
// Projects with `image: null` are shown with a typographic placeholder.
export const PROJECTS: Project[] = [
  {
    id: "bitumad",
    name: "Bitumad",
    tag: "Site vitrine",
    filter: "Sites vitrines",
    domain: "bitumad.mg",
    url: "https://www.bitumad.mg",
    image: PROJECT_IMAGES.bitumad,
    desc: "Le site d’un fournisseur de bitume routier à Madagascar, avec un formulaire de devis qui qualifie chaque demande : type de chantier, grade, quantité et région de livraison.",
    features: ["Site vitrine", "Fiches techniques", "Devis qualifié"],
    palette: ["#646752", "#e8d7ac"],
  },
  {
    id: "ultramaille",
    name: "Ultramaille",
    tag: "Site institutionnel",
    filter: "Sites vitrines",
    domain: "ultramaille.com",
    url: "https://ultramaille.com",
    image: PROJECT_IMAGES.ultramaille,
    desc: "Un univers digital consacré au savoir-faire textile.",
    features: ["Site institutionnel", "Présentation de l’entreprise", "Responsive"],
    palette: ["#aeb5aa", "#f7f2e3"],
  },
  {
    id: "wybob",
    name: "Wybob",
    tag: "E-commerce",
    filter: "E-commerce",
    domain: "wybob.shop",
    url: "https://wybob.shop",
    image: PROJECT_IMAGES.wybob,
    desc: "Une boutique en ligne au service d’une expérience d’achat fluide.",
    features: ["Boutique en ligne", "Catalogue produits", "Responsive"],
    palette: ["#6cadac", "#023b4a"],
  },
  {
    id: "pull-lover",
    name: "Pull-lover",
    tag: "E-commerce",
    filter: "E-commerce",
    domain: "www.pull-lover.com",
    url: "https://www.pull-lover.com",
    image: PROJECT_IMAGES["pull-lover"],
    desc: "Un e-commerce pour une marque de vêtements en maille, avec une approche visuelle et éditoriale.",
    features: ["E-commerce", "Présentation produits", "Responsive"],
    palette: ["#9bafa2", "#f4f0e3"],
  },
  {
    id: "mahaleo",
    name: "Mahaleo",
    tag: "E-commerce",
    filter: "E-commerce",
    domain: "mahaleo.shop",
    url: "https://mahaleo.shop",
    image: PROJECT_IMAGES.mahaleo,
    desc: "Une boutique de vêtements et d’articles pour les fans du groupe Mahaleo.",
    features: ["E-commerce", "Boutique en ligne", "Univers de marque"],
    palette: ["#b84136", "#f5dfba"],
  },
  {
    id: "ocibel",
    name: "Ocibel",
    tag: "Site vitrine",
    filter: "Sites vitrines",
    domain: "www.ocibel.mg",
    url: "https://www.ocibel.mg",
    image: PROJECT_IMAGES.ocibel,
    desc: "Une vitrine digitale à l’univers raffiné pour les soins et la beauté.",
    features: ["Site vitrine", "Présentation prestations", "Prise de contact"],
    palette: ["#ccbbae", "#f7e8df"],
  },
  {
    id: "tsaralevenana",
    name: "Tsaralevenana",
    tag: "Site vitrine",
    filter: "Sites vitrines",
    domain: "tsaralevenana.vercel.app",
    url: "https://tsaralevenana.vercel.app",
    image: PROJECT_IMAGES.tsaralevenana,
    desc: "Un site vitrine sobre et apaisé pour une maison funéraire d’Antananarivo, pensé pour accompagner les familles.",
    features: ["Site vitrine", "Présentation prestations", "Contact 24h/24"],
    palette: ["#a5b5a2", "#fff8e0"],
  },
  {
    id: "ms-care",
    name: "M&S Care",
    tag: "Site catalogue",
    filter: "Sites vitrines",
    domain: "www.mandscare.com",
    url: "https://www.mandscare.com",
    image: PROJECT_IMAGES["ms-care"],
    desc: "Un catalogue clair et rassurant pour une marque de médicaments génériques conçus pour le marché malgache.",
    features: ["Site catalogue", "Médicaments génériques", "Santé"],
    palette: ["#0f8881", "#d3fff8"],
  },
  {
    id: "puce-id",
    name: "Puce ID",
    tag: "Application web",
    filter: "Applications",
    domain: "Bientôt en ligne",
    url: null,
    image: PROJECT_IMAGES["puce-id"],
    desc: "Une application web dédiée au registre des animaux identifiés par puce électronique.",
    notice: {
      label: "En cours de développement",
      text: "Cet outil est encore en construction : il n’y a donc pas de lien pour le moment. Il sera ajouté ici dès sa mise en ligne.",
    },
    features: ["Application web", "Gestion de données"],
    palette: ["#2f4a44", "#d6dcae"],
  },
  {
    id: "bitumad-erp",
    name: "Bitumad Gestion",
    tag: "Application métier",
    filter: "Applications",
    domain: "Accès privé",
    url: null,
    image: PROJECT_IMAGES["bitumad-erp"],
    desc: "Une application métier développée autour des besoins opérationnels de Bitumad.",
    notice: {
      label: "Accès privé",
      text: "Par mesure de sécurité, nous ne partageons pas le lien de cet outil interne : il est réservé aux équipes de Bitumad.",
    },
    features: ["Application web", "Outil métier"],
    palette: ["#33493f", "#d9dcab"],
  },
];

// Shown in the "Projets sélectionnés" section of the home page, in this order.
export const HOME_FEATURED_IDS = ["ms-care", "pull-lover", "bitumad"];
