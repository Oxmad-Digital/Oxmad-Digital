import { neon } from "@neondatabase/serverless";
import { seedDefaultDriveFolders } from "../lib/drive-folders.ts";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const count = await seedDefaultDriveFolders(neon(process.env.DATABASE_URL));
console.log(`${count} dossier(s) par défaut ajouté(s).`);
