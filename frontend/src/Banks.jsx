import { useState, useEffect } from "react";

const API = `${import.meta.env.VITE_API_URL}/banks`;

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = {
  Bank: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11"/>
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
    </svg>
  ),
  Close: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
    </svg>
  ),
  Check: () => (
    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
    </svg>
  ),
};

// ─── RATE CHIP ────────────────────────────────────────────────────────────────
function RateChip({ label, value, bg, color }) {
  return (
    <div style={{ background: bg }} className="rounded-lg px-3 py-2 flex-1">
      <div style={{ color }} className="text-[10px] font-semibold opacity-60 uppercase tracking-[0.05em] mb-0.5">{label}</div>
      <div style={{ color }} className="text-[13px] font-bold tabular-nums">
        {value != null ? Number(value).toFixed(4) : "—"}
      </div>
    </div>
  );
}

// ─── BANK CARD ────────────────────────────────────────────────────────────────
function BankCard({ bank, onEdit, onDelete, onToggleActive }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`bg-white rounded-2xl overflow-hidden transition-shadow duration-200 font-[DM_Sans,sans-serif] ${
      bank.isActive ? "border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.05)]" : "border border-slate-100 shadow-none opacity-60"
    }`}>
      {/* Active stripe */}
      <div className={`h-[3px] ${bank.isActive ? "bg-blue-600" : "bg-slate-200"}`} />

      <div className="p-[18px]">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-[38px] h-[38px] rounded-xl flex items-center justify-center ${
              bank.isActive ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400"
            }`}>
              <Icon.Bank />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 mb-0.5">{bank.name}</div>
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                bank.isActive
                  ? "bg-blue-50 text-blue-600 border-blue-200"
                  : "bg-slate-50 text-slate-400 border-slate-200"
              }`}>
                {bank.isActive && <Icon.Check />}
                {bank.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => onToggleActive(bank)} title={bank.isActive ? "Deactivate" : "Activate"}
              className={`p-1.5 border-none bg-transparent cursor-pointer rounded-lg transition-colors duration-150 ${
                bank.isActive ? "text-amber-500 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"
              }`}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={bank.isActive
                  ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
              </svg>
            </button>
            <button onClick={() => onEdit(bank)}
              className="p-1.5 border-none bg-transparent cursor-pointer rounded-lg text-slate-500 hover:bg-slate-100 transition-colors duration-150">
              <Icon.Edit />
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                <span className="text-[11px] text-red-600 font-medium">Sure?</span>
                <button onClick={() => onDelete(bank._id)} className="text-[11px] font-bold text-red-600 border-none bg-transparent cursor-pointer font-[DM_Sans,sans-serif]">Yes</button>
                <button onClick={() => setConfirmDelete(false)} className="text-[11px] text-slate-400 border-none bg-transparent cursor-pointer font-[DM_Sans,sans-serif]">No</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="p-1.5 border-none bg-transparent cursor-pointer rounded-lg text-slate-400 hover:text-red-500 transition-colors duration-150">
                <Icon.Trash />
              </button>
            )}
          </div>
        </div>

        {/* Rate chips */}
        <div className="flex gap-2">
          <RateChip label="USD → INR" value={bank.usdToInr} bg="#eff6ff" color="#1d4ed8" />
          <RateChip label="USD → RUB" value={bank.usdToRub} bg="#faf5ff" color="#6d28d9" />
          <RateChip label="INR → RUB" value={bank.inrToRub} bg="#fffbeb" color="#92400e" />
        </div>

        <div className="mt-3 text-[11px] text-slate-300 text-right">
          Updated {new Date(bank.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>
    </div>
  );
}

