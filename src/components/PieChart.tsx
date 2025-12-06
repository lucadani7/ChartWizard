import { useMemo, useRef, useEffect } from "react";
import { BmiRecord } from "../types";

type Props = {
  data: BmiRecord[];
  width?: number;
  height?: number;
  onSvgRef?: (el: SVGSVGElement | null) => void;
};

export default function PieChart({ data, width = 520, height = 520, onSvgRef }: Props) {
  const legendWidth = 160;
  const chartWidth = width - legendWidth;
  const radius = Math.min(chartWidth, height) / 2 - 24;
  const center = { x: chartWidth / 2, y: height / 2 };
  const viewBox = `0 0 ${width} ${height}`;
  const totals = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    data.forEach((d) => {
      const entry = map.get(d.bmiCategory) ?? { sum: 0, count: 0 };
      entry.sum += d.value;
      entry.count += 1;
      map.set(d.bmiCategory, entry);
    });
    const arr = Array.from(map.entries()).map(([k, v]) => ({ key: k, value: v.sum / v.count }));
    const sum = arr.reduce((a, b) => a + b.value, 0) || 1;
    return arr.map((x) => ({ ...x, pct: x.value / sum }));
  }, [data]);
  const colors = ["#4e79a7", "#59a14f", "#edc948", "#e15759", "#76b7b2", "#f28e2b"];

  const svgRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    onSvgRef?.(svgRef.current);
    return () => {};
  }, [onSvgRef]);

  let angle = -Math.PI / 2;
  const arcs = totals.map((t, i) => {
    const start = angle;
    const end = angle + t.pct * Math.PI * 2;
    angle = end;
    const x0 = center.x + radius * Math.cos(start);
    const y0 = center.y + radius * Math.sin(start);
    const x1 = center.x + radius * Math.cos(end);
    const y1 = center.y + radius * Math.sin(end);
    const largeArc = end - start > Math.PI ? 1 : 0;
    const d = `M ${center.x},${center.y} L ${x0},${y0} A ${radius},${radius} 0 ${largeArc} 1 ${x1},${y1} Z`;
    return { d, fill: colors[i % colors.length], key: t.key, value: t.value };
  });

  const legendYStart = (height - totals.length * 20) / 2;

  return (
    <svg ref={svgRef} viewBox={viewBox} role="img" aria-label="Pie chart" style={{ maxWidth: "100%", height: "auto" }}>
      <g>
        {arcs.map((a) => (
          <path key={a.key} d={a.d} fill={a.fill} stroke="var(--panel)" strokeWidth={1} />
        ))}
        {totals.map((t, i) => (
          <text key={t.key} x={chartWidth + 10} y={legendYStart + 20 + i * 20} fontSize={12} fill="var(--text)">
            <tspan fill={colors[i % colors.length]}>■</tspan> {t.key} ({t.value.toFixed(1)})
          </text>
        ))}
      </g>
    </svg>
  );
}