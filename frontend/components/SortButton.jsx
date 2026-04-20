import React, { useState, useEffect, useRef } from "react";
import { X, ArrowUpDown, ArrowUp, ArrowDown, GripVertical, RotateCcw } from "lucide-react";

/**
 * SortButton — slide-over panel for multi-column sorting
 *
 * Props:
 *   open       – boolean
 *   onClose    – () => void
 *   columns    – COLUMNS array from Sample (key + label)
 *   sortRules  – array of { key, dir } — active sort rules (ordered)
 *   onChange   – (nextRules) => void
 *   onReset    – () => void
 */
function SortButton({ open, onClose, columns = [], sortRules = [], onChange, onReset }) {
  const overlayRef = useRef(null);
  const [search, setSearch] = useState("");
  const dragSrc = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const activeKeys = new Set(sortRules.map(r => r.key));

  const filteredColumns = columns.filter(
    c =>
      !activeKeys.has(c.key) &&
      c.label.toLowerCase().includes(search.toLowerCase())
  );

  const addRule = (col) => {
    onChange([...sortRules, { key: col.key, dir: "asc" }]);
    setSearch("");
  };

  const removeRule = (key) => {
    onChange(sortRules.filter(r => r.key !== key));
  };

  const toggleDir = (key) => {
    onChange(sortRules.map(r => r.key === key ? { ...r, dir: r.dir === "asc" ? "desc" : "asc" } : r));
  };

  const handleReset = () => {
    onChange([]);
    onReset?.();
  };

  // ── Drag-to-reorder active rules ──────────────────────────────────────────

  const handleRuleDragStart = (e, key) => {
    dragSrc.current = key;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleRuleDragOver = (e, key) => {
    e.preventDefault();
    if (key !== dragSrc.current) setDragOver(key);
  };

  const handleRuleDrop = (e, targetKey) => {
    e.preventDefault();
    const src = dragSrc.current;
    if (!src || src === targetKey) { setDragOver(null); return; }
    const next = [...sortRules];
    const from = next.findIndex(r => r.key === src);
    const to = next.findIndex(r => r.key === targetKey);
    next.splice(from, 1);
    next.splice(to, 0, sortRules[from]);
    onChange(next);
    dragSrc.current = null;
    setDragOver(null);
  };

  const handleRuleDragEnd = () => {
    dragSrc.current = null;
    setDragOver(null);
  };

  const getColLabel = (key) => columns.find(c => c.key === key)?.label ?? key;

  // ── Styles ────────────────────────────────────────────────────────────────

  const inputCls =
    "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white outline-none " +
    "focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition placeholder-gray-400";

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
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0"
          style={{ background: "#1E40AF" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <ArrowUpDown size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-white m-0 leading-tight">
                Sort Transactions
              </h2>
              {sortRules.length > 0 && (
                <p className="text-[11px] text-white/65 m-0 font-medium">
                  {sortRules.length} sort rule{sortRules.length > 1 ? "s" : ""} active
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

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Active sort rules */}
          {sortRules.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Sort order
                {sortRules.length > 1 && (
                  <span className="ml-1 text-gray-400 normal-case font-normal">
                    — drag to reorder priority
                  </span>
                )}
              </p>
              <div className="space-y-2">
                {sortRules.map((rule, idx) => {
                  const isOver = dragOver === rule.key;
                  return (
                    <div
                      key={rule.key}
                      draggable
                      onDragStart={e => handleRuleDragStart(e, rule.key)}
                      onDragOver={e => handleRuleDragOver(e, rule.key)}
                      onDrop={e => handleRuleDrop(e, rule.key)}
                      onDragEnd={handleRuleDragEnd}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all"
                      style={{
                        background: isOver ? "#eff6ff" : "#f8fafc",
                        border: isOver ? "1.5px solid #93c5fd" : "1px solid #e2e8f0",
                        cursor: "grab",
                      }}
                    >
                      {/* Priority badge */}
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                        style={{ background: "#2563eb", color: "#fff" }}
                      >
                        {idx + 1}
                      </div>

                      {/* Drag handle */}
                      <GripVertical size={13} className="text-gray-300 flex-shrink-0" />

                      {/* Label */}
                      <span className="flex-1 text-[13px] font-medium text-gray-700 truncate">
                        {getColLabel(rule.key)}
                      </span>

                      {/* Asc / Desc toggle */}
                      <button
                        onClick={() => toggleDir(rule.key)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer"
                        style={{
                          background: "#fff",
                          border: "1px solid #e2e8f0",
                          color: "#374151",
                        }}
                      >
                        {rule.dir === "asc" ? (
                          <><ArrowUp size={11} /> A → Z</>
                        ) : (
                          <><ArrowDown size={11} /> Z → A</>
                        )}
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => removeRule(rule.key)}
                        className="w-6 h-6 rounded-md flex items-center justify-center border-none bg-transparent cursor-pointer text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {sortRules.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "#eff6ff" }}
              >
                <ArrowUpDown size={18} style={{ color: "#2563eb" }} />
              </div>
              <p className="m-0 text-[13px] font-medium text-gray-700 mb-1">No sort rules yet</p>
              <p className="m-0 text-[12px] text-gray-400">
                Pick a column below to start sorting
              </p>
            </div>
          )}

          <div className="h-px bg-gray-100" />

          {/* Column picker */}
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Add column
            </p>
            <div className="relative mb-3">
              <svg
                width="13" height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth={2}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              >
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search columns..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={inputCls}
                style={{ paddingLeft: "2rem", fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>

            {filteredColumns.length === 0 ? (
              <p className="text-[12px] text-gray-400 text-center py-4">
                {search ? "No columns match your search." : "All columns are already sorting."}
              </p>
            ) : (
              <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
                {filteredColumns.map(col => (
                  <button
                    key={col.key}
                    onClick={() => addRule(col)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] text-gray-700 bg-transparent border border-transparent hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all cursor-pointer text-left"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <span className="font-medium truncate">{col.label}</span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400 flex-shrink-0 ml-2">
                      <ArrowUp size={10} /> Add
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-gray-200 px-6 py-4 flex items-center gap-3 bg-gray-50">
          <button
            onClick={handleReset}
            disabled={sortRules.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors cursor-pointer border-none"
            style={{
              background: sortRules.length === 0 ? "#cbd5e1" : "#0f172a",
              cursor: sortRules.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            <RotateCcw size={13} /> Reset Sort
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

export default SortButton;