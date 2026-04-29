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

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const synth = (r.synthesis || "").trim().toUpperCase();
      if (segFilter === "CVD"  && synth !== "CVD")  return false;
      if (segFilter === "HPHT" && synth !== "HPHT") return false;
      return dateInRange(r, dateFrom, dateTo);
    });
  }, [rows, segFilter, dateFrom, dateTo]);

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

  const isPositive = totalMargin == null ? null : totalMargin >= 0;

  return (
    <div className="min-h-screen bg-[#f5f6fa] font-[DM_Sans,sans-serif]">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-enter { animation: fadeUp 0.22s ease both; }
        .stat-divider { width: 1px; background: #e2e8f0; align-self: stretch; margin: 0; }
      `}</style>

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30"
           style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>

        {/* Top row: title + controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">

          {/* Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-slate-900 leading-tight">Profit &amp; Loss</h1>
              <p className="text-[10.5px] text-slate-400 leading-tight">
                {segFilter === "all" ? "All synthesis types" : `Synthesis: ${segFilter}`}
                {(dateFrom || dateTo) && ` · ${dateFrom || "…"} → ${dateTo || "now"}`}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">

            {/* Synthesis segmented control — refined pill style */}
            <div
              className="flex items-center rounded-full p-[3px] gap-0.5"
              style={{ background: "#eef0f6", border: "1px solid #e2e8f0" }}
            >
              {[
                { val: "all",  label: "All" },
                { val: "CVD",  label: "CVD" },
                { val: "HPHT", label: "HPHT" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => { setSegFilter(val); setDrillType(null); }}
                  style={{
                    padding: "4px 13px",
                    fontSize: "11.5px",
                    fontWeight: segFilter === val ? 600 : 500,
                    borderRadius: "99px",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                    transition: "all 0.15s ease",
                    background: segFilter === val ? "#fff" : "transparent",
                    color: segFilter === val ? "#1e293b" : "#94a3b8",
                    boxShadow: segFilter === val ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Date range */}
            <div
              className="flex items-center gap-2 rounded-full px-3 py-[5px]"
              style={{ background: "#eef0f6", border: "1px solid #e2e8f0" }}
            >
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  fontSize: "11px", border: "none", background: "transparent",
                  color: dateFrom ? "#1e293b" : "#94a3b8", outline: "none",
                  fontFamily: "DM Sans, sans-serif", width: "95px",
                }}
              />
              <span style={{ color: "#cbd5e1", fontSize: "11px" }}>→</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  fontSize: "11px", border: "none", background: "transparent",
                  color: dateTo ? "#1e293b" : "#94a3b8", outline: "none",
                  fontFamily: "DM Sans, sans-serif", width: "95px",
                }}
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={clearDates}
                  style={{
                    fontSize: "11px", color: "#94a3b8", background: "transparent",
                    border: "none", cursor: "pointer", padding: 0, fontFamily: "DM Sans, sans-serif",
                  }}
                  title="Clear dates"
                >✕</button>
              )}
            </div>
          </div>
        </div>

        {/* ── Inline stat bar ── */}
        <div
          className="flex items-stretch mt-4 rounded-md overflow-hidden"
          style={{ background: "#f8fafc", border: "1px solid #e8eaf0" }}
        >
          {/* Sell INR */}
          <div className="flex-1 px-5 py-3">
            <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>Total Sell (INR)</p>
            <p style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
              {totalSell != null ? fmt(totalSell) : "—"}
            </p>
          </div>

          <div className="stat-divider" />

          {/* Base INR */}
          <div className="flex-1 px-5 py-3">
            <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>Total Base (INR) </p>
            <p style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
              {totalBase != null ? fmt(totalBase) : "—"}
            </p>
          </div>

          <div className="stat-divider" />

          {/* Margin — highlighted */}
          <div
            className="flex-1 px-5 py-3 flex items-center justify-between"
            style={{
              background: isPositive === null ? "transparent"
                : isPositive ? "linear-gradient(90deg,#f0fdf4,#dcfce7)"
                : "linear-gradient(90deg,#fff1f2,#ffe4e6)",
            }}
          >
            <div>
              <p style={{ fontSize: "10px", color: isPositive === null ? "#94a3b8" : isPositive ? "#15803d" : "#be123c", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>
                Net Margin
              </p>
              <p style={{ fontSize: "17px", fontWeight: 700, color: isPositive === null ? "#0f172a" : isPositive ? "#15803d" : "#be123c", lineHeight: 1.2 }}>
                {totalMargin != null ? fmt(Math.abs(totalMargin)) : "—"}
              </p>
            </div>
            {totalPct != null && (
              <span
                style={{
                  fontSize: "12px", fontWeight: 700, padding: "3px 9px",
                  borderRadius: "99px",
                  background: isPositive ? "#bbf7d0" : "#fecdd3",
                  color: isPositive ? "#15803d" : "#be123c",
                }}
              >
                {fmtPct(totalPct)}
              </span>
            )}
          </div>

          <div className="stat-divider" />

          {/* Transactions */}
          <div className="px-5 py-3" style={{ minWidth: "110px" }}>
            <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>Transactions</p>
            <p style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
              {filtered.length}
              {rows.length !== filtered.length && (
                <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 400, marginLeft: "4px" }}>/ {rows.length}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-6 py-6">

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200">
            <div style={{ animation: "spin 0.7s linear infinite" }}
                 className="w-7 h-7 border-[3px] border-blue-600 border-t-transparent rounded-full mb-3" />
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
                ? `No transactions with synthesis "${segFilter}". Make sure the Synthesis field is filled in.`
                : "Try adjusting your filters or add transactions first."}
            </p>
          </div>
        )}

        {!loading && typeKeys.length > 0 && (
          <>
            {/* Diamond type cards */}
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
              {typeKeys.map((t, i) => {
                const tRows  = grouped[t];
                const sell   = sumField(tRows, "saleBaseINR");
                const base   = sumField(tRows, "basePriceINR");
                const margin = sell != null && base != null ? sell - base : null;
                const pct    = margin != null && base ? (margin / base) * 100 : null;
                const meta   = TYPE_META[t] || DEFAULT_META;
                const isActive = drillType === t;
                const pos = margin == null ? null : margin >= 0;

                return (
                  <button
                    key={t}
                    onClick={() => setDrillType(drillType === t ? null : t)}
                    className="card-enter text-left rounded-lg cursor-pointer overflow-hidden"
                    style={{
                      animationDelay: `${i * 40}ms`,
                      background: isActive ? meta.bg : "#fff",
                      border: isActive ? `2px solid ${meta.color}` : "1px solid #e8eaf0",
                      boxShadow: isActive
                        ? `0 0 0 3px ${meta.border}, 0 4px 12px rgba(0,0,0,0.06)`
                        : "0 1px 4px rgba(0,0,0,0.05)",
                      padding: "1rem 1.15rem 0.9rem",
                      outline: "none",
                      transition: "box-shadow 0.15s, border 0.15s, background 0.15s",
                    }}
                  >
                    {/* Accent bar */}
                    <div style={{ height: "3px", background: meta.color, margin: "-1rem -1.15rem 0.85rem", borderRadius: "0" }} />

                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                      <span style={{ fontSize: "12.5px", fontWeight: 600, color: meta.text }}>{t}</span>
                      <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: "99px", background: meta.border, color: meta.text }}>
                        {tRows.length}
                      </span>
                    </div>

                    <p style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
                      {sell != null ? fmt(sell) : "—"}
                    </p>
                    <p style={{ fontSize: "10.5px", color: "#94a3b8", marginTop: "2px" }}>
                      Base: {base != null ? fmt(base) : "—"}
                    </p>

                    {margin != null && (
                      <div style={{ marginTop: "10px", paddingTop: "9px", borderTop: `1px solid ${meta.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "10.5px", fontWeight: 500, color: meta.text }}>Margin</span>
                        <span style={{ fontSize: "11.5px", fontWeight: 700, color: pos ? "#15803d" : "#dc2626" }}>
                          {pos ? "▲" : "▼"} {fmt(Math.abs(margin))}
                          {pct != null && <span style={{ marginLeft: "4px", fontSize: "10px" }}>({fmtPct(pct)})</span>}
                        </span>
                      </div>
                    )}

                    <div style={{ marginTop: "8px", fontSize: "10.5px", fontWeight: 500, color: isActive ? meta.color : "#cbd5e1", display: "flex", alignItems: "center", gap: "3px" }}>
                      {isActive ? (
                        <><svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>Hide details</>
                      ) : (
                        <><svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>View transactions</>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

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