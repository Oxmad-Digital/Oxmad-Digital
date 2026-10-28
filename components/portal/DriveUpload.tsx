"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { addDriveFiles } from "@/lib/portal-actions";
import { uploadFiles } from "./uploads";

/** Drop zone + file picker of a drive folder. */
export default function DriveUpload({ clientId, folderId }: { clientId: string | null; folderId: string | null }) {
  const router = useRouter();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function send(list: FileList | null) {
    const files = Array.from(list ?? []).filter((f) => f.size > 0 || f.type);
    if (files.length === 0 || progress !== null) return;
    setError(null);
    setProgress(0);
    try {
      const uploads = await uploadFiles(files, clientId, setProgress);
      const formData = new FormData();
      if (clientId) formData.set("clientId", clientId);
      if (folderId) formData.set("folderId", folderId);
      formData.set("uploads", JSON.stringify(uploads));
      const result = await addDriveFiles(formData);
      if (result.error) setError(result.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div>
      <label
        className={`adm-dropzone${dragging ? " is-dragging" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); send(e.dataTransfer.files); }}
      >
        <UploadCloud size={22} aria-hidden="true" />
        {progress === null
          ? <span><strong>Déposez vos fichiers ici</strong> ou cliquez pour parcourir</span>
          : <span>Envoi… {Math.round(progress * 100)} %</span>}
        <input type="file" multiple disabled={progress !== null} onChange={(e) => { send(e.currentTarget.files); e.currentTarget.value = ""; }} />
        {progress !== null && <progress className="adm-progress" value={progress} max={1} aria-label="Envoi des fichiers" />}
      </label>
      {error && <p className="adm-error" role="alert">{error}</p>}
    </div>
  );
}
