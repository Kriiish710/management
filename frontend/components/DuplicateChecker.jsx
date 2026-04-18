import { useState, useMemo } from "react";

// Fields the server computes — never count a diff on these
const COMPUTED_FIELDS = new Set([
  "gstAmount", "buyPriceTotal", "basePriceINR", "actualPriceINR",
  "marketPL", "sellPriceLocalCurrency", "priceRUB", "priceUSD", "pricePerCt",
  "rateAtPurchase", "rateRUB", "bonusRate", "saleBaseINR", "marginality",
  "actualMarkup", "bonusAmount", "bonusInLocalCurrency",
  "_id", "__v", "createdAt", "updatedAt",
]);

// Normalise a value to a comparable primitive so we can diff reliably
function normalise(key, val) {
  if (val === undefined || val === null || val === "") return "";

  // Populated mongoose objects — compare by their _id string
  if (typeof val === "object" && val._id) return String(val._id);

  // Dates — compare as ISO date strings (YYYY-MM-DD) so time offsets don't cause false positives
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/.test(val)) return val.slice(0, 10);
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

  // Numbers — round to 6 dp to avoid floating-point noise
  if (typeof val === "number") return Math.round(val * 1e6) / 1e6;

  return String(val).trim();
}

// Returns true if the incoming Excel row differs from the existing DB record
function hasChanges(incomingRow, existingRecord) {
  for (const key of Object.keys(incomingRow)) {
    if (COMPUTED_FIELDS.has(key)) continue;
    const a = normalise(key, incomingRow[key]);
    const b = normalise(key, existingRecord[key]);
    if (a !== b) return true;
  }
  return false;
}

