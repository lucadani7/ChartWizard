import { useMemo, useRef, useEffect } from "react";
import { BmiRecord } from "../types";
import { linearScale, bandScale } from "../utils/scales";

type Props = {
  data: BmiRecord[];
  groupBy: keyof BmiRecord; // e.g. countryCode
  width?: number;
  height?: number;
  onSvgRef?: (el: SVGSVGElement | null) => void;
};

export default function BarChart({ data, groupBy, width = 720, height = 420, onSvgRef }: Props) {
  const margin = { top: 24, right: 20, bottom: 40, left: 56 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  
  const viewBox = `0 0 ${width} ${height}`;

  const groups = useMemo(() => {
    const key = groupBy;
    const map = new Map<string, { sum: number; count: number }>();
    data.forEach((d) => {
      const k = String(d[key]);
      const entry = map.get(k) ?? { sum: 0, count: 0 };
      entry.sum += d.value;
      entry.count += 1;
      map.set(k, entry);
    });
    return Array.from(map.entries()).map(([k, v]) => ({ key: k, value: v.sum / v.count }));
  }, [data, groupBy]);

  const xVals = groups.map((g) => g.key);
  const x = bandScale(xVals, [0, innerW]);
  const y = linearScale([0, Math.max(...groups.map((g) => g.value), 10)], [innerH, 0]);

  const svgRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    onSvgRef?.(svgRef.current);
    return () => {};
  }, [onSvgRef]);

  return (
    <svg ref={svgRef} viewBox={viewBox} role="img" aria-label="Bar chart" style={{ maxWidth: "100%", height: "auto" }}>
      <g transform={`translate(${margin.left},${margin.top})`}>
        {groups.map((g) => (
          <rect
            key={g.key}
            x={x(g.key)}
            y={y(g.value)}
            width={x.bandwidth}
            height={innerH - y(g.value)}
            fill="#4e79a7"
          />
        ))}

        {/* axes */}
        <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="var(--axis)" />
        <line x1={0} y1={0} x2={0} y2={innerH} stroke="var(--axis)" />

        {xVals.map((v) => (
          <text key={v} x={(x(v) ?? 0) + x.bandwidth / 2} y={innerH + 16} textAnchor="middle" fontSize={12} fill="var(--text)">
            {v}
          </text>
        ))}
        {new Array(5).fill(0).map((_, i) => {
          const t = (i / 4) * Math.max(...groups.map((g) => g.value), 10);
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
      </g>
    </svg>
  );
}