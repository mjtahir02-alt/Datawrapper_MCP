import type { DataRow, Primitive } from "./types";

function escapeCell(value: Primitive): string {
  if (value === null) return "";

  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function rowsToCsv(rows: DataRow[]): string {
  if (rows.length === 0) {
    throw new Error("At least one data row is required.");
  }

  const headers: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        headers.push(key);
      }
    }
  }

  if (headers.length === 0) {
    throw new Error("Data rows must contain at least one column.");
  }

  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCell(row[header] ?? null)).join(","),
    ),
  ];

  return lines.join("\n");
}
