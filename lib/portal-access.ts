import "server-only";
import { getAdmin } from "./admin-auth";
import { getClientUser } from "./client-auth";

/** Client scope of a download: null for the admin (every client), the client's id otherwise, false when signed out. */
export async function downloadScope() {
  if (await getAdmin()) return null;
  const user = await getClientUser();
  return user ? user.clientId : false;
}
