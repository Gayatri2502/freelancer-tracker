import Papa from "papaparse";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { downloadBlob } from "./utils.js";

export function exportRows(rows, filename, format) {
  if (format === "csv") {
    downloadBlob(Papa.unparse(rows), `${filename}.csv`, "text/csv");
  } else if (format === "excel") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } else if (format === "json") {
    downloadBlob(JSON.stringify(rows, null, 2), `${filename}.json`, "application/json");
  }
}

export async function exportNodeAsPdf(node, filename) {
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  pdf.addImage(imgData, "PNG", (pageWidth - w) / 2, 24, w, h);
  pdf.save(filename);
}
