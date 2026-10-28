import { redirect } from "next/navigation";
import { enrollmentDetails, getPending } from "@/lib/admin-2fa";
import { EnrollForm, VerifyForm } from "./TwoFactorForms";

export default async function VerificationPage() {
  const pending = await getPending();
  if (!pending) redirect("/admin/login");
  const enrollment = pending.totp_enabled ? null : await enrollmentDetails(pending);

  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <p className="adm-brand">OXMAD<span>·</span>DIGITAL</p>
        <h1>{enrollment ? "Activer la double authentification" : "Vérification en deux étapes"}</h1>
        {enrollment ? (
          <>
            <p className="adm-muted">
              Scannez ce QR code avec une application d&apos;authentification (Google Authenticator, Authy, 1Password…), puis saisissez le code à 6 chiffres affiché.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={enrollment.qr} alt="QR code à scanner avec l'application d'authentification" width={220} height={220} style={{ display: "block", margin: "14px auto", background: "#fff", borderRadius: 8 }} />
            <p className="adm-muted" style={{ textAlign: "center", wordBreak: "break-all" }}>Ou saisissez cette clé : <code>{enrollment.key}</code></p>
            <EnrollForm />
          </>
        ) : (
          <>
            <p className="adm-muted">Saisissez le code à 6 chiffres de votre application, ou un code de secours.</p>
            <VerifyForm />
          </>
        )}
        <p className="adm-login-alt"><a href="/admin/login">Retour à la connexion</a></p>
      </div>
    </div>
  );
}
