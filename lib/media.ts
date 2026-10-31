import manifest from "./media-manifest.json";
import config from "./media-config.json";

// Only the public URL reaches the browser. S3 credentials are used by the upload script only.
export const MEDIA_BASE_URL = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || config.publicUrl).replace(/\/$/, "");

export function mediaUrl(source: keyof typeof manifest) {
  // Preserve local previews until the public bucket domain has been configured.
  return MEDIA_BASE_URL ? `${MEDIA_BASE_URL}/${manifest[source].key}` : source;
}

/** URL plus intrinsic size, so next/image can build a srcset without `fill`. */
export function mediaImage(source: keyof typeof manifest) {
  const { width, height } = manifest[source];
  return { src: mediaUrl(source), width, height };
}

export type MediaImage = ReturnType<typeof mediaImage>;

export const HERO_IMAGES = {
  homeDesktop: mediaUrl("/oxmad_chevrons_madagascar_clair_obscur.webp"),
  homeMobile: mediaUrl("/oxmad_chevrons_madagascar_mosaique_mobile.webp"),
  realisations: mediaUrl("/oxmad_realisations_madagascar_clair_obscur.webp"),
  realisationsMobile: mediaUrl("/oxmad_realisations_madagascar_clair_obscur_mobile.webp"),
  clientLogin: mediaUrl("/oxmad_connexion_client_madagascar_clair_obscur.webp"),
  adminLogin: mediaUrl("/oxmad_connexion_admin_madagascar_clair_obscur.webp"),
} as const;

export const SOCIAL_IMAGES = {
  openGraph: mediaUrl("/og-image.jpg"),
} as const;

export const BRAND_IMAGES = {
  symbol: mediaUrl("/oxmad-symbole-transparent.svg"),
  logoDark: mediaUrl("/oxmad-wordmark-sur-fond-sombre.svg"),
} as const;

export const SERVICE_IMAGES = {
  websites: mediaUrl("/oxmad_service_websites.webp"),
  ecommerce: mediaUrl("/oxmad_service_ecommerce.webp"),
  seo: mediaUrl("/oxmad_service_seo.webp"),
  custom: mediaUrl("/oxmad_service_custom.webp"),
} as const;

export const PROJECT_IMAGES = {
  "puce-id": mediaImage("/projects/puce-id.webp"),
  "bitumad-erp": mediaImage("/projects/bitumad-erp.webp"),
  bitumad: mediaImage("/projects/bitumad.webp"),
  ocibel: mediaImage("/projects/ocibel.webp"),
  wybob: mediaImage("/projects/wybob.webp"),
  ultramaille: mediaImage("/projects/ultramaille.webp"),
  "ms-care": mediaImage("/projects/ms-care.webp"),
  "pull-lover": mediaImage("/projects/pull-lover.webp"),
  mahaleo: mediaImage("/projects/mahaleo.webp"),
  tsaralevenana: mediaImage("/projects/tsaralevenana.webp"),
} as const;
