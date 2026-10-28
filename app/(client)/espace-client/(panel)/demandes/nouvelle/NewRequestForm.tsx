"use client";

import AttachForm from "@/components/portal/AttachForm";
import { REQUEST_KINDS } from "@/lib/portal-labels";
import { createRequest } from "../../../actions";

export default function NewRequestForm({ projects }: { projects: { id: string; name: string; maintenance: boolean }[] }) {
  return (
    <AttachForm action={createRequest} submitLabel="Envoyer la demande" fileLabel="Joindre des captures ou fichiers">
      <fieldset className="adm-choices">
        <legend>Type de demande</legend>
        {Object.entries(REQUEST_KINDS).map(([value, kind], i) => (
          <label key={value} className="adm-choice">
            <input type="radio" name="kind" value={value} required defaultChecked={i === 0} />
            <span><strong>{kind.label}</strong><small>{kind.hint}</small></span>
          </label>
        ))}
      </fieldset>

      {projects.length > 1 && (
        <>
          <label htmlFor="projectId">Site concerné</label>
          <select id="projectId" name="projectId" required defaultValue="">
            <option value="" disabled>Choisir…</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}{p.maintenance ? "" : " (sans maintenance)"}</option>)}
          </select>
        </>
      )}
      {projects.length === 1 && <input type="hidden" name="projectId" value={projects[0].id} />}

      <label htmlFor="title">Titre</label>
      <input id="title" name="title" maxLength={160} required placeholder="Ex. : Corriger le numéro de téléphone du pied de page" />

      <label htmlFor="pageUrl">Page concernée (facultatif)</label>
      <input id="pageUrl" name="pageUrl" maxLength={500} inputMode="url" autoCapitalize="none" spellCheck={false}
        placeholder="Collez le lien de la page, ex. : exemple.com/contact" />

      <label htmlFor="body">Ce que vous constatez</label>
      <textarea id="body" name="body" rows={5} maxLength={10000} required
        placeholder="Ex. : dans le pied de page, le numéro affiché est 01 23 45 67 89. Sur mobile, le bouton « Réserver » est caché derrière le menu." />

      <label htmlFor="expected">Ce que vous souhaitez à la place (facultatif)</label>
      <textarea id="expected" name="expected" rows={4} maxLength={10000}
        placeholder="Ex. : afficher le 06 12 34 56 78, cliquable pour appeler. Une capture annotée aide beaucoup." />

      <label className="adm-check">
        <input type="checkbox" name="urgent" /> Urgent (site bloqué, information erronée en ligne…)
      </label>
    </AttachForm>
  );
}
