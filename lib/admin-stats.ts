import "server-only";
import { db, type Booking, type ContactMessage } from "./db";
import { TIMEZONE } from "./site";

/** Period lengths in days; 0 means everything since the first recorded day. */
export const PERIODS = [7, 30, 90, 365, 0] as const;
export type Period = (typeof PERIODS)[number];

export type Breakdown = { label: string; count: number }[];

function database() {
  const sql = db();
  if (!sql) throw new Error("DATABASE_URL is not configured");
  return sql;
}

function breakdown(rows: Record<string, unknown>[]): Breakdown {
  return rows.map((r) => ({ label: String(r.label ?? "—"), count: Number(r.count) }));
}

/**
 * Sessions per day from raw view rows (day, visitor, created_at, duration): a new session starts after 30 min
 * without activity. Sessions made only of views recorded before engaged time was measured are left out.
 */
function sessionTotals(sql: ReturnType<typeof database>, rows: ReturnType<ReturnType<typeof database>>) {
  return sql`(SELECT day, count(*) AS sessions, sum(seconds) AS duration FROM (
      SELECT day, visitor, session, sum(duration) AS seconds FROM (
        SELECT day, visitor, duration, sum(starts) OVER (PARTITION BY day, visitor ORDER BY created_at) AS session FROM (
          SELECT day, visitor, created_at, duration,
            CASE WHEN created_at - lag(created_at + make_interval(secs => coalesce(duration, 0)))
              OVER (PARTITION BY day, visitor ORDER BY created_at) <= interval '30 minutes' THEN 0 ELSE 1 END AS starts
          FROM ${rows} r
        ) flagged
      ) numbered
      GROUP BY 1, 2, 3 HAVING count(duration) > 0
    ) sessions GROUP BY day)`;
}

/**
 * Moves every finished day of raw page_views into the daily aggregates, in one atomic statement.
 * Raw rows are only kept for the current day, so storage stays flat however long the site runs.
 */
async function rollupPageViews(sql: ReturnType<typeof database>) {
  await sql`WITH moved AS (
      DELETE FROM page_views
      WHERE created_at < date_trunc('day', now() AT TIME ZONE ${TIMEZONE}) AT TIME ZONE ${TIMEZONE}
      RETURNING (created_at AT TIME ZONE ${TIMEZONE})::date AS day, path, coalesce(utm_source, referrer, '') AS source,
        visitor, coalesce(country, '') AS country, coalesce(device, '') AS device, coalesce(browser, '') AS browser,
        created_at, duration
    ), pages AS (
      INSERT INTO page_views_daily (day, path, source, views)
      SELECT day, path, source, count(*) FROM moved GROUP BY 1, 2, 3
      ON CONFLICT (day, path, source) DO UPDATE SET views = page_views_daily.views + EXCLUDED.views
    ), visitors AS (
      INSERT INTO visitors_daily (day, country, device, browser, visitors)
      SELECT day, country, device, browser, count(DISTINCT visitor) FROM moved GROUP BY 1, 2, 3, 4
      ON CONFLICT (day, country, device, browser) DO UPDATE SET visitors = visitors_daily.visitors + EXCLUDED.visitors
    )
    INSERT INTO sessions_daily (day, sessions, duration)
    SELECT day, sessions, duration FROM ${sessionTotals(sql, sql`moved`)} s
    ON CONFLICT (day) DO UPDATE SET sessions = sessions_daily.sessions + EXCLUDED.sessions,
      duration = sessions_daily.duration + EXCLUDED.duration`;
}

