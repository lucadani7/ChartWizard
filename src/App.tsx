import { useEffect, useMemo, useRef, useState } from "react";
import { BmiFilters, BmiRecord, ComparisonKey, Gender } from "./types";
import { fetchBmiGraphQL, fetchBmiRest, loadMock } from "./api/client";
import BarChart from "./components/BarChart";
import LineChart from "./components/LineChart";
import PieChart from "./components/PieChart";
import ExportPanel from "./components/ExportPanel";
import Documentation from "./components/Documentation";

type ChartKind = "bar" | "line" | "pie";

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("theme") as "dark" | "light") || "dark";
  });
  const [view, setView] = useState<"dashboard" | "docs">("dashboard");
  const [source, setSource] = useState<"rest" | "graphql" | "mock">("mock");
  const [chart, setChart] = useState<ChartKind>("pie");
  const [compareBy, setCompareBy] = useState<ComparisonKey>("countryCode");
  const [filters, setFilters] = useState<BmiFilters>({
    years: { from: 2014, to: 2022 },
    genders: ["T"],
    categories: ["Underweight", "Normal", "Overweight", "Pre-obese", "Obese"],
    countries: ["EU27_2020"],
    ageGroups: undefined
  });
  const [rows, setRows] = useState<BmiRecord[]>([]);

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const geos = useMemo(() => {
    const set = new Set<string>(rows.map((r) => r.countryCode));
    set.add("EU27_2020");
    return Array.from(set).sort();
  }, [rows]);

  const compareKeys = useMemo(() => {
    const all: Array<{ value: ComparisonKey; label: string; enabled: boolean }> = [
      { value: "countryCode", label: "Country", enabled: true },
      { value: "gender", label: "Gender", enabled: true },
      { value: "ageGroup", label: "Age group", enabled: true },
      { value: "bmiCategory", label: "BMI category", enabled: true },
      { value: "year", label: "Year", enabled: chart !== "line" }
    ];
    return all;
  }, [chart]);

  useEffect(() => {
    if (chart === "line" && compareBy === "year") setCompareBy("countryCode");
  }, [chart, compareBy]);

  useEffect(() => {
    const run = async () => {
      try {
        if (source === "rest") setRows(await fetchBmiRest(filters));
        else if (source === "graphql") setRows(await fetchBmiGraphQL(filters));
        else setRows(await loadMock());
      } catch (e) {
        console.error(e);
        setRows(await loadMock());
      }
    };
    run();
  }, [source, filters]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const okCountry = !filters.countries || filters.countries.includes(r.countryCode);
      const okYear = !filters.years || (r.year >= filters.years.from && r.year <= filters.years.to);
      const okGender = !filters.genders || filters.genders.includes(r.gender as Gender);
      const okAge = !filters.ageGroups || filters.ageGroups.includes(r.ageGroup);
      const okCat = !filters.categories || filters.categories.includes(r.bmiCategory);
      return okCountry && okYear && okGender && okAge && okCat;
    });
  }, [rows, filters]);

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Eurostat BMI Visualizer</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="app__theme-toggle"
            onClick={() => setView("dashboard")}
            style={view === "dashboard" ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}}
          >
            Dashboard
          </button>
          <button
            className="app__theme-toggle"
            onClick={() => setView("docs")}
            style={view === "docs" ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}}
          >
            Docs
          </button>
          <button className="app__theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "☀ Light" : "☾ Dark"}
          </button>
        </div>
        <p className="app__subtitle">Visualize and compare BMI statistics via proprietary API (REST/GraphQL).</p>
      </header>

      {view === "docs" ? (
        <Documentation />
      ) : (
        <>
          <section className="app__controls">
        <div className="app__controls-group">
          <label className="app__controls-label">Data source</label>
          <select className="app__controls-input" value={source} onChange={(e) => setSource(e.target.value as any)}>
            <option value="rest">REST</option>
            <option value="graphql">GraphQL</option>
            <option value="mock">Mock</option>
          </select>
        </div>
        <div className="app__controls-group">
          <label className="app__controls-label">Chart</label>
          <select className="app__controls-input" value={chart} onChange={(e) => setChart(e.target.value as ChartKind)}>
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="pie">Pie</option>
          </select>
        </div>
        <div className="app__controls-group">
          <label className="app__controls-label">Compare by</label>
          <select
            className="app__controls-input"
            value={compareBy}
            onChange={(e) => setCompareBy(e.target.value as ComparisonKey)}
          >
            {compareKeys.map((k) => (
              <option key={k.value} value={k.value} disabled={!k.enabled}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div className="app__controls-group">
          <label className="app__controls-label">Countries</label>
          <select
            className="app__controls-input"
            multiple
            size={Math.min(8, Math.max(4, geos.length))}
            value={filters.countries ?? ["EU27_2020"]}
            onChange={(e) => {
              const values = Array.from((e.target as HTMLSelectElement).selectedOptions).map((o) => o.value);
              setFilters((f) => ({ ...f, countries: values.length ? values : undefined }));
            }}
          >
            {geos.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        <div className="app__controls-group">
          <label className="app__controls-label">Years</label>
          <div className="app__controls-row">
            <input
              type="number"
              value={filters.years?.from ?? 2014}
              onChange={(e) => setFilters((f) => ({ ...f, years: { from: Number(e.target.value), to: f.years?.to ?? 2022 } }))}
              className="app__controls-input"
            />
            <span>→</span>
            <input
              type="number"
              value={filters.years?.to ?? 2022}
              onChange={(e) => setFilters((f) => ({ ...f, years: { from: f.years?.from ?? 2014, to: Number(e.target.value) } }))}
              className="app__controls-input"
            />
          </div>
        </div>
        <div className="app__controls-group">
          <label className="app__controls-label">Gender</label>
          <select
            value={(filters.genders ?? ["T"])[0]}
            onChange={(e) => setFilters((f) => ({ ...f, genders: [e.target.value as Gender] }))}
            className="app__controls-input"
          >
            <option value="T">Total</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
      </section>

      <section className="app__chart">
        {chart === "bar" && (
          <BarChart
            data={filtered}
            groupBy={compareBy}
            width={undefined} // let chart auto-size or default
            height={undefined}
            onSvgRef={(el) => {
              svgRef.current = el;
            }}
          />
        )}
        {chart === "line" && (
          <LineChart
            data={filtered}
            seriesBy={compareBy}
            width={undefined}
            height={undefined}
            onSvgRef={(el) => {
              svgRef.current = el;
            }}
          />
        )}
        {chart === "pie" && (
          <PieChart
            data={filtered}
            width={undefined}
            height={undefined}
            onSvgRef={(el) => {
              svgRef.current = el;
            }}
          />
        )}
      </section>

      <ExportPanel
        svgEl={svgRef.current}
        chartType={chart}
        data={filtered}
        width={svgRef.current?.width.baseVal.value || 720}
        height={svgRef.current?.height.baseVal.value || 420}
      />
        </>
      )}
    </div>
  );
}
