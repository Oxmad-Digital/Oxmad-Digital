type Day = { day: string; views: number; visitors: number };

const dayFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const longFormat = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const monthFormat = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit", timeZone: "UTC" });
const longMonthFormat = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

/** Rounds the axis max up to a readable step (1, 2, 5 × 10ⁿ). */
function niceMax(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((s) => s * magnitude >= value)!;
  return step * magnitude;
}

/** Page views per day (or per month) as plain HTML bars: responsive without a chart library, tooltip on hover and focus. */
export default function DailyChart({ data, monthly = false }: { data: Day[]; monthly?: boolean }) {
  const max = niceMax(Math.max(...data.map((d) => d.views)));
  const ticks = [max, max / 2, 0];
  const labelEvery = Math.ceil(data.length / 6);

  return (
    <div className="adm-chart">
      <div className="adm-chart-axis" aria-hidden>
        {ticks.map((t) => <span key={t}>{t}</span>)}
      </div>
      <div className="adm-chart-plot">
        <div className="adm-chart-grid" aria-hidden><span /><span /><span /></div>
        <ol className="adm-chart-bars">
          {data.map((d, i) => {
            const date = new Date(`${d.day}T00:00:00Z`);
            const tip = `${(monthly ? longMonthFormat : longFormat).format(date)} — ${d.views} vue${d.views > 1 ? "s" : ""}, ${d.visitors} visiteur${d.visitors > 1 ? "s" : ""}`;
            return (
              <li key={d.day} tabIndex={0} aria-label={tip} data-tip={tip}>
                <span className="adm-chart-bar" style={{ height: `${(d.views / max) * 100}%` }} />
                {i % labelEvery === 0 && (
                  <span className="adm-chart-x" aria-hidden>{(monthly ? monthFormat : dayFormat).format(date)}</span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
