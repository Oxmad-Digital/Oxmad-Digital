import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { downloadScope } from "@/lib/portal-access";
import { downloadUrl } from "@/lib/r2";

/** Redirects to a short-lived signed URL of a quote or invoice PDF, opened in the browser unless `?download`. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/portal/documents/[id]">) {
  const { id } = await ctx.params;
  const scope = await downloadScope();
  const sql = db();
  if (scope === false || !sql) return new Response("Non autorisé", { status: 401 });
  if (!/^\d+$/.test(id)) return new Response("Introuvable", { status: 404 });

  const [doc] = await sql`SELECT file_key, file_name FROM client_documents WHERE id = ${id} AND (${scope}::bigint IS NULL OR client_id = ${scope})`;
  if (!doc) return new Response("Introuvable", { status: 404 });
  return Response.redirect(downloadUrl(doc.file_key, doc.file_name, !request.nextUrl.searchParams.has("download")), 302);
}
