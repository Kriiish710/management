import { useMemo, useState, useRef, useEffect } from "react";

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250];

export default function Pagination({ total, page, pageSize, onPage, onPageSize }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const result = [];
    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);

    result.push(1);
    if (left > 2) result.push("...");
    for (let i = left; i <= right; i++) result.push(i);
    if (right < totalPages - 1) result.push("...");
    result.push(totalPages);

    return result;
  }, [page, totalPages]);

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-t border-slate-100 bg-slate-50">

      {/* Left — record count */}
      <span className="text-xs text-slate-400">
        {total === 0 ? (
          "No records"
        ) : (
          <>
            <span className="text-slate-600 font-semibold">
              {start}–{end}
            </span>{" "}
            of{" "}
            <span className="text-slate-600 font-semibold">
              {total}
            </span>{" "}
            records
          </>
        )}
      </span>

      {/* Center — pagination */}
      <div className="flex items-center gap-1">

        {/* Prev */}
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className={`flex items-center justify-center w-8 h-8 rounded-md border text-xs transition 
            ${page === 1
              ? "opacity-30 cursor-not-allowed border-slate-200"
              : "border-slate-200 hover:bg-slate-100"
            }`}
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={i} className="px-1 text-xs text-slate-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => p !== page && onPage(p)}
              className={`min-w-[32px] h-8 px-2 rounded-md text-xs border transition
                ${p === page
                  ? "bg-blue-600 text-white border-blue-600 font-semibold cursor-default"
                  : "border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className={`flex items-center justify-center w-8 h-8 rounded-md border text-xs transition 
            ${page === totalPages
              ? "opacity-30 cursor-not-allowed border-slate-200"
              : "border-slate-200 hover:bg-slate-100"
            }`}
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Right — custom dropdown */}
      <div ref={dropdownRef} className="relative flex items-center gap-2">
        <span className="text-xs text-slate-400">Rows</span>  

        {/* Trigger */}
        <button
          onClick={() => setOpen(prev => !prev)}
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-600 hover:bg-slate-100 transition"
        >
          {pageSize}
          <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute bottom-[110%] right-0 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50 min-w-[80px]">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                onClick={() => {
                  onPageSize(size);
                  onPage(1);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs transition
                  ${size === pageSize
                    ? "bg-blue-100 text-blue-600 font-semibold"
                    : "text-slate-600 hover:bg-blue-50"
                  }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}