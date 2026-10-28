import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { downloadScope } from "@/lib/portal-access";
import { downloadUrl } from "@/lib/r2";

/** Redirects to a short-lived signed URL of a drive file or attachment. `?inline` opens it in the browser. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/portal/files/[id]">) {
  const { id } = await ctx.params;
  const scope = await downloadScope();
  const sql = db();
  if (scope === false || !sql) return new Response("Non autorisé", { status: 401 });
  if (!/^\d+$/.test(id)) return new Response("Introuvable", { status: 404 });

  const [file] = await sql`SELECT key, name FROM client_files WHERE id = ${id} AND (${scope}::bigint IS NULL OR client_id = ${scope})`;
  if (!file) return new Response("Introuvable", { status: 404 });
  return Response.redirect(downloadUrl(file.key, file.name, request.nextUrl.searchParams.has("inline")), 302);
}
