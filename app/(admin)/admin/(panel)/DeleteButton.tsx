"use client";

export default function DeleteButton({
  action,
  id,
  label = "Supprimer",
  message = "Supprimer définitivement ? Cette action est irréversible.",
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label?: string;
  message?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="adm-btn adm-btn-danger">{label}</button>
    </form>
  );
}
