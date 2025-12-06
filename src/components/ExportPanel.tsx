import { BmiRecord } from "../types";
import { toCsv, download } from "../utils/csv";

type Props = {
  svgEl: SVGSVGElement | null;
  chartType: "bar" | "line" | "pie";
  data: BmiRecord[];
  width: number;
  height: number;
};

export default function ExportPanel({ svgEl, data, width, height }: Props) {
  const exportCsv = () => {
    const csv = toCsv(data);
    download("bmi.csv", "text/csv;charset=utf-8", csv);
  };

  const exportSvg = () => {
    if (!svgEl) return;
    const xml = svgEl.outerHTML;
    download("bmi.svg", "image/svg+xml;charset=utf-8", xml);
  };

  const exportWebP = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Simple rasterization: draw the SVG onto canvas using an image object.
    // Note: This relies on inline-safe SVG; for complex cases, a dedicated renderer would be needed.
    if (svgEl) {
      const svgData = new Blob([svgEl.outerHTML], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgData);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e as any);
        img.src = url;
      });
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
    }
    canvas.toBlob((blob) => blob && download("bmi.webp", "image/webp", blob), "image/webp", 0.92);
  };

  return (
    <div className="app__export-panel">
      <button className="app__export-button" onClick={exportCsv}>Export CSV</button>
      <button className="app__export-button" onClick={exportSvg}>Export SVG</button>
      <button className="app__export-button" onClick={exportWebP}>Export WebP</button>
    </div>
  );
}
