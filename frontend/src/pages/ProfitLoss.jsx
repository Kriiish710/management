import { useState, useEffect, useMemo } from "react";
import ProfitLossDrilldown from "./ProfitLossDrilldown";

const API = import.meta.env.VITE_API_URL;

const TYPE_META = {
  Certified:    { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
  Noncertified: { color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc", text: "#0e7490" },
  Natural:      { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
  Miele:        { color: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff", text: "#6d28d9" },
  Produced:     { color: "#db2777", bg: "#fdf2f8", border: "#fbcfe8", text: "#be185d" },
  Unknown:      { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", text: "#475569" },
};

const DEFAULT_META = { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", text: "#475569" };

// Always group by diamondType, never by synthesis
function getDiamondTypeLabel(row) {
  const dt = row.diamondType;
  if (dt) {
    const label = typeof dt === "object" ? (dt.label || dt.name || "") : String(dt);
    if (label.trim()) return label.trim();
  }
  return "Unknown";
}

function sumField(rows, key) {
  const vals = rows.map((r) => r[key]).filter((v) => v != null && !isNaN(v));
  return vals.length ? vals.reduce((a, b) => a + Number(b), 0) : null;
}

function fmt(n) {
  if (n == null) return "—";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function fmtPct(n) {
  if (n == null) return "";
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}

function dateInRange(row, from, to) {
  const d = row.dateOfPurchase || row.inventoryDate || row.dateOfSale;
  if (!d) return true;
  const dt = new Date(d);
  if (from && dt < new Date(from)) return false;
  if (to && dt > new Date(to + "T23:59:59")) return false;
  return true;
}

function MetricCard({ label, value, sub, colorClass }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex-1 min-w-[140px]">
      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-[18px] font-bold leading-tight ${colorClass || "text-slate-900"}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ProfitLoss() {
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [segFilter, setSegFilter] = useState("all");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");
  const [drillType, setDrillType] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/transactions`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setRows(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Step 1: filter by synthesis tab (CVD / HPHT / all) + date ─────────────
  // CVD tab  → only rows where synthesis === "CVD"  (case-insensitive)
  // HPHT tab → only rows where synthesis === "HPHT" (case-insensitive)
  // All tab  → no synthesis filter
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const synth = (r.synthesis || "").trim().toUpperCase();
      if (segFilter === "CVD"  && synth !== "CVD")  return false;
      if (segFilter === "HPHT" && synth !== "HPHT") return false;
      return dateInRange(r, dateFrom, dateTo);
    });
  }, [rows, segFilter, dateFrom, dateTo]);

  // ── Step 2: group the filtered rows by their diamondType ──────────────────
  // Cards always show: Certified, Noncertified, Natural, Miele, Produced
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      const t = getDiamondTypeLabel(r);
      if (!map[t]) map[t] = [];
      map[t].push(r);
    });
    return map;
  }, [filtered]);

  const totalSell   = sumField(filtered, "saleBaseINR");
  const totalBase   = sumField(filtered, "basePriceINR");
  const totalMargin = totalSell != null && totalBase != null ? totalSell - totalBase : null;
  const totalPct    = totalMargin != null && totalBase ? (totalMargin / totalBase) * 100 : null;

  const typeKeys = Object.keys(grouped).sort();

  const clearDates = () => { setDateFrom(""); setDateTo(""); };

  return (
    <div className="min-h-screen bg-slate-50 font-[DM_Sans,sans-serif]">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-7 py-4 sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-slate-900 leading-tight">Profit &amp; Loss</h1>
              <p className="text-[11px] text-slate-400">
                {segFilter === "all" ? "All synthesis types" : `Synthesis: ${segFilter}`}
                {(dateFrom || dateTo) && ` · ${dateFrom || "..."} → ${dateTo || "now"}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">

            {/* Synthesis tabs — filter by synthesis, cards still show diamondType */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-0.5">
              {[
                { val: "all",  label: "All types" },
                { val: "CVD",  label: "CVD" },
                { val: "HPHT", label: "HPHT" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => { setSegFilter(val); setDrillType(null); }}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-md border-none cursor-pointer font-[DM_Sans,sans-serif] transition-all duration-150 ${
                    segFilter === val
                      ? "bg-white text-slate-900 shadow-sm"
                      : "bg-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-2 text-[12px] text-slate-500">
              <span>From</span>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-[11px] px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-blue-400 font-[DM_Sans,sans-serif]"
              />
              <span>To</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-[11px] px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-blue-400 font-[DM_Sans,sans-serif]"
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={clearDates}
                  className="text-[11px] text-slate-400 hover:text-red-500 bg-transparent border-none cursor-pointer font-[DM_Sans,sans-serif] transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary metrics */}
        <div className="flex gap-3 mt-4 flex-wrap">
          <MetricCard
            label="Total Sell (INR)"
            value={totalSell != null ? fmt(totalSell) : "—"}
          />
          <MetricCard
            label="Total Base (INR)"
            value={totalBase != null ? fmt(totalBase) : "—"}
          />
          <MetricCard
            label="Margin"
            value={totalMargin != null ? fmt(Math.abs(totalMargin)) : "—"}
            sub={totalPct != null ? fmtPct(totalPct) : undefined}
            colorClass={
              totalMargin == null ? "text-slate-900" : totalMargin >= 0 ? "text-green-600" : "text-red-600"
            }
          />
          <MetricCard
            label="Transactions"
            value={filtered.length}
            sub={rows.length !== filtered.length ? `of ${rows.length} total` : undefined}
          />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-7 py-6">

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200">
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ animation: "spin 0.7s linear infinite" }} className="w-7 h-7 border-[3px] border-blue-600 border-t-transparent rounded-full mb-3" />
            <p className="text-[13px] text-slate-400">Loading transactions...</p>
          </div>
        )}

        {!loading && typeKeys.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-slate-900 mb-1">No transactions found</p>
            <p className="text-[13px] text-slate-400">
              {segFilter !== "all"
                ? `No transactions have synthesis set to "${segFilter}". Make sure the Synthesis field is filled in on your transactions.`
                : "Try adjusting your filters or add transactions first."}
            </p>
          </div>
        )}

        {!loading && typeKeys.length > 0 && (
          <>
            {/* Diamond type cards */}
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
              {typeKeys.map((t) => {
                const tRows  = grouped[t];
                const sell   = sumField(tRows, "saleBaseINR");
                const base   = sumField(tRows, "basePriceINR");
                const margin = sell != null && base != null ? sell - base : null;
                const pct    = margin != null && base ? (margin / base) * 100 : null;
                const meta   = TYPE_META[t] || DEFAULT_META;
                const isActive = drillType === t;

                return (
                  <button
                    key={t}
                    onClick={() => setDrillType(drillType === t ? null : t)}
                    className="text-left rounded-2xl cursor-pointer transition-all duration-150 overflow-hidden"
                    style={{
                      background: isActive ? meta.bg : "#fff",
                      border:     isActive ? `2px solid ${meta.color}` : "1px solid #e2e8f0",
                      boxShadow:  isActive ? `0 0 0 3px ${meta.border}` : "0 1px 3px rgba(0,0,0,0.04)",
                      padding:    "1.1rem 1.25rem",
                      outline:    "none",
                    }}
                  >
                    {/* Color bar */}
                    <div className="h-[3px] -mx-5 -mt-4 mb-3 rounded-t" style={{ background: meta.color }} />

                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                      <span className="text-[13px] font-semibold" style={{ color: meta.text }}>{t}</span>
                      <span
                        className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: meta.border, color: meta.text }}
                      >
                        {tRows.length}
                      </span>
                    </div>

                    <p className="text-[18px] font-bold text-slate-900 leading-tight">
                      {sell != null ? fmt(sell) : "—"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Base: {base != null ? fmt(base) : "—"}
                    </p>

                    {margin != null && (
                      <div
                        className="mt-3 pt-2.5 border-t flex items-center justify-between"
                        style={{ borderColor: meta.border }}
                      >
                        <span className="text-[11px] font-medium" style={{ color: meta.text }}>Margin</span>
                        <span
                          className="text-[12px] font-bold"
                          style={{ color: margin >= 0 ? "#16a34a" : "#dc2626" }}
                        >
                          {margin >= 0 ? "▲" : "▼"} {fmt(Math.abs(margin))}
                          {pct != null && (
                            <span className="ml-1 text-[10px] font-semibold">({fmtPct(pct)})</span>
                          )}
                        </span>
                      </div>
                    )}

                    <div
                      className="mt-2 text-[11px] font-medium flex items-center gap-1"
                      style={{ color: isActive ? meta.color : "#94a3b8" }}
                    >
                      {isActive ? (
                        <>
                          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                          Hide details
                        </>
                      ) : (
                        <>
                          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                          View transactions
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Drilldown panel */}
            {drillType && (
              <ProfitLossDrilldown
                typeName={drillType}
                meta={TYPE_META[drillType] || DEFAULT_META}
                rows={grouped[drillType] || []}
                onClose={() => setDrillType(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}