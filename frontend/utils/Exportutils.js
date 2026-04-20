/**
 * exportUtils.js
 *
 * Client-side export helpers for PDF and Excel.
 * PDF  — jsPDF + jspdf-autotable  (loaded from CDN lazily)
 * Excel — SheetJS xlsx             (already bundled in the app)
 */

import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs";

// ── Column definitions ────────────────────────────────────────────────────────

export const EXPORT_COLUMNS = [
  { key: "shippingNo",             label: "Shipping No",           minW: 80  },
  { key: "skuNo",                  label: "SKU No.",               minW: 70  },
  { key: "courier",                label: "Courier",               minW: 70  },
  { key: "supplier",               label: "Supplier",              minW: 90  },
  { key: "buyerAtSource",          label: "Buyer",                 minW: 80  },
  { key: "dateOfPurchase",         label: "Date of Purchase",      minW: 90  },
  { key: "shape",                  label: "Shape",                 minW: 60  },
  { key: "weight",                 label: "Weight (ct)",           minW: 70  },
  { key: "certificateNo",          label: "Cert. No.",             minW: 80  },
  { key: "pricePerCaratUSD",       label: "Price/ct (USD)",        minW: 85  },
  { key: "gstPercent",             label: "GST %",                 minW: 50  },
  { key: "gstAmount",              label: "GST Amt",               minW: 70  },
  { key: "buyPriceTotal",          label: "Buy Price Total",       minW: 90  },
  { key: "purchaseCurrency",       label: "Currency",              minW: 60  },
  { key: "rateAtPurchase",         label: "Rate (USD/INR)",        minW: 85  },
  { key: "basePriceINR",           label: "Base (INR)",            minW: 85  },
  { key: "correctionPriceUSD",     label: "Correction (USD)",      minW: 90  },
  { key: "actualRate",             label: "Actual Rate",           minW: 75  },
  { key: "actualPriceINR",         label: "Actual Price (INR)",    minW: 95  },
  { key: "marketPL",               label: "Market P/L",            minW: 75  },
  { key: "markup",                 label: "Mark Up",               minW: 60  },
  { key: "sellPriceLocalCurrency", label: "Sell Price (Local)",    minW: 95  },
  { key: "localCurrency",          label: "Local Currency",        minW: 80  },
  { key: "typeOfExchange",         label: "Bank",                  minW: 60  },
  { key: "paymentStatus",          label: "Payment Status",        minW: 85  },
  { key: "status",                 label: "Status",                minW: 70  },
  { key: "warehouse",              label: "Warehouse",             minW: 75  },
  { key: "inventoryDate",          label: "Inventory Date",        minW: 85  },
  { key: "inventoryManager",       label: "Inv. Manager",          minW: 80  },
  { key: "synthesis",              label: "Synthesis",             minW: 70  },
  { key: "cut",                    label: "Cut",                   minW: 50  },
  { key: "carat",                  label: "Ct",                    minW: 45  },
  { key: "colour",                 label: "Colour",                minW: 55  },
  { key: "clarity",                label: "Clarity",               minW: 55  },
  { key: "priceRUB",               label: "Price (RUB)",           minW: 80  },
  { key: "priceUSD",               label: "Price (USD)",           minW: 80  },
  { key: "pricePerCt",             label: "Price/ct",              minW: 65  },
  { key: "rateRUB",                label: "Rate (USD/RUB)",        minW: 85  },
  { key: "location",               label: "Location",              minW: 70  },
  { key: "laboratory",             label: "Laboratory",            minW: 70  },
  { key: "length",                 label: "Length (mm)",           minW: 70  },
  { key: "width",                  label: "Width (mm)",            minW: 65  },
  { key: "height",                 label: "Height (mm)",           minW: 65  },
  { key: "dateOfSale",             label: "Date of Sale",          minW: 85  },
  { key: "buyerName",              label: "Final Buyer",           minW: 85  },
  { key: "saleAmount",             label: "Sale Amount",           minW: 80  },
  { key: "saleCurrency",           label: "Sale Currency",         minW: 75  },
  { key: "rateOnDateOfSale",       label: "Rate on Sale",          minW: 80  },
  { key: "saleBaseINR",            label: "Base Currency (INR)",   minW: 100 },
  { key: "marginality",            label: "Marginality",           minW: 75  },
  { key: "actualMarkup",           label: "Actual Markup",         minW: 80  },
  { key: "manager",                label: "Manager",               minW: 70  },
  { key: "bonusPoints",            label: "Bonus Pts",             minW: 65  },
  { key: "bonusAmount",            label: "Bonus Amt",             minW: 70  },
  { key: "bonusRate",              label: "Rate (Bonus)",          minW: 75  },
  { key: "bonusInLocalCurrency",   label: "Bonus (Local)",         minW: 80  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCellValue(key, value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "object" && value.label) return value.label;
  if (typeof value === "object" && value.name)  return value.name;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  }
  return value;
}

