import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return new NextResponse(`<p>Autorisation refusée : ${error}</p>`, {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!code) {
    return NextResponse.json({ error: "Code manquant." }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: "Configuration Google OAuth manquante." }, { status: 500 });
  }

  const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  try {
    const { tokens } = await client.getToken(code);

    const body = tokens.refresh_token
      ? `
        <h2>Connexion Google Calendar réussie ✅</h2>
        <p>Copie cette valeur dans <code>.env.local</code> sous <code>GOOGLE_REFRESH_TOKEN</code>, redémarre le serveur, puis supprime ces deux routes (<code>app/api/google/connect</code> et <code>app/api/google/callback</code>) :</p>
        <pre style="background:#eee;padding:16px;border-radius:8px;word-break:break-all;max-width:640px;">${tokens.refresh_token}</pre>
      `
      : `
        <h2>Aucun refresh token reçu</h2>
        <p>Google ne renvoie un refresh_token que lors du premier consentement. Révoque l'accès existant sur
        <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">myaccount.google.com/permissions</a>
        puis relance <code>/api/google/connect</code>.</p>
      `;

    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;line-height:1.6;">${body}</body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.json({ error: "Échec de l'échange du code d'autorisation." }, { status: 500 });
  }
}
