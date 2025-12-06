import { BmiFilters, BmiRecord } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function fetchBmiRest(filters: BmiFilters): Promise<BmiRecord[]> {
  if (!API_BASE) return loadMock();
  const url = new URL(`${API_BASE.replace(/\/$/, "")}/bmi`);
  if (filters.countries?.length) url.searchParams.set("countries", filters.countries.join(","));
  if (filters.years) url.searchParams.set("years", `${filters.years.from}-${filters.years.to}`);
  if (filters.genders?.length) url.searchParams.set("genders", filters.genders.join(","));
  if (filters.ageGroups?.length) url.searchParams.set("ageGroups", filters.ageGroups.join(","));
  if (filters.categories?.length) url.searchParams.set("categories", filters.categories.join(","));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`REST request failed: ${res.status}`);
  const data = (await res.json()) as unknown;
  return normalize(data);
}

export async function fetchBmiGraphQL(filters: BmiFilters): Promise<BmiRecord[]> {
  if (!API_BASE) return loadMock();
  const query = `
    query Bmi($filters: BmiFilters) {
      bmi(filters: $filters) {
        countryCode
        countryName
        year
        gender
        ageGroup
        bmiCategory
        value
      }
    }
  `;
  const res = await fetch(`${API_BASE.replace(/\/$/, "")}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { filters } })
  });
  if (!res.ok) throw new Error(`GraphQL request failed: ${res.status}`);
  const json = await res.json();
  const data = json?.data?.bmi ?? [];
  return normalize(data);
}

export async function loadMock(): Promise<BmiRecord[]> {
  const mod = await import("../data/sample_bmi.json");
  const data = (mod.default ?? mod) as unknown;
  if (Array.isArray(data)) return normalize(data);
  const ds = data as any;
  if (ds && ds.class === "dataset" && ds.dimension && ds.value) return jsonStatToBmi(ds);
  return [];
}

function normalize(data: any): BmiRecord[] {
  if (!Array.isArray(data)) return [];
  return data.map((d) => ({
    countryCode: String(d.countryCode ?? d.country ?? "EU"),
    countryName: String(d.countryName ?? d.country_label ?? d.countryCode ?? "EU"),
    year: Number(d.year ?? d.time ?? 2020),
    gender: (d.gender ?? d.sex ?? "T").toUpperCase(),
    ageGroup: String(d.ageGroup ?? d.age ?? "18-24"),
    bmiCategory: (d.bmiCategory ?? d.category ?? "Normal"),
    value: Number(d.value ?? d.rate ?? 0)
  })) as BmiRecord[];
}

function jsonStatToBmi(ds: any): BmiRecord[] {
  const dimKeys: string[] = ds.id ?? Object.keys(ds.dimension);
  const sizes: number[] = ds.size ?? dimKeys.map((k: string) => Object.keys(ds.dimension[k].category.index).length);
  const codesByDim: Record<string, string[]> = {};
  const labelsByDim: Record<string, Record<string, string>> = {};

  dimKeys.forEach((d) => {
    const idx = ds.dimension[d].category.index as Record<string, number>;
    const label = (ds.dimension[d].category.label ?? {}) as Record<string, string>;
    labelsByDim[d] = label;
    const arr: string[] = new Array(Object.keys(idx).length);
    for (const code of Object.keys(idx)) arr[idx[code]] = code;
    codesByDim[d] = arr;
  });

  const strides: number[] = [];
  for (let i = dimKeys.length - 1, acc = 1; i >= 0; i--) {
    strides[i] = acc;
    acc *= sizes[i];
  }

  const entries: Array<{ pos: number; val: number | null }> = [];
  if (Array.isArray(ds.value)) ds.value.forEach((v: number | null, i: number) => entries.push({ pos: i, val: v }));
  else for (const k of Object.keys(ds.value)) entries.push({ pos: Number(k), val: ds.value[k] as number | null });

  const out: BmiRecord[] = [];
  for (const { pos, val } of entries) {
    if (val == null) continue;
    const coords: Record<string, string> = {};
    let rem = pos;
    for (let i = 0; i < dimKeys.length; i++) {
      const d = dimKeys[i];
      const stride = strides[i];
      const idx = Math.floor(rem / stride) % sizes[i];
      rem = rem % stride;
      const code = codesByDim[d][idx];
      coords[d] = code;
    }

    const geoCode = coords.geo ?? coords.GEO ?? "EU";
    const countryCode = String(geoCode).toUpperCase();
    const countryName = labelsByDim.geo?.[geoCode] ?? countryCode;
    const yearCode = coords.time ?? coords.TIME_PERIOD ?? coords.time_period;
    const year = Number(yearCode ?? 0);
    const bmiCode = coords.bmi ?? coords.BMI ?? "BMI_GE30";
    const bmiLabel = labelsByDim.bmi?.[bmiCode] ?? bmiCode;
    const bmiCategory: BmiRecord["bmiCategory"] =
      bmiLabel.includes("Pre-obese") || bmiLabel === "Pre-obese"
        ? "Pre-obese"
        : bmiLabel.includes("Overweight") || bmiLabel === "Overweight"
        ? "Overweight"
        : bmiLabel.includes("Obese") || bmiLabel === "Obese"
        ? "Obese"
        : bmiLabel.includes("Underweight") || bmiLabel === "Underweight"
        ? "Underweight"
        : "Normal";

    const valNum = Number(val);
    out.push({ countryCode, countryName, year, gender: "T", ageGroup: "TOTAL", bmiCategory, value: valNum });

    // Synthesize M/F
    let valM = valNum;
    let valF = valNum;

    if (bmiCategory === "Overweight" || bmiCategory === "Pre-obese" || bmiCategory === "Obese") {
      // Assumption: Men have slightly higher rates
      valM = Math.min(100, valNum * 1.05);
      valF = Math.max(0, valNum * 0.95);
    } else if (bmiCategory === "Underweight") {
      // Assumption: Women have slightly higher rates
      valM = Math.max(0, valNum * 0.8);
      valF = Math.min(100, valNum * 1.2);
    }
    
    out.push({ countryCode, countryName, year, gender: "M", ageGroup: "TOTAL", bmiCategory, value: valM });
    out.push({ countryCode, countryName, year, gender: "F", ageGroup: "TOTAL", bmiCategory, value: valF });
  }

  // Synthesize missing "Normal" and "Underweight" categories if "Overweight" exists
  const byGroup = new Map<string, BmiRecord[]>();
  out.forEach((r) => {
    const key = `${r.countryCode}|${r.year}|${r.gender}`;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key)!.push(r);
  });

  const extra: BmiRecord[] = [];
  for (const group of byGroup.values()) {
    const cats = new Set(group.map((r) => r.bmiCategory));
    if (cats.has("Overweight") && !cats.has("Normal") && !cats.has("Underweight")) {
      const ov = group.find((r) => r.bmiCategory === "Overweight")!;
      // Mock logic: assume Underweight is approx 3%, Normal is remainder
      const valUnder = 3.0;
      const valNormal = Math.max(0, 100 - ov.value - valUnder);
      
      extra.push({ ...ov, bmiCategory: "Underweight", value: valUnder });
      extra.push({ ...ov, bmiCategory: "Normal", value: valNormal });
    }
  }

  return [...out, ...extra];
}