/** Audience and form activity over the last `days` days (0 = all time), with the previous period for comparison. */
export async function getDashboard(days: Period) {
  const sql = database();
  await rollupPageViews(sql);

  // Aggregated history plus today's raw rows, in the same shape.
  const pageRows = sql`(SELECT day, path, source, views FROM page_views_daily
    UNION ALL SELECT (created_at AT TIME ZONE ${TIMEZONE})::date, path, coalesce(utm_source, referrer, ''), count(*)
      FROM page_views GROUP BY 1, 2, 3)`;
  const visitorRows = sql`(SELECT day, country, device, browser, visitors FROM visitors_daily
    UNION ALL SELECT (created_at AT TIME ZONE ${TIMEZONE})::date, coalesce(country, ''), coalesce(device, ''), coalesce(browser, ''), count(DISTINCT visitor)
      FROM page_views GROUP BY 1, 2, 3, 4)`;
  const sessionRows = sql`(SELECT day, sessions, duration FROM sessions_daily
    UNION ALL SELECT day, sessions, duration FROM ${sessionTotals(sql,
      sql`(SELECT (created_at AT TIME ZONE ${TIMEZONE})::date AS day, visitor, created_at, duration FROM page_views)`)} t)`;

  const today = sql`(now() AT TIME ZONE ${TIMEZONE})::date`;
  const from = days
    ? sql`(${today} - ${days - 1}::int)`
    : sql`coalesce((SELECT min(day) FROM page_views_daily), ${today})`;
  const unit = days === 0 || days > 90 ? "month" : "day";

  const [totals, previous, daily, pages, referrers, countries, devices, browsers, forms, vitals] = await Promise.all([
    sql`SELECT
      (SELECT coalesce(sum(views), 0) FROM ${pageRows} p WHERE day >= ${from}) AS views,
      (SELECT coalesce(sum(visitors), 0) FROM ${visitorRows} v WHERE day >= ${from}) AS visitors,
      (SELECT coalesce(sum(duration) / nullif(sum(sessions), 0), 0) FROM ${sessionRows} s WHERE day >= ${from}) AS session`,
    days
      ? sql`SELECT
        (SELECT coalesce(sum(views), 0) FROM page_views_daily WHERE day >= ${today} - ${days * 2 - 1}::int AND day < ${from}) AS views,
        (SELECT coalesce(sum(visitors), 0) FROM visitors_daily WHERE day >= ${today} - ${days * 2 - 1}::int AND day < ${from}) AS visitors,
        (SELECT coalesce(sum(duration) / nullif(sum(sessions), 0), 0) FROM sessions_daily
          WHERE day >= ${today} - ${days * 2 - 1}::int AND day < ${from}) AS session`
      : Promise.resolve([{ views: 0, visitors: 0, session: 0 }]),
    sql`SELECT to_char(b, 'YYYY-MM-DD') AS day, coalesce(p.views, 0) AS views, coalesce(v.visitors, 0) AS visitors
      FROM generate_series(date_trunc(${unit}, ${from}::timestamp), ${today}::timestamp, ${`1 ${unit}`}::interval) AS b
      LEFT JOIN (SELECT date_trunc(${unit}, day::timestamp) AS b, sum(views) AS views FROM ${pageRows} p WHERE day >= ${from} GROUP BY 1) p USING (b)
      LEFT JOIN (SELECT date_trunc(${unit}, day::timestamp) AS b, sum(visitors) AS visitors FROM ${visitorRows} v WHERE day >= ${from} GROUP BY 1) v USING (b)
      ORDER BY b`,
    sql`SELECT path AS label, sum(views) AS count FROM ${pageRows} p WHERE day >= ${from} GROUP BY path ORDER BY count DESC LIMIT 8`,
    sql`SELECT coalesce(nullif(source, ''), 'Accès direct') AS label, sum(views) AS count FROM ${pageRows} p
      WHERE day >= ${from} AND (source <> '' OR path = '/')
      GROUP BY label ORDER BY count DESC LIMIT 8`,
    sql`SELECT coalesce(nullif(country, ''), '—') AS label, sum(visitors) AS count FROM ${visitorRows} v WHERE day >= ${from} GROUP BY label ORDER BY count DESC`,
    sql`SELECT device AS label, sum(visitors) AS count FROM ${visitorRows} v WHERE day >= ${from} GROUP BY device ORDER BY count DESC`,
    sql`SELECT browser AS label, sum(visitors) AS count FROM ${visitorRows} v WHERE day >= ${from} GROUP BY browser ORDER BY count DESC LIMIT 6`,
    sql`SELECT
      (SELECT count(*) FROM contact_messages WHERE (created_at AT TIME ZONE ${TIMEZONE})::date >= ${from}) AS messages,
      (SELECT count(*) FROM contact_messages WHERE status = 'new') AS unread,
      (SELECT count(*) FROM bookings WHERE (created_at AT TIME ZONE ${TIMEZONE})::date >= ${from}) AS bookings,
      (SELECT count(*) FROM bookings WHERE status = 'pending' AND slot >= now()) AS pending`,
    sql`SELECT name, percentile_cont(0.75) WITHIN GROUP (ORDER BY value) AS p75, count(*) AS samples
      FROM web_vitals WHERE (created_at AT TIME ZONE ${TIMEZONE})::date >= ${from}
      GROUP BY name ORDER BY name`,
  ]);

  const vitalByName = new Map(vitals.map((r) => [String(r.name), {
    p75: Number(r.p75), samples: Number(r.samples),
  }]));

  return {
    monthly: unit === "month",
    views: Number(totals[0].views),
    visitors: Number(totals[0].visitors),
    previousViews: Number(previous[0].views),
    previousVisitors: Number(previous[0].visitors),
    /** Average engaged seconds per session. */
    sessionDuration: Math.round(Number(totals[0].session)),
    previousSessionDuration: Math.round(Number(previous[0].session)),
    daily: daily.map((r) => ({ day: String(r.day), views: Number(r.views), visitors: Number(r.visitors) })),
    pages: breakdown(pages),
    referrers: breakdown(referrers),
    countries: breakdown(countries),
    devices: breakdown(devices),
    browsers: breakdown(browsers),
    messages: Number(forms[0].messages),
    unread: Number(forms[0].unread),
    bookings: Number(forms[0].bookings),
    pendingBookings: Number(forms[0].pending),
    vitals: (["LCP", "INP", "CLS"] as const).map((name) => ({
      name,
      p75: vitalByName.get(name)?.p75 ?? null,
      samples: vitalByName.get(name)?.samples ?? 0,
    })),
  };
}

export async function getMessages(status: ContactMessage["status"] | "all") {
  const sql = database();
  const rows = status === "all"
    ? await sql`SELECT * FROM contact_messages WHERE status <> 'archived' ORDER BY created_at DESC LIMIT 200`
    : await sql`SELECT * FROM contact_messages WHERE status = ${status} ORDER BY created_at DESC LIMIT 200`;
  return rows as ContactMessage[];
}

export async function getBookings(scope: "upcoming" | "past") {
  const sql = database();
  const rows = scope === "upcoming"
    ? await sql`SELECT * FROM bookings WHERE slot >= now() - interval '30 minutes' ORDER BY slot ASC LIMIT 200`
    : await sql`SELECT * FROM bookings WHERE slot < now() - interval '30 minutes' ORDER BY slot DESC LIMIT 200`;
  return rows as Booking[];
}
