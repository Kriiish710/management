import { useState, useRef, useEffect } from "react";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs";
import CreateTransactionModal from "./forms/CreateTransactionModal";
import EditTransactionModal from "./forms/EditTransactionModal";
import DuplicateChecker from "../components/DuplicateChecker";

const API = "http://localhost:5000/api";

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
  "In Stock":     { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  "Sold":         { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  "Pending":      { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  "Hold":         { bg: "#faf5ff", color: "#7c3aed", border: "#e9d5ff" },
  "Delivery":     { bg: "#ecfeff", color: "#0891b2", border: "#a5f3fc" },
  "Invoice":      { bg: "#fdf2f8", color: "#db2777", border: "#fbcfe8" },
  "Invoce":       { bg: "#fdf2f8", color: "#db2777", border: "#fbcfe8" },
  "Inventory":    { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" },
  "Stock":        { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  "Local office": { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
  default:        { bg: "#f8fafc", color: "#94a3b8", border: "#e2e8f0" },
};

const PAYMENT_STYLES = {
  "Paid":    { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  "Pending": { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
  default:   { bg: "#f8fafc", color: "#94a3b8", border: "#e2e8f0" },
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

// ── Main Component ────────────────────────────────────────────────────────────

export default function Sample() {
  const [rows, setRows] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [fileName, setFileName] = useState("");
  const [search, setSearch] = useState("");
  const [editingRow, setEditingRow] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  // Draggable columns
  const [columnOrder, setColumnOrder] = useState(() => COLUMNS.map(c => c.key));
  const [dragOverKey, setDragOverKey] = useState(null);
  const dragSrcKey = useRef(null);

  // Duplicate import modal — null or { duplicates: string[], newRows: object[] }
  const [duplicateModal, setDuplicateModal] = useState(null);

  const fileRef = useRef();

  const orderedColumns = columnOrder.map(k => COLUMNS.find(c => c.key === k));

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/transactions`).then(r => r.json());
      if (res.success) setRows(res.data);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchTransactions(); }, []);

  // ── Excel helpers ─────────────────────────────────────────────────────────

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
    } catch (e) {
      console.error("Failed to fetch fresh mappings:", e);
    }
    return { statusesList, paymentStatusesList };
  };

  const findId = (list, label) => {
    if (!label || !list.length) return undefined;
    const needle = String(label).trim().toLowerCase();
    const exact = list.find(s => s.label.toLowerCase() === needle);
    if (exact) return exact._id;
    const partial = list.find(
      s => needle.includes(s.label.toLowerCase()) || s.label.toLowerCase().includes(needle)
    );
    if (partial) return partial._id;
    return undefined;
  };

  const mapExcelRow = (row, statusesList, paymentStatusesList, measurementColIdx) => {
    const n = (idx) => {
      const v = row[idx];
      if (v === undefined || v === null || v === "") return undefined;
      if (typeof v === "string" && v.startsWith("=")) return undefined;
      const num = Number(v);
      return isNaN(num) ? undefined : num;
    };
    const s = (idx) => {
      const v = row[idx];
      if (v === undefined || v === null) return "";
      if (typeof v === "string" && v.startsWith("=")) return "";
      return String(v);
    };

    const statusId = findId(statusesList, s(25));
    const paymentStatusId = findId(paymentStatusesList, s(24));
    const measurements = parseMeasurement(s(measurementColIdx));

    const result = {
      shippingNo:         s(0),
      skuNo:              s(1),
      courier:            s(2),
      supplier:           s(3),
      buyerAtSource:      s(4),
      dateOfPurchase:     excelDateToJS(row[5]),
      shape:              s(6),
      weight:             n(7),
      certificateNo:      s(8),
      pricePerCaratUSD:   n(9),
      gstPercent:         n(10) ?? 0,
      purchaseCurrency:   s(13) || "USD",
      correctionPriceUSD: n(16),
      actualRate:         n(17),
      markup:             n(20),
      localCurrency:      s(22),
      typeOfExchange:     s(23),
      warehouse:          s(26),
      inventoryDate:      excelDateToJS(row[27]),
      inventoryManager:   s(28),
      synthesis:          s(30),
      cut:                s(31),
      carat:              n(32),
      colour:             s(33),
      clarity:            s(34),
      location:           s(39),
      laboratory:         s(40),
      length:             measurements.length,
      width:              measurements.width,
      height:             measurements.height,
      dateOfSale:         excelDateToJS(row[44]),
      buyerName:          s(45),
      saleAmount:         n(46),
      saleCurrency:       s(47),
      rateOnDateOfSale:   n(48),
      manager:            s(53),
      bonusPoints:        n(54),
    };

    if (statusId) result.status = statusId;
    if (paymentStatusId) result.paymentStatus = paymentStatusId;

    Object.keys(result).forEach(key => {
      if (result[key] === undefined || result[key] === null || result[key] === "") {
        delete result[key];
      }
    });

    return result;
  };

  // ── Import logic ──────────────────────────────────────────────────────────

  // Runs the actual POST loop for a list of already-mapped rows
  const runImport = async (mappedRows) => {
    setImporting(true);
    setImportProgress({ done: 0, total: mappedRows.length });
    let successCount = 0, errorCount = 0;
    const errors = [];

    for (let i = 0; i < mappedRows.length; i++) {
      try {
        const response = await fetch(`${API}/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mappedRows[i]),
        });
        const responseData = await response.json();
        if (response.ok && responseData.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push(`SKU ${mappedRows[i].skuNo}: ${responseData.message || "Unknown error"}`);
        }
      } catch (e) {
        errorCount++;
        errors.push(`SKU ${mappedRows[i].skuNo}: ${e.message}`);
      }
      setImportProgress({ done: i + 1, total: mappedRows.length });
    }

    let message = `Import completed!\n✅ Success: ${successCount}\n❌ Failed: ${errorCount}`;
    if (errors.length > 0) {
      message += `\n\nErrors:\n${errors.slice(0, 5).join("\n")}`;
      if (errors.length > 5) message += `\n... and ${errors.length - 5} more`;
    }
    alert(message);
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

      if (validRows.length === 0) {
        alert("No valid rows found with SKU numbers");
        return;
      }

      const measurementColIdx = detectMeasurementColumnIndex(validRows);

      // Map all rows first (no DB writes yet)
      const mappedRows = validRows.map(row =>
        mapExcelRow(row, statusesList, paymentStatusesList, measurementColIdx)
      );

      // Fetch existing SKUs from DB to detect duplicates
      let existingSkus = new Set();
      try {
        const res = await fetch(`${API}/transactions`).then(r => r.json());
        if (res.success) {
          res.data.forEach(r => { if (r.skuNo) existingSkus.add(String(r.skuNo).trim()); });
        }
      } catch (e) {
        console.error("Could not fetch existing transactions for duplicate check:", e);
      }

      const duplicateSkus = mappedRows
        .map(r => r.skuNo)
        .filter(sku => sku && existingSkus.has(String(sku).trim()));

      const newMappedRows = mappedRows.filter(
        r => r.skuNo && !existingSkus.has(String(r.skuNo).trim())
      );

      if (duplicateSkus.length > 0) {
        // Hand off to the duplicate modal — user decides
        setDuplicateModal({ duplicates: duplicateSkus, newRows: newMappedRows });
        return;
      }

      // No duplicates — go straight to import
      await runImport(mappedRows);
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to import file: " + error.message);
    }
  };

  const handleFile = (file) => {
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) parseExcel(file);
    else alert("Please select an Excel file (.xlsx or .xls)");
  };

  // "Import New Only" — skip duplicates
  const handleDuplicateSkip = async () => {
    const { newRows } = duplicateModal;
    setDuplicateModal(null);
    if (newRows.length === 0) return;
    await runImport(newRows);
  };

  const handleDuplicateCancel = () => setDuplicateModal(null);

  // ── Row save handlers ─────────────────────────────────────────────────────

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

  // ── Search filter ─────────────────────────────────────────────────────────

  const filtered = rows.filter(row =>
    search
      ? COLUMNS.some(col => String(getLabel(row[col.key]) ?? "").toLowerCase().includes(search.toLowerCase()))
      : true
  );

  // ── Column drag handlers ──────────────────────────────────────────────────

  const handleColDragStart = (e, key) => {
    dragSrcKey.current = key;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleColDragOver = (e, key) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (key !== dragSrcKey.current) setDragOverKey(key);
  };

  const handleColDragLeave = () => setDragOverKey(null);

  const handleColDrop = (e, targetKey) => {
    e.preventDefault();
    const srcKey = dragSrcKey.current;
    if (!srcKey || srcKey === targetKey) { setDragOverKey(null); return; }
    setColumnOrder(prev => {
      const next = [...prev];
      const from = next.indexOf(srcKey);
      const to = next.indexOf(targetKey);
      next.splice(from, 1);
      next.splice(to, 0, srcKey);
      return next;
    });
    dragSrcKey.current = null;
    setDragOverKey(null);
  };

  const handleColDragEnd = () => {
    dragSrcKey.current = null;
    setDragOverKey(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 font-[DM_Sans,sans-serif]">

      {/* ── Top bar ── */}
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
                Showing {filtered.length} of {rows.length} records
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {rows.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-[7px]">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="border-none bg-transparent text-[13px] text-slate-900 outline-none w-[140px] font-[DM_Sans,sans-serif]"
              />
            </div>
          )}

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-white bg-blue-600 border-none rounded-lg cursor-pointer font-[DM_Sans,sans-serif] hover:bg-blue-700"
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create
          </button>

          <button
            onClick={() => fileRef.current.click()}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer font-[DM_Sans,sans-serif] hover:bg-slate-50"
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4-4 4 4M12 8v8" />
            </svg>
            Import Excel
          </button>

          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={e => { handleFile(e.target.files[0]); e.target.value = ""; }}
          />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-7 py-5">

        {/* Import progress bar */}
        {importing && (
          <div className="mb-4 bg-white rounded-xl border border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium text-slate-700">Importing to database...</span>
              <span className="text-xs text-slate-400">{importProgress.done} / {importProgress.total}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${importProgress.total ? (importProgress.done / importProgress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Empty state / file drop zone */}
        {rows.length === 0 && !isLoading && !importing && (
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
            className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-20 px-5 text-center transition-all duration-200 ${isDragging ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white"}`}
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 5v8l-8 5-8-5V8l8-5z" />
              </svg>
            </div>
            <p className="m-0 mb-1.5 text-[15px] font-semibold text-slate-900">No transactions yet</p>
            <p className="m-0 mb-5 text-[13px] text-slate-400">Create one manually or import an Excel file</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white bg-blue-600 border-none rounded-[9px] cursor-pointer font-[DM_Sans,sans-serif] hover:bg-blue-700"
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create Transaction
              </button>
              <button
                onClick={() => fileRef.current.click()}
                className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-slate-600 bg-white border border-slate-200 rounded-[9px] cursor-pointer font-[DM_Sans,sans-serif] hover:bg-slate-50"
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4-4 4 4M12 8v8" />
                </svg>
                Import Excel
              </button>
            </div>
          </div>
        )}

        {/* Loading spinner */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 px-5 bg-white rounded-2xl border border-slate-200">
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div
              style={{ animation: "spin 0.7s linear infinite" }}
              className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full mb-3"
            />
            <p className="m-0 text-[13px] text-slate-400">Loading transactions...</p>
          </div>
        )}

        {/* Data table */}
        {!isLoading && !importing && rows.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-[DM_Sans,sans-serif]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">

                    {/* Fixed row-number column */}
                    <th className="px-3.5 py-[11px] text-left text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap border-r border-slate-100 sticky left-0 bg-slate-50 z-20 select-none">
                      #
                    </th>

                    {/* Draggable column headers */}
                    {orderedColumns.map(col => {
                      const isOver = dragOverKey === col.key;
                      return (
                        <th
                          key={col.key}
                          draggable
                          onDragStart={e => handleColDragStart(e, col.key)}
                          onDragOver={e => handleColDragOver(e, col.key)}
                          onDragLeave={handleColDragLeave}
                          onDrop={e => handleColDrop(e, col.key)}
                          onDragEnd={handleColDragEnd}
                          className="px-3.5 py-[11px] text-left text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap border-r border-slate-100 select-none"
                          style={{
                            cursor: "grab",
                            background: isOver ? "#dbeafe" : undefined,
                            color: isOver ? "#1d4ed8" : undefined,
                            borderLeft: isOver ? "2px solid #2563eb" : undefined,
                            transition: "background 0.1s, color 0.1s",
                            userSelect: "none",
                          }}
                        >
                          <span className="flex items-center gap-1.5">
                            <span style={{ display: "inline-flex", opacity: 0.4, flexShrink: 0, pointerEvents: "none" }}>
                              <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                                <circle cx="2" cy="2" r="1.1" />
                                <circle cx="6" cy="2" r="1.1" />
                                <circle cx="2" cy="6" r="1.1" />
                                <circle cx="6" cy="6" r="1.1" />
                                <circle cx="2" cy="10" r="1.1" />
                                <circle cx="6" cy="10" r="1.1" />
                              </svg>
                            </span>
                            {col.label}
                            {col.readOnly && (
                              <span className="text-slate-300 font-normal normal-case text-[10px]">auto</span>
                            )}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={orderedColumns.length + 1}
                        className="py-12 px-5 text-center text-[13px] text-slate-400"
                      >
                        No results for "<strong className="text-slate-600">{search}</strong>"
                      </td>
                    </tr>
                  ) : filtered.map((row, i) => (
                    <tr
                      key={row._id || i}
                      onClick={() => setEditingRow(row)}
                      className={`border-b border-slate-100 cursor-pointer transition-colors duration-100 hover:bg-blue-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}
                    >
                      <td className="px-3.5 py-2.5 text-xs text-slate-400 border-r border-slate-100 sticky left-0 bg-inherit z-10">
                        {i + 1}
                      </td>
                      {orderedColumns.map(col => (
                        <td key={col.key} className="px-3.5 py-2.5 border-r border-slate-100 whitespace-nowrap text-slate-700">
                          {formatCell(col.key, row[col.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between bg-slate-50">
              <span className="text-xs text-slate-400">
                Showing{" "}
                <strong className="text-slate-600">{filtered.length}</strong> of{" "}
                <strong className="text-slate-600">{rows.length}</strong> records
                {fileName && <span className="ml-2.5 text-slate-300">· {fileName}</span>}
              </span>
              <button
                onClick={fetchTransactions}
                className="flex items-center gap-1.5 text-xs text-slate-400 bg-transparent border-none cursor-pointer font-[DM_Sans,sans-serif] hover:text-blue-500 transition-colors duration-150"
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreate && (
        <CreateTransactionModal
          onSave={handleCreateSave}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editingRow && (
        <EditTransactionModal
          transaction={editingRow}
          onSave={handleEditSave}
          onClose={() => setEditingRow(null)}
        />
      )}

      {duplicateModal && (
        <DuplicateChecker
          duplicates={duplicateModal.duplicates}
          newCount={duplicateModal.newRows.length}
          onSkip={handleDuplicateSkip}
          onCancel={handleDuplicateCancel}
        />
      )}
    </div>
  );
}