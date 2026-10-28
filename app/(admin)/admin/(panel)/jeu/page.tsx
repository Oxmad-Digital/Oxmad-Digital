import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { TIMEZONE } from "@/lib/site";
import { gameStats, listPlayers } from "@/lib/xrun";
import { hideGamePlayer } from "../../actions";
import DeleteButton from "../DeleteButton";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: TIMEZONE });
const numberFormat = new Intl.NumberFormat("fr-FR");

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  if (minutes >= 60) return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
  return minutes > 0 ? `${minutes} min` : `${seconds} s`;
}

export default async function GamePage() {
  await requireAdmin();
  const sql = db();
  const [stats, players] = sql ? await Promise.all([gameStats(sql), listPlayers(sql)]) : [{ plays: 0, seconds: 0 }, []];

  return (
    <>
      <div className="adm-title-row">
        <h1>Mini-jeu 0x-Run</h1>
      </div>

      <div className="adm-kpis adm-kpis-3">
        <div className="adm-card adm-kpi">
          <span className="adm-kpi-label">Parties jouées</span>
          <span className="adm-kpi-value">{numberFormat.format(stats.plays)}</span>
        </div>
        <div className="adm-card adm-kpi">
          <span className="adm-kpi-label">Temps de jeu cumulé</span>
          <span className="adm-kpi-value">{formatDuration(stats.seconds)}</span>
        </div>
        <div className="adm-card adm-kpi">
          <span className="adm-kpi-label">Joueurs classés</span>
          <span className="adm-kpi-value">{numberFormat.format(players.length)}</span>
        </div>
      </div>

      {players.length === 0 ? (
        <p className="adm-card adm-empty">Personne n&apos;est encore au classement.</p>
      ) : (
        <div className="adm-card adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Pseudo</th>
                <th className="is-num">Meilleur score</th>
                <th className="is-num">Parties classées</th>
                <th>Dernière</th>
                <th><span className="adm-sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr key={p.id}>
                  <td className="adm-muted">{i + 1}</td>
                  <td>{p.name}</td>
                  <td className="is-num">{numberFormat.format(p.best)}</td>
                  <td className="is-num">{p.runs}</td>
                  <td className="adm-muted">{dateFormat.format(new Date(p.last_at))}</td>
                  <td>
                    <div className="adm-row-actions">
                      <DeleteButton
                        action={hideGamePlayer}
                        id={p.id}
                        label="Retirer"
                        message={`Retirer « ${p.name} » du classement ? Ses parties restent comptées dans les statistiques.`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
