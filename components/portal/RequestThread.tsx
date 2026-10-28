import { postRequestMessage } from "@/lib/portal-actions";
import type { FileRow, getRequest } from "@/lib/portal";
import { formatSize, REQUEST_KINDS, REQUEST_STATUSES } from "@/lib/portal-labels";
import { TIMEZONE } from "@/lib/site";
import AttachForm from "./AttachForm";
import FileIcon from "./FileIcon";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: TIMEZONE });

function Attachments({ files }: { files: FileRow[] }) {
  if (files.length === 0) return null;
  return (
    <ul className="adm-attachments">
      {files.map((f) => (
        <li key={f.id}>
          <a href={`/api/portal/files/${f.id}?inline`} target="_blank" rel="noreferrer">
            <FileIcon name={f.name} type={f.content_type} /> {f.name} <span className="adm-muted">{formatSize(Number(f.size))}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** The request, its conversation and the reply form. On the client side, the studio signs as "Oxmad Digital". */
export default function RequestThread({ data, asAdmin }: { data: NonNullable<Awaited<ReturnType<typeof getRequest>>>; asAdmin: boolean }) {
  const { request, messages, files } = data;
  const closed = request.status === "cancelled";
  const studio = (name: string) => (asAdmin ? name : "Oxmad Digital");

  return (
    <>
      <article className="adm-card adm-thread-first">
        <p className="adm-item-meta">
          {request.author_name ?? "Client"} · {dateFormat.format(new Date(request.created_at))}
          {" · "}{REQUEST_KINDS[request.kind].label}
          {request.project_name && <> · {request.project_name}</>}
        </p>
        {request.page_url && (
          <p className="adm-item-meta adm-request-page">
            Page : <a href={request.page_url} target="_blank" rel="noreferrer">{request.page_url}</a>
          </p>
        )}
        {request.expected ? (
          <>
            <p className="adm-request-label">Constat</p>
            <p className="adm-item-body">{request.body}</p>
            <p className="adm-request-label">Souhaité</p>
            <p className="adm-item-body">{request.expected}</p>
          </>
        ) : (
          <p className="adm-item-body">{request.body}</p>
        )}
        <Attachments files={files.filter((f) => !f.message_id)} />
      </article>

      <ol className="adm-thread">
        {messages.map((m) => m.author_kind === "system" ? (
          <li key={m.id} className="adm-thread-event">
            <span>{m.body}</span> <time className="adm-muted" dateTime={new Date(m.created_at).toISOString()}>{dateFormat.format(new Date(m.created_at))}</time>
          </li>
        ) : (
          <li key={m.id} className={`adm-card adm-thread-message${m.author_kind === "admin" ? " is-studio" : ""}`}>
            <p className="adm-item-meta">
              <strong>{m.author_kind === "admin" ? studio(m.author_name) : m.author_name}</strong> · {dateFormat.format(new Date(m.created_at))}
            </p>
            {m.body && <p className="adm-thread-body">{m.body}</p>}
            <Attachments files={files.filter((f) => f.message_id === String(m.id))} />
          </li>
        ))}
      </ol>

      {closed ? (
        <p className="adm-card adm-empty">{REQUEST_STATUSES.cancelled.hint}</p>
      ) : (
        <section className="adm-card">
          <h2>Répondre</h2>
          <AttachForm action={postRequestMessage} clientId={asAdmin ? request.client_id : null} submitLabel="Envoyer">
            {asAdmin && <input type="hidden" name="clientId" value={request.client_id} />}
            <input type="hidden" name="requestId" value={request.id} />
            <label htmlFor="body" className="adm-sr-only">Message</label>
            <textarea id="body" name="body" rows={4} placeholder="Votre message…" maxLength={10000} />
          </AttachForm>
        </section>
      )}
    </>
  );
}
