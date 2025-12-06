import { useMemo, useRef, useEffect } from "react";
import { BmiRecord } from "../types";
import { linearScale, bandScale } from "../utils/scales";

type Props = {
  data: BmiRecord[];
  seriesBy: keyof BmiRecord; // e.g. countryCode or gender
  width?: number;
  height?: number;
  onSvgRef?: (el: SVGSVGElement | null) => void;
};

export default function LineChart({ data, seriesBy, width = 720, height = 420, onSvgRef }: Props) {
  const margin = { top: 24, right: 20, bottom: 40, left: 56 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  
  const viewBox = `0 0 ${width} ${height}`;

  const series = useMemo(() => {
    const map = new Map<string, { [year: number]: { sum: number; count: number } }>();
    data.forEach((d) => {
      const k = String(d[seriesBy]);
      const seriesData = map.get(k) ?? {};
      const yearEntry = seriesData[d.year] ?? { sum: 0, count: 0 };
      yearEntry.sum += d.value;
      yearEntry.count += 1;
      seriesData[d.year] = yearEntry;
      map.set(k, seriesData);
    });
    
    return Array.from(map.entries()).map(([k, yearData]) => {
        const points = Object.keys(yearData).map(yearStr => {
            const year = Number(yearStr);
            const { sum, count } = yearData[year];
            return { year, value: sum / count, countryCode: "", countryName: "", gender: "T" as const, ageGroup: "", bmiCategory: "Normal" as const };
        }).sort((a, b) => a.year - b.year);
        return { key: k, points };
    });
  }, [data, seriesBy]);

  const years = Array.from(new Set(data.map((d) => d.year))).sort((a, b) => a - b);
  const x = bandScale(years.map(String), [0, innerW]);
  const y = linearScale([0, Math.max(...data.map((d) => d.value), 10)], [innerH, 0]);
  const colors = ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc948", "#b07aa1", "#ff9da7"];

  const svgRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    onSvgRef?.(svgRef.current);
    return () => {};
  }, [onSvgRef]);

  return (
    <svg ref={svgRef} viewBox={viewBox} role="img" aria-label="Line chart" style={{ maxWidth: "100%", height: "auto" }}>
      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* axes */}
        <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="var(--axis)" />
        <line x1={0} y1={0} x2={0} y2={innerH} stroke="var(--axis)" />

        {years.map((v) => (
          <text key={v} x={(x(String(v)) ?? 0) + x.bandwidth / 2} y={innerH + 16} textAnchor="middle" fontSize={12} fill="var(--text)">
            {v}
          </text>
        ))}
        {new Array(5).fill(0).map((_, i) => {
          const t = (i / 4) * Math.max(...data.map((d) => d.value), 10);
          const yy = y(t);
          return (
            <g key={i}>
              <line x1={0} y1={yy} x2={innerW} y2={yy} stroke="var(--grid)" />
              <text x={-8} y={yy} textAnchor="end" dominantBaseline="middle" fontSize={12} fill="var(--text)">
                {t.toFixed(0)}
              </text>
            </g>
          );
        })}

        {series.map((s, idx) => {
          const stroke = colors[idx % colors.length];
          const path = s.points
            .map((p, i) => {
              const xx = (x(String(p.year)) ?? 0) + x.bandwidth / 2;
              const yy = y(p.value);
              return `${i === 0 ? "M" : "L"}${xx},${yy}`;
            })
            .join(" ");
          return <path key={s.key} d={path} fill="none" stroke={stroke} strokeWidth={2} />;
        })}
      </g>
    </svg>
  );
}
