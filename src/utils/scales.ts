export function linearScale(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const m = (r1 - r0) / (d1 - d0 || 1);
  return (x: number) => r0 + (x - d0) * m;
}

export function bandScale(values: string[], range: [number, number], padding = 0.1) {
  const [r0, r1] = range;
  const n = values.length;
  const step = (r1 - r0) / Math.max(n + padding * (n - 1), 1);
  const band = step * (1 - padding);
  const map = new Map<string, number>();
  values.forEach((v, i) => map.set(v, r0 + i * step));
  return Object.assign((v: string) => map.get(v) ?? r0, { bandwidth: band });
}

