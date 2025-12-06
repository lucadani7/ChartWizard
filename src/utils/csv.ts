import { BmiRecord } from "../types";

export function toCsv(rows: BmiRecord[]): string {
  const header = [
    "countryCode",
    "countryName",
    "year",
    "gender",
    "ageGroup",
    "bmiCategory",
    "value"
  ].join(",");
  const body = rows
    .map((r) =>
      [r.countryCode, r.countryName, r.year, r.gender, r.ageGroup, r.bmiCategory, r.value]
        .map((v) => String(v).replace(/\"/g, "\"\"") )
        .map((v) => (v.includes(",") ? `"${v}"` : v))
        .join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}

export function download(filename: string, mime: string, content: BlobPart | string) {
  const blob = typeof content === "string" ? new Blob([content], { type: mime }) : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