// ─── BANK FORM MODAL ──────────────────────────────────────────────────────────
function BankFormModal({ bank, onSave, onClose }) {
  const isEdit = !!bank;
  const [form, setForm] = useState({
    name:     bank?.name     ?? "",
    usdToInr: bank?.usdToInr ?? "",
    usdToRub: bank?.usdToRub ?? "",
    inrToRub: bank?.inrToRub ?? "",
    isActive: bank?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Bank name is required."); return; }
    if (!form.usdToInr || !form.usdToRub || !form.inrToRub) { setError("All three rates are required."); return; }
    setSaving(true); setError("");
    try {
      const payload = { name: form.name.trim(), usdToInr: parseFloat(form.usdToInr), usdToRub: parseFloat(form.usdToRub), inrToRub: parseFloat(form.inrToRub), isActive: form.isActive };
      const url    = isEdit ? `${API}/${bank._id}` : API;
      const method = isEdit ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data   = await res.json();
      if (!data.success) throw new Error(data.message);
      onSave(data.data); onClose();
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally { setSaving(false); }
  };

  const inputClass = "w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg bg-white outline-none font-[DM_Sans,sans-serif] box-border focus:border-blue-400";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 font-[DM_Sans,sans-serif]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[440px]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-[18px] border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-[34px] h-[34px] rounded-[9px] bg-blue-600 flex items-center justify-center text-white"><Icon.Bank /></div>
            <h2 className="m-0 text-[15px] font-bold text-slate-900">{isEdit ? "Edit Bank" : "Add New Bank"}</h2>
          </div>
          <button onClick={onClose} className="border-none bg-transparent cursor-pointer text-slate-400 text-xl hover:text-slate-600">✕</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {error && (
            <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 mb-4">{error}</div>
          )}

          <div className="mb-3.5">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.04em] mb-1.5">Bank Name</label>
            <input type="text" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. HDFC Bank" className={inputClass} />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "USD → INR", field: "usdToInr", placeholder: "83.50", colorClass: "text-blue-600" },
              { label: "USD → RUB", field: "usdToRub", placeholder: "90.00", colorClass: "text-violet-700" },
              { label: "INR → RUB", field: "inrToRub", placeholder: "1.08",  colorClass: "text-amber-700" },
            ].map(({ label, field, placeholder, colorClass }) => (
              <div key={field}>
                <label className={`block text-[11px] font-semibold uppercase tracking-[0.04em] mb-1.5 ${colorClass}`}>{label}</label>
                <input type="number" step="any" value={form[field]} onChange={e => set(field, e.target.value)} placeholder={placeholder} className={inputClass} />
              </div>
            ))}
          </div>

          {/* Toggle */}
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={() => set("isActive", !form.isActive)}
              style={{ background: form.isActive ? "#2563eb" : "#e2e8f0" }}
              className="relative w-10 h-[22px] rounded-full border-none cursor-pointer transition-colors duration-200">
              <span style={{ left: form.isActive ? 20 : 2 }}
                className="absolute top-0.5 w-[18px] h-[18px] bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-[left] duration-200" />
            </button>
            <span className="text-[13px] text-slate-600 font-medium">{form.isActive ? "Active" : "Inactive"}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 px-6 py-3.5 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-[18px] py-2 text-[13px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer font-[DM_Sans,sans-serif] hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className={`px-[18px] py-2 text-[13px] font-semibold text-white bg-blue-600 border-none rounded-lg cursor-pointer font-[DM_Sans,sans-serif] flex items-center gap-2 transition-opacity ${saving ? "opacity-60" : "opacity-100 hover:bg-blue-700"}`}>
            {saving && (
              <>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ animation: "spin 0.7s linear infinite" }} className="w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
              </>
            )}
            {isEdit ? "Save Changes" : "Add Bank"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN BANKS PAGE ──────────────────────────────────────────────────────────
export default function Banks({ onBack }) {
  const [banks, setBanks]          = useState([]);
  const [loading, setLoading]      = useState(true);
  const [error, setError]          = useState("");
  const [showForm, setShowForm]    = useState(false);
  const [editingBank, setEditBank] = useState(null);
  const [filter, setFilter]        = useState("all");

  const fetchBanks = async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(API);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setBanks(data.data);
    } catch (e) { setError(e.message || "Failed to load banks."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBanks(); }, []);

  const handleSave = (saved) => {
    setBanks(prev => {
      const exists = prev.find(b => b._id === saved._id);
      return exists ? prev.map(b => b._id === saved._id ? saved : b) : [saved, ...prev];
    });
  };

  const handleDelete = async (id) => {
    try {
      const res  = await fetch(`${API}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setBanks(prev => prev.filter(b => b._id !== id));
    } catch (e) { alert(e.message || "Failed to delete bank."); }
  };

  const handleToggleActive = async (bank) => {
    try {
      const res  = await fetch(`${API}/${bank._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !bank.isActive }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setBanks(prev => prev.map(b => b._id === bank._id ? data.data : b));
    } catch (e) { alert(e.message || "Failed to update bank."); }
  };

  const filtered      = banks.filter(b => filter === "active" ? b.isActive : filter === "inactive" ? !b.isActive : true);
  const activeCount   = banks.filter(b => b.isActive).length;
  const inactiveCount = banks.filter(b => !b.isActive).length;

  return (
    <div className="min-h-screen bg-slate-50 font-[DM_Sans,sans-serif]">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-7 flex items-center justify-between h-[60px] sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-1.5 border-none bg-transparent cursor-pointer rounded-lg text-slate-500 flex items-center hover:bg-slate-100">
              <Icon.ArrowLeft />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
            <Icon.Bank />
          </div>
          <div>
            <div className="text-[17px] font-bold text-slate-900 leading-tight">Exchange Rate Banks</div>
            <div className="text-[11px] text-slate-400">Manage bank rates for currency conversion</div>
          </div>
        </div>

        <button onClick={() => { setEditBank(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-blue-600 border-none rounded-lg cursor-pointer font-[DM_Sans,sans-serif] hover:bg-blue-700">
          <Icon.Plus /> Add Bank
        </button>
      </div>

      <div className="px-7 py-6">

        {/* ── Summary strip ── */}
        <div className="flex items-center gap-5 mb-5">
          <div className="flex items-center gap-1.5 text-[13px] text-slate-500">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            <span><strong className="text-slate-900">{activeCount}</strong> Active</span>
          </div>
          <div className="flex items-center gap-1.5 text-[13px] text-slate-500">
            <div className="w-2 h-2 rounded-full bg-slate-200" />
            <span><strong className="text-slate-900">{inactiveCount}</strong> Inactive</span>
          </div>

          <div className="ml-auto flex items-center gap-1 bg-slate-100 rounded-[9px] p-1">
            {[{ id: "all", label: "All" }, { id: "active", label: "Active" }, { id: "inactive", label: "Inactive" }].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`px-3.5 py-[5px] text-xs font-medium rounded-lg border-none cursor-pointer font-[DM_Sans,sans-serif] transition-all duration-150 ${
                  filter === f.id
                    ? "bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                    : "bg-transparent text-slate-500"
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-600 flex justify-between items-center">
            {error}
            <button onClick={fetchBanks} className="text-xs font-semibold text-red-600 bg-transparent border-none cursor-pointer font-[DM_Sans,sans-serif]">Retry</button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 px-5">
            <div style={{ animation: "spin 0.7s linear infinite" }} className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full mb-3" />
            <p className="m-0 text-[13px] text-slate-400">Loading banks...</p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-5 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 text-blue-600"><Icon.Bank /></div>
            <p className="m-0 mb-1.5 text-[15px] font-semibold text-slate-900">{filter === "all" ? "No banks yet" : `No ${filter} banks`}</p>
            <p className="m-0 mb-5 text-[13px] text-slate-400">{filter === "all" ? "Add your first bank to get started" : "Try switching the filter above"}</p>
            {filter === "all" && (
              <button onClick={() => { setEditBank(null); setShowForm(true); }}
                className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-white bg-blue-600 border-none rounded-[9px] cursor-pointer font-[DM_Sans,sans-serif] hover:bg-blue-700">
                <Icon.Plus /> Add Bank
              </button>
            )}
          </div>
        )}

        {/* ── Bank Cards ── */}
        {!loading && filtered.length > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {filtered.map(bank => (
              <BankCard key={bank._id} bank={bank}
                onEdit={(b) => { setEditBank(b); setShowForm(true); }}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <BankFormModal
          bank={editingBank}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditBank(null); }}
        />
      )}
    </div>
  );
}
