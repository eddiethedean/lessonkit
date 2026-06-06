import type { ChartDatum } from "./Chart";

export type NormalizedChartDatum = {
  label: string;
  value: number;
  key: string;
};

export function normalizeChartType(type: string | undefined): "bar" | "pie" {
  return type === "bar" ? "bar" : "pie";
}

export function normalizeChartData(data: unknown): NormalizedChartDatum[] {
  if (!Array.isArray(data)) return [];
  const rows: NormalizedChartDatum[] = [];
  for (let i = 0; i < data.length; i += 1) {
    const row = data[i];
    if (!row || typeof row !== "object") continue;
    const label = typeof (row as ChartDatum).label === "string" ? (row as ChartDatum).label : `Item ${i + 1}`;
    const raw = Number((row as ChartDatum).value);
    const value = Number.isFinite(raw) && raw >= 0 ? raw : 0;
    rows.push({ label, value, key: `${label}-${i}` });
  }
  return rows;
}

export function chartMaxValue(rows: NormalizedChartDatum[]): number {
  if (rows.length === 0) return 1;
  return Math.max(...rows.map((row) => row.value), 1);
}