export default function DuplicateChecker({
  duplicates,          // string[]  — all duplicate SKU numbers
  duplicateRows = [],  // object[]  — incoming Excel mapped rows for those SKUs
  existingDbRows = [], // object[]  — current DB records for those SKUs
  newCount,
  onSkip,
  onCancel,
  onUpdate,
}) {
  const [updating, setUpdating] = useState(false);

  // Build a map: skuNo → existing DB record for O(1) lookup
  const existingMap = useMemo(() => {
    const m = {};
    existingDbRows.forEach(r => { if (r.skuNo) m[String(r.skuNo).trim()] = r; });
    return m;
  }, [existingDbRows]);

  // Split duplicate rows into changed vs unchanged
  const { changedRows, unchangedSkus } = useMemo(() => {
    const changed = [];
    const unchanged = [];
    duplicateRows.forEach(row => {
      const existing = existingMap[String(row.skuNo).trim()];
      if (!existing || hasChanges(row, existing)) {
        changed.push(row);
      } else {
        unchanged.push(row.skuNo);
      }
    });
    return { changedRows: changed, unchangedSkus: unchanged };
  }, [duplicateRows, existingMap]);

  const changedCount = changedRows.length;
  const unchangedCount = unchangedSkus.length;

  const handleUpdate = async (alsoImportNew = false) => {
    if (!onUpdate) return;
    setUpdating(true);
    await onUpdate(changedRows, alsoImportNew);
    setUpdating(false);
  };

  // Decide what the primary action label should say
  const updateLabel = changedCount > 0
    ? `Update ${changedCount} Transaction${changedCount !== 1 ? "s" : ""}`
    : null;

  const importAllLabel = newCount > 0 && changedCount > 0
    ? `Update ${changedCount} + Import ${newCount}`
    : null;

  return (
    <div className="fixed inset-0 bg-slate-900/45 flex items-center justify-center z-[9999] font-[DM_Sans,sans-serif]">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="bg-white rounded-2xl w-[560px] max-w-[calc(100vw-32px)] shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-[38px] h-[38px] rounded-[10px] bg-amber-50 flex items-center justify-center shrink-0">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
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
          <div className="flex-1 px-5 py-3.5 border-r border-slate-100">
            <div className="text-[10px] text-slate-400 uppercase tracking-[0.05em] mb-1">New to Import</div>
            <div className="text-[20px] font-bold text-green-600">{newCount}</div>
          </div>
          <div className="flex-1 px-5 py-3.5 border-r border-slate-100">
            <div className="text-[10px] text-slate-400 uppercase tracking-[0.05em] mb-1">Data Changed</div>
            <div className="text-[20px] font-bold text-blue-600">{changedCount}</div>
          </div>
          <div className="flex-1 px-5 py-3.5">
            <div className="text-[10px] text-slate-400 uppercase tracking-[0.05em] mb-1">No Change</div>
            <div className="text-[20px] font-bold text-slate-400">{unchangedCount}</div>
          </div>
        </div>

        {/* SKU breakdown */}
        <div className="px-6 pt-4 pb-2 space-y-3 max-h-64 overflow-y-auto">

          {/* Changed SKUs */}
          {changedCount > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em]">
                  Updated data — will overwrite
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {changedRows.map(r => (
                  <span key={r.skuNo}
                    className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                    {r.skuNo}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Unchanged SKUs */}
          {unchangedCount > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.05em]">
                  Identical — no update needed
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {unchangedSkus.map(sku => (
                  <span key={sku}
                    className="bg-slate-50 text-slate-400 border border-slate-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                    {sku}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info note — only when there are changes to apply */}
        {changedCount > 0 && (
          <div className="mx-6 mt-2 mb-1 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 flex gap-2.5 items-start">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={2} className="shrink-0 mt-[1px]">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8h.01M12 12v4" />
            </svg>
            <p className="text-[12px] text-blue-700 leading-relaxed m-0">
              Only the <strong>{changedCount}</strong> changed record{changedCount !== 1 ? "s" : ""} will be updated.
              All computed fields will be recalculated automatically by the server.
            </p>
          </div>
        )}

        {/* No-op notice — all duplicates are identical and nothing is new */}
        {changedCount === 0 && newCount === 0 && (
          <div className="mx-6 mt-2 mb-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 flex gap-2.5 items-start">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2} className="shrink-0 mt-[1px]">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8h.01M12 12v4" />
            </svg>
            <p className="text-[12px] text-slate-500 leading-relaxed m-0">
              All records in this file are identical to what's already in the database. There is nothing to import or update.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pt-4 pb-5 flex items-center justify-between gap-2">
          <button
            onClick={onCancel}
            disabled={updating}
            className="px-[18px] py-[9px] text-[13px] font-medium bg-white border border-slate-200 rounded-[9px] text-slate-500 cursor-pointer font-[DM_Sans,sans-serif] hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 flex-wrap justify-end">

            {/* Import new only */}
            {newCount > 0 && changedCount === 0 && (
              <button
                onClick={onSkip}
                disabled={updating}
                className="px-[18px] py-[9px] text-[13px] font-semibold bg-blue-600 border-none rounded-[9px] text-white cursor-pointer font-[DM_Sans,sans-serif] hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Import {newCount} New
              </button>
            )}

            {/* Import new only (secondary, when there are also changes) */}
            {newCount > 0 && changedCount > 0 && (
              <button
                onClick={onSkip}
                disabled={updating}
                className="px-[18px] py-[9px] text-[13px] font-medium bg-white border border-slate-200 rounded-[9px] text-slate-600 cursor-pointer font-[DM_Sans,sans-serif] hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Import {newCount} New Only
              </button>
            )}

            {/* Update changed only */}
            {updateLabel && (
              <button
                onClick={() => handleUpdate(false)}
                disabled={updating}
                className="flex items-center gap-1.5 px-[18px] py-[9px] text-[13px] font-semibold bg-blue-600 border-none rounded-[9px] text-white cursor-pointer font-[DM_Sans,sans-serif] hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}
                      style={{ animation: "spin 0.7s linear infinite" }}>
                      <circle cx="12" cy="12" r="10" strokeOpacity=".3" />
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                    </svg>
                    Updating…
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {updateLabel}
                  </>
                )}
              </button>
            )}

            {/* Update changed + import new */}
            {importAllLabel && (
              <button
                onClick={() => handleUpdate(true)}
                disabled={updating}
                className="px-[18px] py-[9px] text-[13px] font-semibold bg-slate-800 border-none rounded-[9px] text-white cursor-pointer font-[DM_Sans,sans-serif] hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {importAllLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}