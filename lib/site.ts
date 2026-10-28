/** Canonical origin, shared by the metadata and the sitemap. */
export const SITE_URL = "https://www.oxmad-digital.mg";

/** Shared Open Graph fields: a page that sets `openGraph` replaces the layout's object, so it spreads these. */
export const OPEN_GRAPH = {
  type: "website",
  locale: "fr_MG",
  siteName: "Oxmad Digital",
  images: { url: "/og-image.jpg", width: 1200, height: 630, alt: "Oxmad Digital, agence web à Antananarivo, Madagascar" },
} as const;

export const CONTACT_EMAIL = "contact@oxmad-digital.mg";

/** Same details as the legal notice and the Google Business Profile: keep the three in sync. */
export const CONTACT_PHONE = "+261 38 82 329 33";
/** Shown in the footer and listed as `sameAs` in the JSON-LD of the site layout. */
export const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61581233799197" },
  { label: "Instagram", href: "https://www.instagram.com/oxmad.digital/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/oxmad-digital/" },
];

export const ADDRESS = {
  street: "Immeuble Ampefiloha Aro, 1er étage, Escalier B, Porte B104",
  locality: "Antananarivo",
  postalCode: "101",
  country: "MG",
};

export const TIMEZONE = "Indian/Antananarivo";
export const TZ_OFFSET = "+03:00";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sign-in entry point of the header and footer: the client area, which links to the admin sign-in. */
export const LOGIN_URL = "/espace-client/connexion";

/** Absolute URL for emailed links. Never derived from the request's Host header, which a sender can forge. */
export function appUrl(path: string) {
  const origin = process.env.APP_URL || (process.env.NODE_ENV === "production" ? SITE_URL : "http://localhost:3000");
  return `${origin.replace(/\/$/, "")}${path}`;
}
