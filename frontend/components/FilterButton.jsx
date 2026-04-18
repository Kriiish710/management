import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Check, SlidersHorizontal, TrendingUp, TrendingDown } from "lucide-react";

export const DEFAULT_FILTERS = {
  skuNo: "",
  shippingNo: "",
  supplier: "",
  courier: "",
  dateFrom: "",
  dateTo: "",
  direction: "",          // "in" | "out" | ""
  status: [],
  paymentStatus: [],
  shape: [],
  purchaseCurrency: [],
  laboratory: [],
  warehouse: [],
};

/**
 * FilterButton (slide-over panel)
 *
 * Props:
 *   open       – boolean
 *   onClose    – () => void
 *   filters    – object (shape: DEFAULT_FILTERS)
 *   onChange   – (nextFilters) => void
 *   onReset    – () => void
 *   rows       – the full transactions array (used to derive unique chip values)
 */
function FilterButton({ open, onClose, filters, onChange, onReset, rows = [] }) {
  const overlayRef = useRef(null);
  const [expanded, setExpanded] = useState({});

  const toggle = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ── Unique values from real data (falls back to static list) ─────────────

  function unique(key) {
    const fromData = [...new Set(
      rows.map((r) => {
        const v = r[key];
        if (!v) return null;
        if (typeof v === "object") return v.label || v.name || null;
        return String(v);
      }).filter(Boolean)
    )];
    const FALLBACKS = {
      status:           ["In Stock", "Sold", "Pending", "Hold", "Delivery", "Invoice", "Inventory", "Local office"],
      paymentStatus:    ["Paid", "Pending"],
      shape:            ["Round", "Oval", "Princess", "Cushion", "Emerald", "Pear", "Marquise", "Heart", "Radiant"],
      purchaseCurrency: ["USD", "INR", "RUB", "EUR", "AED"],
      laboratory:       ["GIA", "IGI", "HRD", "AGS", "GCAL"],
      warehouse:        ["Dubai", "Moscow", "Singapore", "Mumbai"],
      supplier:         [],
      courier:          [],
    };
    return fromData.length > 0 ? fromData : (FALLBACKS[key] || []);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const toggleMulti = (key, val) => {
    const cur = filters[key] || [];
    onChange({
      ...filters,
      [key]: cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val],
    });
  };

  const totalActive = Object.entries(filters).reduce((n, [k, v]) => {
    if (["skuNo", "shippingNo", "supplier", "courier", "direction"].includes(k))
      return n + (v ? 1 : 0);
    if (k === "dateFrom" || k === "dateTo") return n + (v ? 1 : 0);
    return n + (Array.isArray(v) ? v.length : 0);
  }, 0);

  // ── Styles ────────────────────────────────────────────────────────────────

  const inputCls =
    "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white outline-none " +
    "focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition placeholder-gray-400";
  const labelCls = "block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

  // ── Collapsible multi-select ──────────────────────────────────────────────

  const CollapsibleMulti = ({ label, optionKey }) => {
    const opts = unique(optionKey);
    const sel = filters[optionKey] || [];
    const isOpen = expanded[optionKey];
    if (!opts.length) return null;

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggle(optionKey)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">{label}</span>
            {sel.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                {sel.length}
              </span>
            )}
          </div>
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
            <div className="flex flex-wrap gap-1.5">
              {opts.map((opt) => {
                const active = sel.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => toggleMulti(optionKey, opt)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      background: active ? "#2563EB" : "#ffffff",
                      color: active ? "white" : "#374151",
                      border: active ? "1px solid #2563EB" : "1px solid #e5e7eb",
                    }}
                  >
                    {active && <Check size={10} />}
                    {opt}
                  </button>
                );
              })}
            </div>
            {sel.length > 0 && (
              <button
                onClick={() => onChange({ ...filters, [optionKey]: [] })}
                className="mt-2.5 text-[11px] text-red-400 hover:text-red-600 font-semibold cursor-pointer transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Clear {label}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {open && (
        <div
          ref={overlayRef}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-[2px]"
        />
      )}

      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out"
        style={{
          width: 400,
          transform: open ? "translateX(0)" : "translateX(100%)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0"
          style={{ background: "#1E40AF" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <SlidersHorizontal size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-white m-0 leading-tight">
                Filter Transactions
              </h2>
              {totalActive > 0 && (
                <p className="text-[11px] text-white/65 m-0 font-medium">
                  {totalActive} filter{totalActive > 1 ? "s" : ""} active
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 border-none flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* SKU No */}
          <div>
            <label className={labelCls}>SKU No.</label>
            <input
              type="text"
              placeholder="e.g. SKU-0001"
              value={filters.skuNo}
              onChange={(e) => onChange({ ...filters, skuNo: e.target.value })}
              className={inputCls}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>

          {/* Shipping No */}
          <div>
            <label className={labelCls}>Shipping No.</label>
            <input
              type="text"
              placeholder="e.g. SHP-2024-001"
              value={filters.shippingNo}
              onChange={(e) => onChange({ ...filters, shippingNo: e.target.value })}
              className={inputCls}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>

          {/* Supplier */}
          <div>
            <label className={labelCls}>Supplier</label>
            <div className="relative">
              <select
                value={filters.supplier}
                onChange={(e) => onChange({ ...filters, supplier: e.target.value })}
                className={inputCls + " appearance-none pr-8 cursor-pointer"}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <option value="">All Suppliers</option>
                {unique("supplier").map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Courier */}
          <div>
            <label className={labelCls}>Courier</label>
            <div className="relative">
              <select
                value={filters.courier}
                onChange={(e) => onChange({ ...filters, courier: e.target.value })}
                className={inputCls + " appearance-none pr-8 cursor-pointer"}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <option value="">All Couriers</option>
                {unique("courier").map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Date of Purchase */}
          <div>
            <label className={labelCls}>Date of Purchase</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-1.5 font-medium">From</p>
                <input
                  type="date"
                  value={filters.dateFrom}
                  max={filters.dateTo || undefined}
                  onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
                  className={inputCls}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1.5 font-medium">To</p>
                <input
                  type="date"
                  value={filters.dateTo}
                  min={filters.dateFrom || undefined}
                  onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
                  className={inputCls}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>
            </div>
          </div>

          {/* Payment direction */}
          <div>
            <label className={labelCls}>Payment Direction</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "in",  Icon: TrendingUp  },
                { id: "out", Icon: TrendingDown },
              ].map(({ id, Icon }) => {
                const active = filters.direction === id;
                const isIn = id === "in";
                return (
                  <button
                    key={id}
                    onClick={() => onChange({ ...filters, direction: active ? "" : id })}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      background: active ? (isIn ? "#dcfce7" : "#fee2e2") : "#f9fafb",
                      color:      active ? (isIn ? "#15803d" : "#dc2626") : "#374151",
                      border:     active
                        ? `1.5px solid ${isIn ? "#86efac" : "#fca5a5"}`
                        : "1px solid #e5e7eb",
                    }}
                  >
                    <Icon size={12} />
                    {isIn ? "Credit / In" : "Debit / Out"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Collapsible multi-selects */}
          <CollapsibleMulti label="Status"            optionKey="status"           />
          <CollapsibleMulti label="Payment Status"    optionKey="paymentStatus"    />
          <CollapsibleMulti label="Shape"             optionKey="shape"            />
          <CollapsibleMulti label="Purchase Currency" optionKey="purchaseCurrency" />
          <CollapsibleMulti label="Laboratory"        optionKey="laboratory"       />
          <CollapsibleMulti label="Warehouse"         optionKey="warehouse"        />

        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-200 px-6 py-4 flex items-center gap-3 bg-gray-50">
          <button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors cursor-pointer border-none"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            ↺ Reset
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors cursor-pointer"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <X size={14} /> Close
          </button>
        </div>
      </div>
    </>
  );
}

export default FilterButton;