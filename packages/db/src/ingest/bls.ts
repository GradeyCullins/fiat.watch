/**
 * BLS Public Data API v2 client.
 *
 * Replaces two Ruby rake tasks that fetched from the same endpoint but kept
 * different things. The important behavioural change is in the CPI path:
 * `cpi.rake` requested monthly data, received it, and threw it away —
 *
 *     elsif period.match?(/\AM\d{2}\z/)
 *       latest_monthly_by_year[year] ||= entry.merge("value" => value)
 *
 * — retaining one month per year purely to stand in for the unpublished
 * current-year annual average, then persisting only `annual_averages`. Every
 * other monthly reading was discarded on each run.
 *
 * That is why the site's 2,594 month pages deflated a March price with a
 * whole-year CPI. We keep M01–M12 as well as M13, so month-level figures can
 * be deflated by month-level CPI.
 */
import { z } from "zod";

export const BLS_ENDPOINT = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

/**
 * BLS caps the year span of a single request. The public limit is 10 years;
 * a registration key raises it to 20. `cpi.rake` hardcoded a 10-year window
 * and never looped, so it could only ever see the last decade — the file's
 * 114 years of history existed only because each run merged into what was
 * already on disk.
 */
const WINDOW_WITH_KEY = 20;
const WINDOW_WITHOUT_KEY = 10;

const BlsObservation = z.object({
  year: z.string(),
  period: z.string(),
  periodName: z.string(),
  value: z.string(),
  footnotes: z.array(z.object({ code: z.string().optional(), text: z.string().optional() })).optional(),
});

const BlsResponse = z.object({
  status: z.string(),
  message: z.array(z.string()).optional(),
  Results: z
    .object({
      series: z.array(
        z.object({
          seriesID: z.string(),
          data: z.array(BlsObservation),
        }),
      ),
    })
    .optional(),
});

export interface Observation {
  seriesId: string;
  year: number;
  /** 1–12, or null for the annual average (BLS period M13). */
  month: number | null;
  value: number;
  periodName: string;
}

export class BlsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlsError";
  }
}

/** Inclusive [start, end] windows sized to the API's per-request limit. */
export function* yearWindows(
  startYear: number,
  endYear: number,
  hasKey: boolean,
): Generator<[number, number]> {
  const size = hasKey ? WINDOW_WITH_KEY : WINDOW_WITHOUT_KEY;
  for (let y = startYear; y <= endYear; y += size) {
    yield [y, Math.min(y + size - 1, endYear)];
  }
}

async function fetchWindow(
  seriesIds: string[],
  startYear: number,
  endYear: number,
  apiKey: string | undefined,
): Promise<Observation[]> {
  const res = await fetch(BLS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      seriesid: seriesIds,
      startyear: String(startYear),
      endyear: String(endYear),
      annualaverage: true,
      ...(apiKey ? { registrationkey: apiKey } : {}),
    }),
  });

  if (!res.ok) throw new BlsError(`HTTP ${res.status} ${res.statusText}`);

  const parsed = BlsResponse.parse(await res.json());
  if (parsed.status !== "REQUEST_SUCCEEDED") {
    throw new BlsError(`${parsed.status} — ${(parsed.message ?? []).join("; ")}`);
  }

  const out: Observation[] = [];
  for (const series of parsed.Results?.series ?? []) {
    for (const row of series.data) {
      // BLS marks unavailable readings with "-" rather than omitting them.
      const value = Number(row.value);
      if (!Number.isFinite(value)) continue;

      let month: number | null;
      if (row.period === "M13") {
        month = null; // annual average
      } else if (/^M\d{2}$/.test(row.period)) {
        month = Number(row.period.slice(1));
      } else {
        continue; // quarterly/semiannual periods are not used here
      }

      out.push({
        seriesId: series.seriesID,
        year: Number(row.year),
        month,
        value,
        periodName: row.periodName,
      });
    }
  }
  return out;
}

/**
 * Fetch every observation for the given series across the full year range,
 * walking as many windows as the API limit requires.
 *
 * Months BLS never published simply do not appear in the result. That absence
 * is meaningful and must be preserved rather than filled: October 2025 is
 * missing from four of the five price series because collection was suspended
 * during the shutdown and could not be done retroactively, so the reading does
 * not exist and never will.
 */
export async function fetchSeries(options: {
  seriesIds: string[];
  startYear: number;
  endYear: number;
  apiKey?: string | undefined;
  onWindow?: (start: number, end: number, rows: number) => void;
}): Promise<Observation[]> {
  const { seriesIds, startYear, endYear, apiKey, onWindow } = options;
  const all: Observation[] = [];

  for (const [from, to] of yearWindows(startYear, endYear, Boolean(apiKey))) {
    const rows = await fetchWindow(seriesIds, from, to, apiKey);
    onWindow?.(from, to, rows.length);
    all.push(...rows);
  }

  return all;
}
