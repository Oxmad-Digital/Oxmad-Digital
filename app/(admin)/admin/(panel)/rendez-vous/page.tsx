import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getBookings } from "@/lib/admin-stats";
import type { Booking } from "@/lib/db";
import { TIMEZONE } from "@/lib/site";
import { deleteBooking, setBookingStatus } from "../../actions";
import DeleteButton from "../DeleteButton";

const STATUS: Record<Booking["status"], { label: string; action: string; className: string }> = {
  pending: { label: "À confirmer", action: "Remettre à confirmer", className: "adm-pill-accent" },
  confirmed: { label: "Confirmé", action: "Confirmer", className: "adm-pill-good" },
  done: { label: "Effectué", action: "Marquer effectué", className: "" },
  cancelled: { label: "Annulé", action: "Annuler", className: "adm-pill-bad" },
};

const slotFormat = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: TIMEZONE });
const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: TIMEZONE });

/** wa.me wants digits only, with the country code. */
function whatsappLink(phone: string) {
  return `https://wa.me/${phone.replace(/[^\d]/g, "")}`;
}

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  await requireAdmin();
  const scope = (await searchParams).s === "past" ? "past" : "upcoming";
  const bookings = await getBookings(scope);

  return (
    <>
      <div className="adm-title-row">
        <h1>Rendez-vous</h1>
        <div className="adm-segmented" role="group" aria-label="Période">
          <Link href="/admin/rendez-vous" aria-current={scope === "upcoming" ? "true" : undefined}>À venir</Link>
          <Link href="/admin/rendez-vous?s=past" aria-current={scope === "past" ? "true" : undefined}>Passés</Link>
        </div>
      </div>

      {bookings.length === 0 && <p className="adm-card adm-empty">Aucun rendez-vous {scope === "upcoming" ? "à venir" : "passé"}.</p>}

      <ul className="adm-list">
        {bookings.map((b) => (
          <li key={b.id} className={`adm-card adm-item ${b.status === "cancelled" ? "is-muted" : ""}`}>
            <div className="adm-item-head">
              <div>
                <p className="adm-item-slot">{slotFormat.format(new Date(b.slot))}</p>
                <p className="adm-item-title">
                  <span className={`adm-pill ${STATUS[b.status].className}`}>{STATUS[b.status].label}</span>
                  {b.name}
                </p>
                <p className="adm-item-meta">
                  {b.channel} · <a href={b.channel === "WhatsApp" ? whatsappLink(b.phone) : `tel:${b.phone}`} target={b.channel === "WhatsApp" ? "_blank" : undefined} rel="noreferrer">{b.phone}</a>
                  {" · "}<a href={`mailto:${b.email}`}>{b.email}</a>
                </p>
              </div>
              <span className="adm-muted">Demandé le {dateFormat.format(new Date(b.created_at))}</span>
            </div>
            {b.message && <p className="adm-item-body">{b.message}</p>}
            <div className="adm-item-actions">
              <form action={setBookingStatus} className="adm-status-form">
                <input type="hidden" name="id" value={b.id} />
                {(Object.keys(STATUS) as Booking["status"][]).filter((s) => s !== b.status).map((s) => (
                  <button key={s} className="adm-btn" name="status" value={s}>{STATUS[s].action}</button>
                ))}
              </form>
              <DeleteButton action={deleteBooking} id={b.id} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