function buildMatrix(rows, columns) {
  const headers = columns.map(c => c.label);
  const body    = rows.map(row =>
    columns.map(col => getCellValue(col.key, row[col.key]))
  );
  return { headers, body };
}

function makeFileName(label, ext) {
  const ts = new Date().toISOString().slice(0, 10);
  return `${label}_${ts}.${ext}`;
}

// ── Excel export ──────────────────────────────────────────────────────────────

export function exportExcel(rows, label = "transactions") {
  const { headers, body } = buildMatrix(rows, EXPORT_COLUMNS);
  const wsData = [headers, ...body];
  const ws     = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"]   = headers.map(h => ({ wch: Math.max(h.length + 4, 12) }));
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transactions");
  XLSX.writeFile(wb, makeFileName(label, "xlsx"));
}

// ── PDF: lazy script loader ───────────────────────────────────────────────────

async function loadJsPDF() {
  if (window._jsPDFLoaded) return;

  const loadScript = (src) =>
    new Promise((res, rej) => {
      const s   = document.createElement("script");
      s.src     = src;
      s.onload  = res;
      s.onerror = () => rej(new Error(`Failed to load: ${src}`));
      document.head.appendChild(s);
    });

  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js");

  window._jsPDFLoaded = true;
}

// ── PDF: measure column widths from actual data ───────────────────────────────
// For each column, take the max character count across header + all data rows,
// multiply by a per-pt character width, then clamp to the column's minW.
// No upper cap — columns expand freely so text never needs to wrap.

const PT_PER_CHAR = 5.5; // at fontSize 8, helvetica ≈ 5.5pt per char
const CELL_PAD    = 12;  // 6pt left + 6pt right padding

function calcColumnWidths(columns, body) {
  return columns.map((col, i) => {
    const headerLen  = col.label.length;
    const maxDataLen = body.reduce((max, row) => {
      const v = row[i];
      return Math.max(max, v == null ? 0 : String(v).length);
    }, 0);
    const measured = Math.max(headerLen, maxDataLen) * PT_PER_CHAR + CELL_PAD;
    return Math.max(measured, col.minW ?? 60);
  });
}

// ── PDF export ────────────────────────────────────────────────────────────────

export async function exportPDF(rows, label = "transactions") {
  try {
    await loadJsPDF();
  } catch (err) {
    alert("Failed to load PDF library. Check your internet connection.\n\n" + err.message);
    return;
  }

  const { jsPDF } = window.jspdf;
  const { headers, body } = buildMatrix(rows, EXPORT_COLUMNS);

  // Page width expands to fit every column at its natural width
  const MARGIN     = 24;
  const colWidths  = calcColumnWidths(EXPORT_COLUMNS, body);
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const PAGE_W     = tableWidth + MARGIN * 2;
  const PAGE_H     = 1587; // A2 height in pt — more rows per page

  const doc = new jsPDF({
    orientation: "landscape",
    unit:        "pt",
    format:      [PAGE_W, PAGE_H],
  });

  // ── Banner ───────────────────────────────────────────────────────────────
  const now = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, PAGE_W, 50, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Diamond Management — Transactions", 28, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(191, 219, 254);
  doc.text(
    `${rows.length} record${rows.length !== 1 ? "s" : ""}  ·  Exported ${now}`,
    28, 44
  );

  // ── Table ────────────────────────────────────────────────────────────────
  doc.autoTable({
    head: [headers],
    body,
    startY: 58,
    margin: { left: MARGIN, right: MARGIN },

    // Each column gets its individually calculated width
    columnStyles: Object.fromEntries(
      colWidths.map((w, i) => [i, { cellWidth: w }])
    ),

    styles: {
      fontSize:    8,
      cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
      overflow:    "hidden",    // no wrapping, no ellipsis — just clean single-line rows
      lineColor:   [226, 232, 240],
      lineWidth:   0.4,
      textColor:   [51, 65, 85],
      font:        "helvetica",
      minCellHeight: 18,
    },
    headStyles: {
      fillColor:     [30, 64, 175],
      textColor:     [255, 255, 255],
      fontStyle:     "bold",
      fontSize:      8,
      overflow:      "hidden",
      minCellHeight: 22,
      valign:        "middle",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },

    didDrawPage: (data) => {
      const currentPage = data.pageNumber;
      const pageCount   = doc.internal.getNumberOfPages();
      const pageH       = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${currentPage} of ${pageCount}`,
        PAGE_W / 2,
        pageH - 12,
        { align: "center" }
      );
    },
  });

  doc.save(makeFileName(label, "pdf"));
}