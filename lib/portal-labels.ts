// Labels and limits of the client area, shared by server and client components (no server imports).

export type Tone = "accent" | "good" | "bad" | "";

export const REQUEST_KINDS = {
  fix: { label: "Correction", hint: "Quelque chose ne fonctionne pas ou s'affiche mal." },
  improvement: { label: "Amélioration", hint: "Modifier un texte, une image, un style ou un comportement existant." },
  small_feature: { label: "Mini-fonctionnalité", hint: "Un petit ajout sur une page existante : un bouton, un lien, un champ…" },
  other: { label: "Autre", hint: "Une question, ou une demande qui ne rentre pas dans ces cases." },
} as const;
export type RequestKind = keyof typeof REQUEST_KINDS;

export const REQUEST_STATUSES = {
  new: { label: "Nouvelle", tone: "accent", hint: "Reçue, en attente d'analyse." },
  planned: { label: "Incluse — planifiée", tone: "", hint: "Couverte par la maintenance, elle sera traitée prochainement." },
  in_progress: { label: "En cours", tone: "accent", hint: "En cours de réalisation." },
  done: { label: "Livrée", tone: "good", hint: "La modification est en ligne." },
  out_of_scope: { label: "Hors maintenance", tone: "bad", hint: "Dépasse le périmètre de la maintenance : un devis vous sera proposé." },
  cancelled: { label: "Annulée", tone: "", hint: "Demande annulée." },
} as const satisfies Record<string, { label: string; tone: Tone; hint: string }>;
export type RequestStatus = keyof typeof REQUEST_STATUSES;
export const OPEN_REQUEST_STATUSES: RequestStatus[] = ["new", "planned", "in_progress"];

/** What the maintenance contract covers, shown when creating a request. */
export const MAINTENANCE_SCOPE = {
  included: [
    "Corrections de bugs et d'affichage",
    "Modifications de textes, images, couleurs, mise en page",
    "Améliorations de l'existant (performance, ergonomie, SEO)",
    "Mini-fonctionnalités sur une page existante",
  ],
  excluded: [
    "Nouvelle page ou nouvelle section",
    "Fonctionnalité majeure (paiement, espace membre, réservation…)",
    "Refonte graphique",
  ],
};

export const DOCUMENT_KINDS = { quote: "Devis", invoice: "Facture" } as const;
export type DocumentKind = keyof typeof DOCUMENT_KINDS;

export const DOCUMENT_STATUSES = {
  pending: { label: "En attente", tone: "accent", kind: "quote" },
  accepted: { label: "Accepté", tone: "good", kind: "quote" },
  declined: { label: "Refusé", tone: "", kind: "quote" },
  unpaid: { label: "À régler", tone: "accent", kind: "invoice" },
  paid: { label: "Payée", tone: "good", kind: "invoice" },
  cancelled: { label: "Annulée", tone: "", kind: "invoice" },
} as const satisfies Record<string, { label: string; tone: Tone; kind: DocumentKind }>;
export type DocumentStatus = keyof typeof DOCUMENT_STATUSES;

export const CURRENCIES = ["EUR", "MGA"] as const;

export const MAX_FILE_SIZE = 250 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 20;

/** Programs and web pages that run when opened: not accepted as uploads (zip them if they must be shared). */
const BLOCKED_EXTENSIONS = new Set([
  "html", "htm", "xhtml", "shtml", "svg", "svgz", "xml", "js", "mjs", "cjs", "jsx", "php", "phtml", "asp", "aspx", "jsp", "cgi", "pl", "py", "rb",
  "exe", "msi", "dll", "scr", "com", "bat", "cmd", "ps1", "vbs", "vbe", "wsf", "sh", "bash", "jar", "apk", "app", "dmg", "pkg", "deb", "rpm", "lnk", "hta", "reg",
]);

export const extensionOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";
export const isAllowedFileName = (name: string) => !BLOCKED_EXTENSIONS.has(extensionOf(name));

export function pillClass(tone: Tone) {
  return `adm-pill${tone ? ` adm-pill-${tone}` : ""}`;
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} Ko`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1).replace(".", ",")} Mo`;
  return `${(bytes / 1024 ** 3).toFixed(2).replace(".", ",")} Go`;
}

export function formatAmount(amount: string | number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "MGA" ? 0 : 2,
  }).format(Number(amount));
}
