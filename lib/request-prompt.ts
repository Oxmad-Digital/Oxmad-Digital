import "server-only";
import type { getRequest } from "./portal";
import { REQUEST_KINDS, REQUEST_STATUSES, type RequestKind } from "./portal-labels";
import { appUrl, TIMEZONE } from "./site";

// A client request rewritten as a Markdown prompt for a coding agent (Claude Code), opened in the client's repo.

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: TIMEZONE });

const APPROACH: Record<RequestKind, string> = {
  fix: "C'est une correction : reproduis ou localise le problème, identifie sa cause, puis corrige-la à la source plutôt que d'en masquer le symptôme.",
  improvement: "C'est une amélioration de l'existant : modifie l'élément visé en gardant le style, la structure et le comportement du reste du site.",
  small_feature: "C'est une mini-fonctionnalité sur une page existante : réutilise les composants et styles déjà présents avant d'en créer de nouveaux.",
  other: "La demande n'entre pas dans une catégorie précise : commence par reformuler ce que tu comprends qu'il faut faire.",
};

export function requestPrompt({ request, messages, files }: NonNullable<Awaited<ReturnType<typeof getRequest>>>) {
  const quote = (text: string) => text.trim().split("\n").map((line) => `> ${line}`).join("\n");
  const exchanges = messages.filter((m) => m.author_kind !== "system" && m.body.trim());
  const project = request.project_name ? `${request.project_name}${request.project_url ? ` (${request.project_url})` : ""}` : null;

  const sections = [
    `# Demande client : ${request.title}`,
    [
      "## Contexte",
      `- Client : ${request.client_name}`,
      project && `- Site : ${project}`,
      `- Type : ${REQUEST_KINDS[request.kind].label}${request.urgent ? " (urgent)" : ""}`,
      `- Reçue le ${dateFormat.format(new Date(request.created_at))}, statut : ${REQUEST_STATUSES[request.status].label}`,
      request.page_url && `- Page concernée : ${request.page_url}`,
    ],
    ["## Constat du client", quote(request.body)],
    request.expected && ["## Résultat souhaité", quote(request.expected)],
    exchanges.length > 0 && [
      "## Précisions échangées depuis (les plus récentes priment)",
      ...exchanges.map((m) => `**${m.author_kind === "admin" ? "Oxmad Digital" : m.author_name}**, ${dateFormat.format(new Date(m.created_at))} :\n${quote(m.body)}`),
    ],
    files.length > 0 && [
      "## Pièces jointes",
      "Fournies par le client ; les captures pertinentes sont jointes à ce message.",
      ...files.map((f) => `- ${f.name}`),
    ],
    [
      "## Consignes",
      `- ${APPROACH[request.kind]}`,
      "- Applique uniquement cette demande : ne modifie, ne reformate et ne « améliore » rien d'autre.",
      "- Les textes à afficher sont à reprendre mot pour mot depuis la demande, sans les reformuler.",
      "- Si la demande est ambiguë, contradictoire, ou dépasse une modification ciblée (nouvelle page, refonte, fonctionnalité majeure), arrête-toi et pose-moi la question avant de coder.",
      "- Respecte les conventions du projet (structure, nommage, styles) et vérifie que le build et le lint passent.",
      "- Ne commite pas et ne déploie pas.",
      "- Termine par : les fichiers modifiés, ce qui a changé, comment le vérifier, et un court message que je peux transmettre au client.",
    ],
    `Fil de la demande : ${appUrl(`/admin/demandes/${request.id}`)}`,
  ];

  return sections
    .filter(Boolean)
    .map((s) => (Array.isArray(s) ? s.filter(Boolean).join("\n") : s))
    .join("\n\n");
}
