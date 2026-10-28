import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getMessages } from "@/lib/admin-stats";
import { TIMEZONE } from "@/lib/site";
import { deleteMessage, setMessageStatus } from "../../actions";
import DeleteButton from "../DeleteButton";

const FILTERS = [
  { value: "all", label: "Boîte de réception" },
  { value: "new", label: "Non lus" },
  { value: "archived", label: "Archivés" },
] as const;

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: TIMEZONE });

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  await requireAdmin();
  const requested = (await searchParams).f;
  const filter = FILTERS.find((f) => f.value === requested)?.value ?? "all";
  const messages = await getMessages(filter);

  return (
    <>
      <div className="adm-title-row">
        <h1>Messages</h1>
        <div className="adm-segmented" role="group" aria-label="Filtre">
          {FILTERS.map((f) => (
            <Link key={f.value} href={`/admin/messages?f=${f.value}`} aria-current={f.value === filter ? "true" : undefined}>{f.label}</Link>
          ))}
        </div>
      </div>

      {messages.length === 0 && <p className="adm-card adm-empty">Aucun message ici.</p>}

      <ul className="adm-list">
        {messages.map((m) => (
          <li key={m.id} className={`adm-card adm-item ${m.status === "new" ? "is-new" : ""}`}>
            <div className="adm-item-head">
              <div>
                <p className="adm-item-title">
                  {m.status === "new" && <span className="adm-pill adm-pill-accent">Nouveau</span>}
                  {m.name}
                </p>
                <p className="adm-item-meta">
                  <a href={`mailto:${m.email}`}>{m.email}</a>
                  {m.phone && <> · <a href={`tel:${m.phone}`}>{m.phone}</a></>}
                </p>
              </div>
              <time className="adm-muted" dateTime={new Date(m.created_at).toISOString()}>{dateFormat.format(new Date(m.created_at))}</time>
            </div>
            <p className="adm-item-body">{m.message}</p>
            <div className="adm-item-actions">
              <a className="adm-btn adm-btn-primary" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: votre message — Oxmad Digital")}`}>Répondre</a>
              {m.status !== "read" && (
                <form action={setMessageStatus}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="adm-btn" name="status" value="read">{m.status === "new" ? "Marquer comme lu" : "Désarchiver"}</button>
                </form>
              )}
              {m.status === "read" && (
                <form action={setMessageStatus}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="adm-btn" name="status" value="new">Marquer non lu</button>
                </form>
              )}
              {m.status !== "archived" && (
                <form action={setMessageStatus}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="adm-btn" name="status" value="archived">Archiver</button>
                </form>
              )}
              <DeleteButton action={deleteMessage} id={m.id} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
