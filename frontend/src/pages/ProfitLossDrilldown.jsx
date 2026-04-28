import { useState, useMemo, useEffect, useRef } from "react";

function fmtINR(n) {
  if (n == null) return "—";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function fmtPct(n) {
  if (n == null) return "—";
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}

function fmtDate(val) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sumField(rows, key) {
  const vals = rows.map((r) => r[key]).filter((v) => v != null && !isNaN(v));
  return vals.length ? vals.reduce((a, b) => a + Number(b), 0) : null;
}

function dateInRange(row, from, to) {
  const d = row.dateOfPurchase || row.inventoryDate || row.dateOfSale;
  if (!d) return true;
  const dt = new Date(d);
  if (from && dt < new Date(from)) return false;
  if (to && dt > new Date(to + "T23:59:59")) return false;
  return true;
}

const SORT_KEYS = [
  { key: "dateOfPurchase", label: "Date" },
  { key: "basePriceINR",   label: "Base INR" },
  { key: "saleBaseINR",    label: "Sell INR" },
  { key: "marginality",    label: "Margin" },
];

export default function ProfitLossDrilldown({ typeName, meta, rows, onClose }) {
  const [drillFrom, setDrillFrom] = useState("");
  const [drillTo, setDrillTo]     = useState("");
  const [sortKey, setSortKey]     = useState("dateOfPurchase");
  const [sortDir, setSortDir]     = useState("desc");

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => dateInRange(r, drillFrom, drillTo));
  }, [rows, drillFrom, drillTo]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === "dateOfPurchase") {
        av = av ? new Date(av).getTime() : 0;
        bv = bv ? new Date(bv).getTime() : 0;
      } else {
        av = Number(av) || 0;
        bv = Number(bv) || 0;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const clearDates = () => { setDrillFrom(""); setDrillTo(""); };

  // Footer totals
  const totalBase   = sumField(sorted, "basePriceINR");
  const totalSell   = sumField(sorted, "saleBaseINR");
  const totalMargin = totalSell != null && totalBase != null ? totalSell - totalBase : null;
  const totalPct    = totalMargin != null && totalBase ? (totalMargin / totalBase) * 100 : null;

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey)
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="opacity-30">
          <path d="M12 5v14M5 12l7-7 7 7" strokeLinecap="round" />
        </svg>
      );
    return sortDir === "asc" ? (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 font-[DM_Sans,sans-serif]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw]  min-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* ── Modal header ── */}
        <div
          className="flex items-center justify-between px-6 py-[18px] flex-wrap gap-3 shrink-0"
          style={{ background: meta.bg, borderBottom: `1px solid ${meta.border}` }}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: meta.color }} />
            <span className="text-[15px] font-bold" style={{ color: meta.text }}>
              {typeName}
            </span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: meta.border, color: meta.text }}
            >
              {sorted.length} transaction{sorted.length !== 1 ? "s" : ""}
              {sorted.length !== rows.length && ` of ${rows.length}`}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Date filter */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>From</span>
              <input
                type="date"
                value={drillFrom}
                max={drillTo || undefined}
                onChange={(e) => setDrillFrom(e.target.value)}
                className="text-[11px] px-2 py-1 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-blue-400 font-[DM_Sans,sans-serif]"
              />
              <span>To</span>
              <input
                type="date"
                value={drillTo}
                min={drillFrom || undefined}
                onChange={(e) => setDrillTo(e.target.value)}
                className="text-[11px] px-2 py-1 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-blue-400 font-[DM_Sans,sans-serif]"
              />
              {(drillFrom || drillTo) && (
                <button
                  onClick={clearDates}
                  className="text-[11px] text-slate-400 hover:text-red-500 bg-transparent border-none cursor-pointer font-[DM_Sans,sans-serif] transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg border-none cursor-pointer transition-colors"
              style={{ background: meta.border, color: meta.text }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Table (scrollable) ── */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse font-[DM_Sans,sans-serif]" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 50 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 90 }} />
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-[0.05em]">
                  #
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap">
                  Ship No
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap">
                  SKU No
                </th>

                {/* Sortable: Date */}
                <th
                  className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.05em] whitespace-nowrap cursor-pointer select-none"
                  style={{ color: sortKey === "dateOfPurchase" ? meta.color : "#64748b" }}
                  onClick={() => handleSort("dateOfPurchase")}
                >
                  <span className="flex items-center gap-1">
                    Date <SortIcon colKey="dateOfPurchase" />
                  </span>
                </th>

                {/* Sortable: Base INR */}
                <th
                  className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.05em] whitespace-nowrap cursor-pointer select-none"
                  style={{ color: sortKey === "basePriceINR" ? meta.color : "#64748b" }}
                  onClick={() => handleSort("basePriceINR")}
                >
                  <span className="flex items-center gap-1">
                    Base INR <SortIcon colKey="basePriceINR" />
                  </span>
                </th>

                {/* Sortable: Sell INR */}
                <th
                  className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.05em] whitespace-nowrap cursor-pointer select-none"
                  style={{ color: sortKey === "saleBaseINR" ? meta.color : "#64748b" }}
                  onClick={() => handleSort("saleBaseINR")}
                >
                  <span className="flex items-center gap-1">
                    Sell INR <SortIcon colKey="saleBaseINR" />
                  </span>
                </th>

                {/* Sortable: Margin */}
                <th
                  className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.05em] whitespace-nowrap cursor-pointer select-none"
                  style={{ color: sortKey === "marginality" ? meta.color : "#64748b" }}
                  onClick={() => handleSort("marginality")}
                >
                  <span className="flex items-center gap-1">
                    Margin <SortIcon colKey="marginality" />
                  </span>
                </th>

                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap">
                  Margin %
                </th>
              </tr>
            </thead>

            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[13px] text-slate-400">
                    {drillFrom || drillTo
                      ? "No transactions in the selected date range."
                      : "No transactions found."}
                  </td>
                </tr>
              ) : (
                sorted.map((row, i) => {
                  const base   = row.basePriceINR;
                  const sell   = row.saleBaseINR;
                  const margin = sell != null && base != null ? sell - base : null;
                  const pct    = margin != null && base ? (margin / base) * 100 : null;
                  const isEven = i % 2 === 0;

                  return (
                    <tr
                      key={row._id || i}
                      className="border-b border-slate-100 hover:bg-blue-50 transition-colors duration-75"
                      style={{ background: isEven ? "#fff" : "#f8fafc" }}
                    >
                      <td className="px-3 py-2.5 text-[11px] text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                        {row.shippingNo || "—"}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap overflow-hidden text-ellipsis">
                        <span className="text-xs font-semibold text-blue-600">{row.skuNo || "—"}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">
                        {fmtDate(row.dateOfPurchase || row.inventoryDate)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {fmtINR(base)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {fmtINR(sell)}
                      </td>
                      <td
                        className="px-3 py-2.5 text-xs font-semibold tabular-nums whitespace-nowrap"
                        style={{ color: margin == null ? "#94a3b8" : margin >= 0 ? "#16a34a" : "#dc2626" }}
                      >
                        {margin != null ? (margin >= 0 ? "▲ " : "▼ ") : ""}
                        {margin != null ? fmtINR(Math.abs(margin)) : "—"}
                      </td>
                      <td
                        className="px-3 py-2.5 text-xs font-semibold tabular-nums whitespace-nowrap"
                        style={{ color: pct == null ? "#94a3b8" : pct >= 0 ? "#16a34a" : "#dc2626" }}
                      >
                        {fmtPct(pct)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer totals ── */}
        {sorted.length > 0 && (
          <div
            className="flex items-center justify-between px-6 py-3 flex-wrap gap-3 flex-shrink-0"
            style={{ background: meta.bg, borderTop: `1px solid ${meta.border}` }}
          >
            <span className="text-[11px]" style={{ color: meta.text }}>
              {sorted.length} transaction{sorted.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-5 flex-wrap">
              <div className="text-[11px]" style={{ color: meta.text }}>
                Base: <span className="font-semibold">{fmtINR(totalBase)}</span>
              </div>
              <div className="text-[11px]" style={{ color: meta.text }}>
                Sell: <span className="font-semibold">{fmtINR(totalSell)}</span>
              </div>
              <div
                className="text-[12px] font-bold"
                style={{ color: totalMargin == null ? meta.text : totalMargin >= 0 ? "#16a34a" : "#dc2626" }}
              >
                {totalMargin != null ? (totalMargin >= 0 ? "▲ " : "▼ ") : ""}
                {totalMargin != null ? fmtINR(Math.abs(totalMargin)) : "—"}
                {totalPct != null && (
                  <span className="ml-1 text-[11px]">({fmtPct(totalPct)})</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}