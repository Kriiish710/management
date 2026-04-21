import { useState, useRef, useEffect, useCallback } from "react";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs";
import CreateTransactionModal from "./forms/CreateTransactionModal";
import EditTransactionModal from "./forms/EditTransactionModal";
import DuplicateChecker from "../components/DuplicateChecker";
import FilterButton, { DEFAULT_FILTERS } from "../components/FilterButton";
import SortButton from "../components/SortButton";
import Pagination from "../components/Pagination";
import { exportExcel, exportPDF } from "../utils/Exportutils";
  
const API = import.meta.env.VITE_API_URL; 

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap";
document.head.appendChild(fontLink);

const COLUMNS = [
  { key: "shippingNo", label: "Shipping No", type: "text" },
  { key: "skuNo", label: "SKU No.", type: "text" },
  { key: "courier", label: "Courier", type: "text" },
  { key: "supplier", label: "Supplier", type: "text" },
  { key: "buyerAtSource", label: "Buyer", type: "text" },
  { key: "dateOfPurchase", label: "Date of Purchase", type: "date" },
  { key: "shape", label: "Shape", type: "text" },
  { key: "weight", label: "Weight (ct)", type: "number" },
  { key: "certificateNo", label: "Cert. No.", type: "text" },
  { key: "pricePerCaratUSD", label: "Price/ct (USD)", type: "number" },
  { key: "gstPercent", label: "GST %", type: "number" },
  { key: "gstAmount", label: "GST Amt", type: "number", readOnly: true },
  { key: "buyPriceTotal", label: "Buy Price Total", type: "number", readOnly: true },
  { key: "purchaseCurrency", label: "Currency", type: "text" },
  { key: "rateAtPurchase", label: "Rate (USD/INR)", type: "number", readOnly: true },
  { key: "basePriceINR", label: "Base (INR)", type: "number", readOnly: true },
  { key: "correctionPriceUSD", label: "Correction (USD)", type: "number" },
  { key: "actualRate", label: "Actual Rate", type: "number" },
  { key: "actualPriceINR", label: "Actual Price (INR)", type: "number", readOnly: true },
  { key: "marketPL", label: "Market P/L", type: "number", readOnly: true },
  { key: "markup", label: "Mark Up", type: "number" },
  { key: "sellPriceLocalCurrency", label: "Sell Price (Local)", type: "number", readOnly: true },
  { key: "localCurrency", label: "Local Currency", type: "text" },
  { key: "typeOfExchange", label: "Bank", type: "bank" },
  { key: "paymentStatus", label: "Payment Status", type: "paymentStatus" },
  { key: "status", label: "Status", type: "status" },
  { key: "warehouse", label: "Warehouse", type: "text" },
  { key: "inventoryDate", label: "Inventory Date", type: "date" },
  { key: "inventoryManager", label: "Inv. Manager", type: "text" },
  { key: "synthesis", label: "Synthesis", type: "text" },
  { key: "cut", label: "Cut", type: "text" },
  { key: "carat", label: "Ct", type: "number" },
  { key: "colour", label: "Colour", type: "text" },
  { key: "clarity", label: "Clarity", type: "text" },
  { key: "priceRUB", label: "Price (RUB)", type: "number", readOnly: true },
  { key: "priceUSD", label: "Price (USD)", type: "number", readOnly: true },
  { key: "pricePerCt", label: "Price/ct", type: "number", readOnly: true },
  { key: "rateRUB", label: "Rate (USD/RUB)", type: "number", readOnly: true },
  { key: "location", label: "Location", type: "text" },
  { key: "laboratory", label: "Laboratory", type: "text" },
  { key: "length", label: "Length (mm)", type: "number" },
  { key: "width", label: "Width (mm)", type: "number" },
  { key: "height", label: "Height (mm)", type: "number" },
  { key: "dateOfSale", label: "Date of Sale", type: "date" },
  { key: "buyerName", label: "Final Buyer", type: "text" },
  { key: "saleAmount", label: "Sale Amount", type: "number" },
  { key: "saleCurrency", label: "Sale Currency", type: "text" },
  { key: "rateOnDateOfSale", label: "Rate on Sale", type: "number" },
  { key: "saleBaseINR", label: "Base Currency (INR)", type: "number", readOnly: true },
  { key: "marginality", label: "Marginality", type: "number", readOnly: true },
  { key: "actualMarkup", label: "Actual Markup", type: "number", readOnly: true },
  { key: "manager", label: "Manager", type: "text" },
  { key: "bonusPoints", label: "Bonus Pts", type: "number" },
  { key: "bonusAmount", label: "Bonus Amt", type: "number", readOnly: true },
  { key: "bonusRate", label: "Rate (Bonus)", type: "number" },
  { key: "bonusInLocalCurrency", label: "Bonus (Local)", type: "number", readOnly: true },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLabel(value) {
  if (!value) return "";
  if (typeof value === "object" && value.label) return value.label;
  if (typeof value === "object" && value.name) return value.name;
  return String(value);
}

const STATUS_STYLES = {
  "In Stock": { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  "Sold": { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  "Pending": { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  "Hold": { bg: "#faf5ff", color: "#7c3aed", border: "#e9d5ff" },
  "Delivery": { bg: "#ecfeff", color: "#0891b2", border: "#a5f3fc" },
  "Invoice": { bg: "#fdf2f8", color: "#db2777", border: "#fbcfe8" },
  "Invoce": { bg: "#fdf2f8", color: "#db2777", border: "#fbcfe8" },
  "Inventory": { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" },
  "Stock": { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  "Local office": { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
  default: { bg: "#f8fafc", color: "#94a3b8", border: "#e2e8f0" },
};

const PAYMENT_STYLES = {
  "Paid": { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  "Pending": { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
  default: { bg: "#f8fafc", color: "#94a3b8", border: "#e2e8f0" },
};

function Badge({ value, styleMap }) {
  const label = getLabel(value);
  if (!label) return <span className="text-slate-300">—</span>;
  const s = styleMap[label] || styleMap.default;
  return (
    <span
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap"
    >
      {label}
    </span>
  );
}

const CURRENCY_KEYS = new Set([
  "pricePerCaratUSD", "gstAmount", "buyPriceTotal", "basePriceINR",
  "correctionPriceUSD", "actualPriceINR", "sellPriceLocalCurrency",
  "priceRUB", "priceUSD", "saleAmount", "saleBaseINR",
  "bonusAmount", "bonusInLocalCurrency", "marginality", "actualMarkup",
]);

function formatCell(key, value) {
  if (value === null || value === undefined || value === "") return <span className="text-slate-300">—</span>;
  if (key === "status") return <Badge value={value} styleMap={STATUS_STYLES} />;
  if (key === "paymentStatus") return <Badge value={value} styleMap={PAYMENT_STYLES} />;
  if (key === "skuNo") return <span className="text-blue-600 font-medium text-xs">{String(value)}</span>;
  if (key === "typeOfExchange") {
    const name = typeof value === "object" ? (value.name || "—") : String(value);
    return <span className="text-xs">{name || "—"}</span>;
  }
  if (key === "marketPL" && typeof value === "number") {
    const pos = value >= 0;
    return (
      <span className={`font-semibold text-xs ${pos ? "text-green-600" : "text-red-600"}`}>
        {pos ? "↑" : "↓"} {Math.abs(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </span>
    );
  }
  if (CURRENCY_KEYS.has(key) && typeof value === "number")
    return <span className="tabular-nums text-xs">{value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))
    return (
      <span className="text-xs">
        {new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </span>
    );
  if (typeof value === "number")
    return <span className="tabular-nums text-xs">{value.toLocaleString("en-IN", { maximumFractionDigits: 4 })}</span>;
  if (typeof value === "object" && value.label) return <span className="text-xs">{value.label}</span>;
  if (typeof value === "object" && value.name) return <span className="text-xs">{value.name}</span>;
  return <span className="text-xs">{String(value)}</span>;
}

function isMeasurementString(str) {
  if (!str || typeof str !== "string") return false;
  return /^[\d.]+\s*[*×xX]\s*[\d.]+\s*[*×xX]\s*[\d.]+$/.test(str.trim());
}

function parseMeasurement(str) {
  if (!str || typeof str !== "string") return {};
  const parts = str.trim().split(/[*×xX]/).map(p => parseFloat(p.trim()));
  const result = {};
  if (parts.length >= 1 && !isNaN(parts[0])) result.length = parts[0];
  if (parts.length >= 2 && !isNaN(parts[1])) result.width = parts[1];
  if (parts.length >= 3 && !isNaN(parts[2])) result.height = parts[2];
  return result;
}

function detectMeasurementColumnIndex(dataRows, fallback = 42) {
  const samplesToCheck = dataRows.slice(0, 20);
  for (let colIdx = 0; colIdx < 80; colIdx++) {
    const hits = samplesToCheck.filter(row => isMeasurementString(String(row[colIdx] ?? "")));
    if (hits.length > 0) return colIdx;
  }
  return fallback;
}

// ── Sort ──────────────────────────────────────────────────────────────────────

function applySort(rows, sortRules) {
  if (!sortRules || sortRules.length === 0) return rows;
  return [...rows].sort((a, b) => {
    for (const { key, dir } of sortRules) {
      let aVal = a[key];
      let bVal = b[key];
      if (aVal && typeof aVal === "object") aVal = aVal.label || aVal.name || "";
      if (bVal && typeof bVal === "object") bVal = bVal.label || bVal.name || "";
      const aEmpty = aVal == null || aVal === "";
      const bEmpty = bVal == null || bVal === "";
      if (aEmpty && bEmpty) continue;
      if (aEmpty) return 1;
      if (bEmpty) return -1;
      let cmp = 0;
      if (typeof aVal === "string" && typeof bVal === "string" && /^\d{4}-\d{2}-\d{2}/.test(aVal) && /^\d{4}-\d{2}-\d{2}/.test(bVal)) {
        cmp = new Date(aVal) - new Date(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: "base" });
      }
      if (cmp !== 0) return dir === "asc" ? cmp : -cmp;
    }
    return 0;
  });
}

function SortIndicator({ colKey, sortRules }) {
  const idx = sortRules.findIndex(r => r.key === colKey);
  if (idx === -1) return null;
  const rule = sortRules[idx];
  const priority = sortRules.length > 1 ? idx + 1 : null;
  return (
    <span className="inline-flex items-center gap-0.5 ml-1" style={{ color: "#2563eb", flexShrink: 0 }}>
      {priority && (
        <span className="inline-flex items-center justify-center rounded-full text-[9px] font-bold"
          style={{ width: 13, height: 13, background: "#2563eb", color: "#fff", lineHeight: 1 }}>
          {priority}
        </span>
      )}
      <svg width="9" height="12" viewBox="0 0 9 12" fill="currentColor">
        {rule.dir === "asc" ? (
          <><path d="M4.5 1 L8 5 H1 Z" /><path d="M1 8 H8 L4.5 11 Z" opacity="0.3" /></>
        ) : (
          <><path d="M4.5 1 L8 5 H1 Z" opacity="0.3" /><path d="M1 8 H8 L4.5 11 Z" /></>
        )}
      </svg>
    </span>
  );
}

// ── Export dropdown ───────────────────────────────────────────────────────────

function ExportDropdown({ onExportExcel, onExportPDF }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors font-[DM_Sans,sans-serif]"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 8l4 4 4-4M12 4v8" />
        </svg>
        Export
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="m-0 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Export all records</p>
          </div>
          <button
            onClick={() => { setOpen(false); onExportExcel(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-slate-700 bg-transparent border-none cursor-pointer hover:bg-slate-50 transition-colors font-[DM_Sans,sans-serif] text-left"
          >
            <span className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </span>
            <span>
              <span className="block font-medium">Excel (.xlsx)</span>
            </span>
          </button>
          <button
            onClick={() => { setOpen(false); onExportPDF(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-slate-700 bg-transparent border-none cursor-pointer hover:bg-slate-50 transition-colors font-[DM_Sans,sans-serif] text-left"
          >
            <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#dc2626" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </span>
            <span>
              <span className="block font-medium">PDF (.pdf)</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Floating selection bar ────────────────────────────────────────────────────

function SelectionBar({ count, onExportExcel, onExportPDF, onClear }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 font-[DM_Sans,sans-serif]">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[11px] font-bold">
          {count}
        </span>
        <span className="text-[13px] font-medium text-slate-300">
          {count === 1 ? "row selected" : "rows selected"}
        </span>
      </div>

      <div className="w-px h-5 bg-slate-700" />

      <button
        onClick={onExportExcel}
        className="flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-colors bg-emerald-600 hover:bg-emerald-700 text-white font-[DM_Sans,sans-serif]"
      >
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 8l4 4 4-4M12 4v8" />
        </svg>
        Excel
      </button>

      <button
        onClick={onExportPDF}
        className="flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-colors bg-red-600 hover:bg-red-700 text-white font-[DM_Sans,sans-serif]"
      >
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        PDF
      </button>

      <div className="w-px h-5 bg-slate-700" />

      <button
        onClick={onClear}
        className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-white bg-transparent border-none cursor-pointer transition-colors font-[DM_Sans,sans-serif]"
      >
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Clear
      </button>
    </div>
  );
}

// ── Checkbox ──────────────────────────────────────────────────────────────────

function Checkbox({ checked, indeterminate = false, onChange, onClick }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      onClick={onClick}
      className="w-[15px] h-[15px] rounded cursor-pointer"
      style={{ accentColor: "#2563eb" }}
    />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Sample() {
  const [rows, setRows] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [importLabel, setImportLabel] = useState("Importing to database...");
  const [fileName, setFileName] = useState("");
  const [search, setSearch] = useState("");
  const [editingRow, setEditingRow] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortRules, setSortRules] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [columnOrder, setColumnOrder] = useState(() => COLUMNS.map(c => c.key));
  const [dragOverKey, setDragOverKey] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [duplicateModal, setDuplicateModal] = useState(null);
  const dragSrcKey = useRef(null);
  const fileRef = useRef();

  const orderedColumns = columnOrder.map(k => COLUMNS.find(c => c.key === k));

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/transactions`).then(r => r.json());
      if (res.success) setRows(res.data);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  useEffect(() => { fetchTransactions(); }, []);

  // ── Pipeline ──────────────────────────────────────────────────────────────

  const filteredRows = rows
    .filter((row) => {
      if (filters.skuNo && !String(row.skuNo ?? "").toLowerCase().includes(filters.skuNo.toLowerCase())) return false;
      if (filters.shippingNo && !String(row.shippingNo ?? "").toLowerCase().includes(filters.shippingNo.toLowerCase())) return false;
      if (filters.supplier && row.supplier !== filters.supplier) return false;
      if (filters.courier && row.courier !== filters.courier) return false;
      if (filters.dateFrom && new Date(row.dateOfPurchase) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(row.dateOfPurchase) > new Date(filters.dateTo)) return false;
      if (filters.status.length && !filters.status.includes(getLabel(row.status))) return false;
      if (filters.paymentStatus.length && !filters.paymentStatus.includes(getLabel(row.paymentStatus))) return false;
      if (filters.shape.length && !filters.shape.includes(row.shape)) return false;
      if (filters.purchaseCurrency.length && !filters.purchaseCurrency.includes(row.purchaseCurrency)) return false;
      if (filters.laboratory.length && !filters.laboratory.includes(row.laboratory)) return false;
      if (filters.warehouse.length && !filters.warehouse.includes(row.warehouse)) return false;
      return true;
    })
    .filter((row) =>
      search ? COLUMNS.some(col => String(getLabel(row[col.key]) ?? "").toLowerCase().includes(search.toLowerCase())) : true
    );

  const sortedRows = applySort(filteredRows, sortRules);
  const displayRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search, filters, sortRules]);

  // ── Selection ─────────────────────────────────────────────────────────────

  const pageIds = displayRows.map(r => r._id).filter(Boolean);
  const selectedOnPage = pageIds.filter(id => selectedIds.has(id));
  const allPageSelected = pageIds.length > 0 && selectedOnPage.length === pageIds.length;
  const somePageSelected = selectedOnPage.length > 0 && !allPageSelected;

  const toggleRow = useCallback((id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const togglePageAll = useCallback(() => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach(id => next.delete(id));
      else pageIds.forEach(id => next.add(id));
      return next;
    });
  }, [allPageSelected, pageIds]);

  const clearSelection = () => setSelectedIds(new Set());
  const selectedRows = rows.filter(r => r._id && selectedIds.has(r._id));
  const hasSelection = selectedIds.size > 0;

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExportExcel = (rowsToExport) =>
    exportExcel(rowsToExport, rowsToExport.length < rows.length ? "transactions_selection" : "transactions_all");

  const handleExportPDF = (rowsToExport) =>
    exportPDF(rowsToExport, rowsToExport.length < rows.length ? "transactions_selection" : "transactions_all");

  // ── Excel import ──────────────────────────────────────────────────────────

  const excelDateToJS = (val) => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === "number") return new Date(Math.round((val - 25569) * 86400 * 1000));
    if (typeof val === "string" && val.trim() !== "") return new Date(val);
    return null;
  };

  const fetchMappingsFresh = async () => {
    let statusesList = [], paymentStatusesList = [];
    try {
      const [sRes, pRes] = await Promise.all([
        fetch(`${API}/statuses/active`).then(r => r.json()),
        fetch(`${API}/payment-statuses/active`).then(r => r.json()),
      ]);
      if (sRes.success) statusesList = sRes.data;
      if (pRes.success) paymentStatusesList = pRes.data;
    } catch (e) { console.error(e); }
    return { statusesList, paymentStatusesList };
  };

  const findId = (list, label) => {
    if (!label || !list.length) return undefined;
    const needle = String(label).trim().toLowerCase();
    const exact = list.find(s => s.label.toLowerCase() === needle);
    if (exact) return exact._id;
    const partial = list.find(s => needle.includes(s.label.toLowerCase()) || s.label.toLowerCase().includes(needle));
    return partial ? partial._id : undefined;
  };

  const mapExcelRow = (row, statusesList, paymentStatusesList, measurementColIdx) => {
    const n = (idx) => { const v = row[idx]; if (v == null || v === "") return undefined; if (typeof v === "string" && v.startsWith("=")) return undefined; const num = Number(v); return isNaN(num) ? undefined : num; };
    const s = (idx) => { const v = row[idx]; if (v == null) return ""; if (typeof v === "string" && v.startsWith("=")) return ""; return String(v); };
    const statusId = findId(statusesList, s(25));
    const paymentStatusId = findId(paymentStatusesList, s(24));
    const measurements = parseMeasurement(s(measurementColIdx));
    const result = {
      shippingNo: s(0), skuNo: s(1), courier: s(2), supplier: s(3), buyerAtSource: s(4),
      dateOfPurchase: excelDateToJS(row[5]), shape: s(6), weight: n(7), certificateNo: s(8),
      pricePerCaratUSD: n(9), gstPercent: n(10) ?? 0, purchaseCurrency: s(13) || "USD",
      correctionPriceUSD: n(16), actualRate: n(17), markup: n(20), localCurrency: s(22),
      typeOfExchange: s(23), warehouse: s(26), inventoryDate: excelDateToJS(row[27]),
      inventoryManager: s(28), synthesis: s(30), cut: s(31), carat: n(32), colour: s(33),
      clarity: s(34), location: s(39), laboratory: s(40),
      length: measurements.length, width: measurements.width, height: measurements.height,
      dateOfSale: excelDateToJS(row[44]), buyerName: s(45), saleAmount: n(46),
      saleCurrency: s(47), rateOnDateOfSale: n(48), manager: s(53), bonusPoints: n(54),
    };
    if (statusId) result.status = statusId;
    if (paymentStatusId) result.paymentStatus = paymentStatusId;
    Object.keys(result).forEach(k => { if (result[k] == null || result[k] === "") delete result[k]; });
    return result;
  };

  const runImport = async (mappedRows) => {
    setImportLabel("Importing to database...");
    setImporting(true);
    setImportProgress({ done: 0, total: mappedRows.length });
    let successCount = 0, errorCount = 0;
    const errors = [];
    for (let i = 0; i < mappedRows.length; i++) {
      try {
        const res = await fetch(`${API}/transactions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mappedRows[i]) });
        const data = await res.json();
        if (res.ok && data.success) successCount++;
        else { errorCount++; errors.push(`SKU ${mappedRows[i].skuNo}: ${data.message || "Unknown error"}`); }
      } catch (e) { errorCount++; errors.push(`SKU ${mappedRows[i].skuNo}: ${e.message}`); }
      setImportProgress({ done: i + 1, total: mappedRows.length });
    }
    let msg = `Import completed!\n✅ Success: ${successCount}\n❌ Failed: ${errorCount}`;
    if (errors.length) { msg += `\n\nErrors:\n${errors.slice(0, 5).join("\n")}`; if (errors.length > 5) msg += `\n... and ${errors.length - 5} more`; }
    alert(msg);
    setImporting(false);
    await fetchTransactions();
  };

  const parseExcel = async (file) => {
    setFileName(file.name);
    const { statusesList, paymentStatusesList } = await fetchMappingsFresh();
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: false, raw: false, cellFormula: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      const dataRows = data.slice(1);
      const validRows = dataRows.filter(row => row[1] && String(row[1]).trim() !== "");
      if (validRows.length === 0) { alert("No valid rows found with SKU numbers"); return; }
      const measurementColIdx = detectMeasurementColumnIndex(validRows);
      const mappedRows = validRows.map(row => mapExcelRow(row, statusesList, paymentStatusesList, measurementColIdx));
      let existingTransactions = [];
      try { const r = await fetch(`${API}/transactions`).then(x => x.json()); if (r.success) existingTransactions = r.data; } catch (e) { console.error(e); }
      const existingSkus = new Set(existingTransactions.map(r => String(r.skuNo ?? "").trim()).filter(Boolean));
      const duplicateSkus = mappedRows.map(r => r.skuNo).filter(sku => sku && existingSkus.has(String(sku).trim()));
      if (duplicateSkus.length > 0) {
        setDuplicateModal({
          duplicates: duplicateSkus,
          duplicateRows: mappedRows.filter(r => r.skuNo && existingSkus.has(String(r.skuNo).trim())),
          existingDbRows: existingTransactions.filter(t => t.skuNo && duplicateSkus.includes(String(t.skuNo).trim())),
          newRows: mappedRows.filter(r => r.skuNo && !existingSkus.has(String(r.skuNo).trim())),
        });
        return;
      }
      await runImport(mappedRows);
    } catch (error) { console.error(error); alert("Failed to import file: " + error.message); }
  };

  const handleFile = (file) => {
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) parseExcel(file);
    else alert("Please select an Excel file (.xlsx or .xls)");
  };

  // ── Duplicate handlers ────────────────────────────────────────────────────

  const handleDuplicateSkip = async () => {
    const { newRows } = duplicateModal; setDuplicateModal(null);
    if (newRows.length === 0) return;
    await runImport(newRows);
  };

  const handleDuplicateCancel = () => setDuplicateModal(null);

  const handleDuplicateUpdate = async (changedRows, alsoImportNew = false) => {
    const pendingNewRows = duplicateModal?.newRows ?? [];
    const existingDbRows = duplicateModal?.existingDbRows ?? [];
    setDuplicateModal(null);
    const existingIdMap = {};
    existingDbRows.forEach(t => { if (t.skuNo) existingIdMap[String(t.skuNo).trim()] = t._id; });
    const totalOps = changedRows.length + (alsoImportNew ? pendingNewRows.length : 0);
    if (totalOps === 0) return;
    setImportLabel(alsoImportNew ? "Updating & importing..." : "Updating existing records...");
    setImporting(true);
    setImportProgress({ done: 0, total: totalOps });
    let successCount = 0, errorCount = 0;
    const errors = [];
    for (let i = 0; i < changedRows.length; i++) {
      const row = changedRows[i];
      const id = existingIdMap[String(row.skuNo).trim()];
      if (!id) { errorCount++; errors.push(`SKU ${row.skuNo}: ID not found`); setImportProgress({ done: i + 1, total: totalOps }); continue; }
      try {
        const res = await fetch(`${API}/transactions/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(row) });
        const data = await res.json();
        if (res.ok && data.success) successCount++;
        else { errorCount++; errors.push(`SKU ${row.skuNo}: ${data.message || "Unknown error"}`); }
      } catch (e) { errorCount++; errors.push(`SKU ${row.skuNo}: ${e.message}`); }
      setImportProgress({ done: i + 1, total: totalOps });
    }
    if (alsoImportNew) {
      for (let i = 0; i < pendingNewRows.length; i++) {
        try {
          const res = await fetch(`${API}/transactions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pendingNewRows[i]) });
          const data = await res.json();
          if (res.ok && data.success) successCount++;
          else { errorCount++; errors.push(`SKU ${pendingNewRows[i].skuNo}: ${data.message}`); }
        } catch (e) { errorCount++; errors.push(`SKU ${pendingNewRows[i].skuNo}: ${e.message}`); }
        setImportProgress({ done: changedRows.length + i + 1, total: totalOps });
      }
    }
    setImporting(false);
    const verb = alsoImportNew ? "Update + Import" : "Update";
    let msg = `${verb} completed!\n✅ Success: ${successCount}\n❌ Failed: ${errorCount}`;
    if (errors.length) { msg += `\n\nErrors:\n${errors.slice(0, 5).join("\n")}`; if (errors.length > 5) msg += `\n... and ${errors.length - 5} more`; }
    alert(msg);
    await fetchTransactions();
  };

  // ── Row saves ─────────────────────────────────────────────────────────────

  const handleEditSave = (updated) =>
    setRows(prev => prev.map(r => r._id === updated._id ? updated : r));

  const handleCreateSave = (created, banksList) => {
    const patched = { ...created };
    if (patched.typeOfExchange && typeof patched.typeOfExchange === "string") {
      const match = banksList.find(b => b._id === patched.typeOfExchange);
      if (match) patched.typeOfExchange = match;
    }
    setRows(prev => [patched, ...prev]);
  };

  // ── Column drag ───────────────────────────────────────────────────────────

  const handleColDragStart = (e, key) => { dragSrcKey.current = key; e.dataTransfer.effectAllowed = "move"; };
  const handleColDragOver = (e, key) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (key !== dragSrcKey.current) setDragOverKey(key); };
  const handleColDragLeave = () => setDragOverKey(null);
  const handleColDrop = (e, targetKey) => {
    e.preventDefault();
    const srcKey = dragSrcKey.current;
    if (!srcKey || srcKey === targetKey) { setDragOverKey(null); return; }
    setColumnOrder(prev => {
      const next = [...prev], from = next.indexOf(srcKey), to = next.indexOf(targetKey);
      next.splice(from, 1); next.splice(to, 0, srcKey);
      return next;
    });
    dragSrcKey.current = null; setDragOverKey(null);
  };
  const handleColDragEnd = () => { dragSrcKey.current = null; setDragOverKey(null); };

  const handleHeaderClick = (key) => {
    if (dragSrcKey.current) return;
    setSortRules(prev => {
      const existing = prev.find(r => r.key === key);
      if (!existing) return [{ key, dir: "asc" }];
      if (existing.dir === "asc") return prev.map(r => r.key === key ? { ...r, dir: "desc" } : r);
      return prev.filter(r => r.key !== key);
    });
    setPage(1);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 font-[DM_Sans,sans-serif]">

      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-7 flex items-center justify-between h-[60px] sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 5v8l-8 5-8-5V8l8-5z" />
            </svg>
          </div>
          <div>
            <div className="text-[17px] font-bold text-slate-900 leading-tight">Transactions</div>
            {rows.length > 0 && (
              <div className="text-[11px] text-slate-400">
                Showing {filteredRows.length} of {rows.length} records
                {sortRules.length > 0 && <span className="ml-1.5 text-blue-500 font-medium">· sorted by {sortRules.length} column{sortRules.length > 1 ? "s" : ""}</span>}
                {hasSelection && <span className="ml-1.5 text-emerald-600 font-medium">· {selectedIds.size} selected</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {rows.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-[7px]">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="border-none bg-transparent text-[13px] text-slate-900 outline-none w-[140px] font-[DM_Sans,sans-serif]" />
            </div>
          )}

          <button onClick={() => setFilterOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-slate-600 bg-white border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50 transition-colors font-[DM_Sans,sans-serif]">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M11 20h2" /></svg>
            Filter
          </button>

          <button onClick={() => setSortOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border rounded-md cursor-pointer transition-colors font-[DM_Sans,sans-serif]"
            style={{ background: sortRules.length > 0 ? "#eff6ff" : "#fff", color: sortRules.length > 0 ? "#2563eb" : "#475569", borderColor: sortRules.length > 0 ? "#bfdbfe" : "#e2e8f0" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M6 12h12M10 18h4" /></svg>
            Sort
            {sortRules.length > 0 && (
              <span className="inline-flex items-center justify-center rounded-full text-[10px] font-bold"
                style={{ width: 16, height: 16, background: "#2563eb", color: "#fff" }}>
                {sortRules.length}
              </span>
            )}
          </button>


          {/* Export dropdown — only when nothing selected and data exists */}
          {!hasSelection && rows.length > 0 && (
            <ExportDropdown
              onExportExcel={() => handleExportExcel(sortedRows)}
              onExportPDF={() => handleExportPDF(sortedRows)}
            />
          )}

          <button onClick={() => fileRef.current.click()}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-slate-600 bg-white border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50 transition-colors font-[DM_Sans,sans-serif]">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4-4 4 4M12 8v8" /></svg>
            Import 
          </button>

          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={e => { handleFile(e.target.files[0]); e.target.value = ""; }} />

          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-white bg-blue-600 border-none rounded-md cursor-pointer hover:bg-blue-700 transition-colors font-[DM_Sans,sans-serif]">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Create
          </button>

        </div>


      </div>

      {/* Body */}
      <div className="px-7 py-5">

        {importing && (
          <div className="mb-4 bg-white rounded-xl border border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium text-slate-700">{importLabel}</span>
              <span className="text-xs text-slate-400">{importProgress.done} / {importProgress.total}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${importProgress.total ? (importProgress.done / importProgress.total) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {rows.length === 0 && !isLoading && !importing && (
          <div onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
            className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-20 px-5 text-center transition-all duration-200 ${isDragging ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white"}`}>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 5v8l-8 5-8-5V8l8-5z" /></svg>
            </div>
            <p className="m-0 mb-1.5 text-[15px] font-semibold text-slate-900">No transactions yet</p>
            <p className="m-0 mb-5 text-[13px] text-slate-400">Create one manually or import an Excel file</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white bg-blue-600 border-none rounded-[9px] cursor-pointer hover:bg-blue-700 font-[DM_Sans,sans-serif]">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Create Transaction
              </button>
              <button onClick={() => fileRef.current.click()} className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-slate-600 bg-white border border-slate-200 rounded-[9px] cursor-pointer hover:bg-slate-50 font-[DM_Sans,sans-serif]">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4-4 4 4M12 8v8" /></svg>
                Import Excel
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 px-5 bg-white rounded-2xl border border-slate-200">
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ animation: "spin 0.7s linear infinite" }} className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full mb-3" />
            <p className="m-0 text-[13px] text-slate-400">Loading transactions...</p>
          </div>
        )}

        {!isLoading && !importing && rows.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-[DM_Sans,sans-serif]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">

                    {/* Checkbox header */}
                    <th className="px-3 py-[11px] border-r border-slate-100 sticky left-0 bg-slate-50 z-20 w-10 text-center">
                      <Checkbox checked={allPageSelected} indeterminate={somePageSelected} onChange={togglePageAll} onClick={e => e.stopPropagation()} />
                    </th>

                    {/* # header — sticky just after checkbox column (left: 40px = w-10) */}
                    <th className="px-3.5 py-[11px] text-left text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap border-r border-slate-100 sticky bg-slate-50 z-20 select-none" style={{ left: 40 }}>
                      #
                    </th>

                    {orderedColumns.map(col => {
                      const isOver = dragOverKey === col.key;
                      const isSorted = sortRules.some(r => r.key === col.key);
                      return (
                        <th key={col.key} draggable
                          onDragStart={e => handleColDragStart(e, col.key)} onDragOver={e => handleColDragOver(e, col.key)}
                          onDragLeave={handleColDragLeave} onDrop={e => handleColDrop(e, col.key)} onDragEnd={handleColDragEnd}
                          onClick={() => handleHeaderClick(col.key)}
                          className="px-3.5 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[0.05em] whitespace-nowrap border-r border-slate-100 select-none"
                          style={{
                            cursor: "pointer",
                            background: isOver ? "#dbeafe" : isSorted ? "#eff6ff" : undefined,
                            color: isOver ? "#1d4ed8" : isSorted ? "#2563eb" : "#64748b",
                            borderLeft: isOver ? "2px solid #2563eb" : undefined,
                            borderBottom: isSorted ? "2px solid #2563eb" : undefined,
                            transition: "background 0.1s, color 0.1s",
                            userSelect: "none",
                          }}>
                          <span className="flex items-center gap-1.5">
                            <span style={{ display: "inline-flex", opacity: 0.35, flexShrink: 0, pointerEvents: "none" }}>
                              <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                                <circle cx="2" cy="2" r="1.1" /><circle cx="6" cy="2" r="1.1" />
                                <circle cx="2" cy="6" r="1.1" /><circle cx="6" cy="6" r="1.1" />
                                <circle cx="2" cy="10" r="1.1" /><circle cx="6" cy="10" r="1.1" />
                              </svg>
                            </span>
                            {col.label}
                            {col.readOnly && <span className="text-slate-300 font-normal normal-case text-[10px]">auto</span>}
                            <SortIndicator colKey={col.key} sortRules={sortRules} />
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {displayRows.length === 0 ? (
                    <tr>
                      <td colSpan={orderedColumns.length + 2} className="py-12 px-5 text-center text-[13px] text-slate-400">
                        {search ? <>No results for "<strong className="text-slate-600">{search}</strong>"</> : "No records match the active filters."}
                      </td>
                    </tr>
                  ) : displayRows.map((row, i) => {
                    const isSelected = !!(row._id && selectedIds.has(row._id));
                    const baseBg = isSelected ? "#eff6ff" : i % 2 === 0 ? "#fff" : "#f8fafc";
                    return (
                      <tr key={row._id || i}
                        className={`border-b border-slate-100 transition-colors duration-100 ${isSelected ? "bg-blue-50" : i % 2 === 0 ? "bg-white hover:bg-blue-50" : "bg-slate-50/60 hover:bg-blue-50"}`}
                        onClick={() => { if (!isSelected) setEditingRow(row); }}>

                        {/* Checkbox cell */}
                        <td className="px-3 py-2.5 border-r border-slate-100 sticky left-0 z-10 text-center cursor-default"
                          style={{ background: baseBg }} onClick={e => e.stopPropagation()}>
                          <Checkbox checked={isSelected} onChange={() => { }} onClick={e => toggleRow(row._id, e)} />
                        </td>

                        {/* Row number — sticky at left:40 matching header */}
                        <td className="px-3.5 py-2.5 text-xs text-slate-400 border-r border-slate-100 sticky z-10" style={{ left: 40, background: baseBg }}>
                          {(page - 1) * pageSize + i + 1}
                        </td>

                        {orderedColumns.map(col => (
                          <td key={col.key} className="px-3.5 py-2.5 border-r border-slate-100 whitespace-nowrap text-slate-700 cursor-pointer"
                            onClick={() => isSelected ? toggleRow(row._id, { stopPropagation: () => { } }) : setEditingRow(row)}>
                            {formatCell(col.key, row[col.key])}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination total={filteredRows.length} page={page} pageSize={pageSize}
              onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(1); }} />

            <div className="border-t border-slate-100 px-4 py-2 flex items-center justify-between bg-slate-50">
              <span className="text-xs text-slate-400">{fileName && <span>· {fileName}</span>}</span>
              <button onClick={fetchTransactions}
                className="flex items-center gap-1.5 text-xs text-slate-400 bg-transparent border-none cursor-pointer hover:text-blue-500 transition-colors font-[DM_Sans,sans-serif]">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating selection bar */}
      {hasSelection && (
        <SelectionBar count={selectedIds.size}
          onExportExcel={() => handleExportExcel(selectedRows)}
          onExportPDF={() => handleExportPDF(selectedRows)}
          onClear={clearSelection} />
      )}

      {/* Modals */}
      {showCreate && <CreateTransactionModal onSave={handleCreateSave} onClose={() => setShowCreate(false)} />}
      {editingRow && <EditTransactionModal transaction={editingRow} onSave={handleEditSave} onClose={() => setEditingRow(null)} />}

      {duplicateModal && (
        <DuplicateChecker
          duplicates={duplicateModal.duplicates} duplicateRows={duplicateModal.duplicateRows}
          existingDbRows={duplicateModal.existingDbRows} newCount={duplicateModal.newRows.length}
          onSkip={handleDuplicateSkip} onCancel={handleDuplicateCancel} onUpdate={handleDuplicateUpdate} />
      )}

      <FilterButton open={filterOpen} onClose={() => setFilterOpen(false)}
        filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} rows={rows} />

      <SortButton open={sortOpen} onClose={() => setSortOpen(false)}
        columns={COLUMNS} sortRules={sortRules} onChange={setSortRules} onReset={() => setSortRules([])} />
    </div>
  );
}