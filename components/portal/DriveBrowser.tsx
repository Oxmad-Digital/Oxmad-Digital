import Link from "next/link";
import { ChevronRight, Download, FileText, Folder, Image, PenTool, Shapes, Stamp } from "lucide-react";
import { getDefaultDriveFolder } from "@/lib/drive-folders";
import { deleteDriveFile, deleteDriveFolder } from "@/lib/portal-actions";
import { getDrive } from "@/lib/portal";
import { formatSize } from "@/lib/portal-labels";
import { TIMEZONE } from "@/lib/site";
import ConfirmButton from "./ConfirmButton";
import DriveUpload from "./DriveUpload";
import FileIcon from "./FileIcon";
import NewFolderForm from "./NewFolderForm";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: TIMEZONE });
const folderIcons = { logos: Stamp, documents: FileText, images: Image, icones: Shapes, illustrations: PenTool };

/**
 * Drive of a client, for the client itself (`asAdmin` false) or the admin. `basePath` is the page
 * the folder links point to, with the folder id as `?dossier=`.
 */
export default async function DriveBrowser({ clientId, folderId, basePath, asAdmin }: {
  clientId: string;
  folderId: string | null;
  basePath: string;
  asAdmin: boolean;
}) {
  const drive = await getDrive(clientId, folderId);
  if (!drive) return <p className="adm-card adm-empty">Ce dossier n&apos;existe pas ou a été supprimé. <Link href={basePath}>Retour au drive</Link></p>;

  const scope = asAdmin ? clientId : null;
  const href = (id: string | null) => (id ? `${basePath}?dossier=${id}` : basePath);
  const empty = drive.folders.length === 0 && drive.files.length === 0;

  return (
    <>
      <nav className="adm-crumbs" aria-label="Emplacement">
        <Link href={href(null)} aria-current={folderId === null ? "page" : undefined}>Drive</Link>
        {drive.trail.map((f) => (
          <span key={f.id}>
            <ChevronRight size={14} aria-hidden="true" />
            <Link href={href(String(f.id))} aria-current={String(f.id) === folderId ? "page" : undefined}>{f.name}</Link>
          </span>
        ))}
      </nav>

      <div className="adm-drive-tools">
        <DriveUpload clientId={scope} folderId={folderId} />
        <NewFolderForm clientId={scope} parentId={folderId} />
      </div>

      {empty && <p className="adm-card adm-empty">Ce dossier est vide.</p>}

      {drive.folders.length > 0 && (
        <section className="adm-drive-section" aria-labelledby="drive-folders-heading">
          <div className="adm-section-head">
            <h2 id="drive-folders-heading">Dossiers</h2>
            <span className="adm-muted">{drive.folders.length} dossier{drive.folders.length > 1 ? "s" : ""}</span>
          </div>
          <ul className="adm-folders">
            {drive.folders.map((f) => {
              const category = getDefaultDriveFolder(f.name);
              const Icon = category ? folderIcons[category.key] : Folder;
              return (
                <li key={f.id} className="adm-folder-card">
                  <Link href={href(String(f.id))} className="adm-folder-link">
                    <span className="adm-folder-top">
                      <span className="adm-folder-icon"><Icon size={28} strokeWidth={1.5} aria-hidden="true" /></span>
                      <ChevronRight size={18} className="adm-folder-arrow" aria-hidden="true" />
                    </span>
                    <span className="adm-folder-name">{f.name}</span>
                    <span className="adm-folder-description">{category?.description ?? "Fichiers et sous-dossiers partagés"}</span>
                  </Link>
                  <div className="adm-folder-footer">
                    <span className="adm-muted">{f.items ? `${f.items} élément${f.items > 1 ? "s" : ""}` : "Dossier vide"}</span>
                    {(asAdmin || !f.items) && (
                      <ConfirmButton
                        action={deleteDriveFolder}
                        fields={{ id: String(f.id), clientId: scope }}
                        className="adm-btn adm-btn-danger adm-folder-delete"
                        message={f.items ? `Supprimer « ${f.name} » et tout son contenu ? Cette action est irréversible.` : `Supprimer le dossier « ${f.name} » ?`}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {drive.files.length > 0 && (
        <section className="adm-drive-section" aria-labelledby="drive-files-heading">
          <div className="adm-section-head">
            <h2 id="drive-files-heading">Fichiers</h2>
            <span className="adm-muted">{drive.files.length} fichier{drive.files.length > 1 ? "s" : ""}</span>
          </div>
          <ul className="adm-card adm-files">
            {drive.files.map((f) => (
              <li key={`f${f.id}`}>
                <a href={`/api/portal/files/${f.id}?inline`} target="_blank" rel="noreferrer" className="adm-file-name">
                  <FileIcon name={f.name} type={f.content_type} /> {f.name}
                </a>
                <span className="adm-muted">
                  {formatSize(Number(f.size))} · {f.uploaded_by_kind === "admin" ? "Oxmad Digital" : f.uploaded_by} · {dateFormat.format(new Date(f.created_at))}
                </span>
                <span className="adm-file-actions">
                  <a className="adm-btn adm-btn-ghost" href={`/api/portal/files/${f.id}`} aria-label={`Télécharger ${f.name}`}><Download size={14} aria-hidden="true" /></a>
                  {(asAdmin || f.uploaded_by_kind === "client") && (
                    <ConfirmButton action={deleteDriveFile} fields={{ id: String(f.id), clientId: scope }} message={`Supprimer « ${f.name} » ?`} />
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
