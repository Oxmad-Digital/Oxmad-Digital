import Link from "next/link";
import VerifyForm from "./VerifyForm";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <Link href="/" className="adm-brand">OXMAD<span>·</span>DIGITAL</Link>
        <h1>Espace client</h1>
        {token ? <VerifyForm token={token} /> : <p className="adm-error">Lien incomplet. <Link href="/espace-client/connexion">Demander un nouveau lien</Link></p>}
      </div>
    </div>
  );
}
