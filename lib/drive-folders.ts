import type { NeonQueryFunction } from "@neondatabase/serverless";

export const DEFAULT_DRIVE_FOLDERS = [
  { key: "logos", name: "Logos", description: "Identité et déclinaisons" },
  { key: "documents", name: "Documents", description: "Textes et fichiers de travail" },
  { key: "images", name: "Images", description: "Photos et visuels" },
  { key: "icones", name: "Icônes", description: "Pictogrammes et symboles" },
  { key: "illustrations", name: "Illustrations", description: "Dessins et créations graphiques" },
] as const;

export function getDefaultDriveFolder(name: string) {
  const normalized = name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return DEFAULT_DRIVE_FOLDERS.find((folder) => folder.key === normalized);
}

/** The client and its initial folders are created atomically, including from the support script. */
export async function createClientWithDrive(sql: NeonQueryFunction<false, false>, name: string, notes: string | null) {
  const [client] = await sql`WITH created AS (
      INSERT INTO clients (name, notes) VALUES (${name}, ${notes}) RETURNING id
    ), folders AS (
      INSERT INTO drive_folders (client_id, name)
      SELECT created.id, defaults.name FROM created
      CROSS JOIN unnest(${DEFAULT_DRIVE_FOLDERS.map((folder) => folder.name)}::text[]) AS defaults(name)
    ) SELECT id FROM created`;
  return String(client.id);
}

/** Backfill only missing root folders; existing names, contents and subfolders are preserved. */
export async function seedDefaultDriveFolders(sql: NeonQueryFunction<false, false>) {
  const results = await sql.transaction([
    sql`LOCK TABLE drive_folders IN SHARE ROW EXCLUSIVE MODE`,
    sql`INSERT INTO drive_folders (client_id, name)
      SELECT c.id, defaults.name FROM clients c
      CROSS JOIN unnest(${DEFAULT_DRIVE_FOLDERS.map((folder) => folder.name)}::text[]) AS defaults(name)
      WHERE NOT EXISTS (
        SELECT 1 FROM drive_folders f WHERE f.client_id = c.id AND f.parent_id IS NULL
          AND translate(lower(trim(f.name)), 'ô', 'o') = translate(lower(defaults.name), 'ô', 'o')
      ) RETURNING id`,
  ]);
  return results[1].length;
}
