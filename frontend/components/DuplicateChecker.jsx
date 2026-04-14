export default function DuplicateChecker({ duplicates, newCount, onSkip, onCancel }) {
  return (
    <div className="fixed inset-0 bg-slate-900/45 flex items-center justify-center z-[9999] font-[DM_Sans,sans-serif]">
      <div className="bg-white rounded-2xl w-[520px] max-w-[calc(100vw-32px)] shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-[38px] h-[38px] rounded-[10px] bg-amber-50 flex items-center justify-center shrink-0">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>
            <div>
              <div className="text-[15px] font-semibold text-slate-900">Duplicate Records Found</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {duplicates.length} SKU{duplicates.length !== 1 ? "s" : ""} already exist in the database
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex border-b border-slate-100">
          <div className="flex-1 px-6 py-3.5 border-r border-slate-100">
            <div className="text-[11px] text-slate-400 uppercase tracking-[0.05em] mb-1">Already Exists</div>
            <div className="text-[22px] font-bold text-amber-600">{duplicates.length}</div>
          </div>
          <div className="flex-1 px-6 py-3.5">
            <div className="text-[11px] text-slate-400 uppercase tracking-[0.05em] mb-1">New to Import</div>
            <div className="text-[22px] font-bold text-green-600">{newCount}</div>
          </div>
        </div>

        {/* Duplicate SKU list */}
        <div className="px-6 pt-3.5 pb-1.5">
          <div className="text-xs font-medium text-slate-500 mb-2">Duplicate SKUs:</div>
          <div className="max-h-40 overflow-y-auto flex flex-wrap gap-1.5 pr-1">
            {duplicates.map((sku) => (
              <span
                key={sku}
                className="bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5 text-xs font-medium"
              >
                {sku}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pt-4 pb-5 flex items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-[18px] py-[9px] text-[13px] font-medium bg-white border border-slate-200 rounded-[9px] text-slate-500 cursor-pointer font-[DM_Sans,sans-serif] hover:bg-slate-50 transition-colors"
          >
            Cancel Import
          </button>

          {newCount > 0 ? (
            <button
              onClick={onSkip}
              className="px-[18px] py-[9px] text-[13px] font-semibold bg-blue-600 border-none rounded-[9px] text-white cursor-pointer font-[DM_Sans,sans-serif] hover:bg-blue-700 transition-colors"
            >
              Import {newCount} New Only
            </button>
          ) : (
            <span className="text-[13px] text-slate-400">Nothing new to import.</span>
          )}
        </div>
      </div>
    </div>
  );
}