import { useState, useEffect } from "react";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap";
document.head.appendChild(fontLink);

const API = "http://localhost:5000/api";

// ─── REUSABLE COMPONENTS ─────────────────────────────────────────────────────

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full border-none cursor-pointer transition-colors duration-200 ${value ? "bg-blue-600" : "bg-slate-200"}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${value ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

function ColorDot({ color }) {
  return <span style={{ background: color }} className="inline-block w-3 h-3 rounded-full border border-slate-200" />;
}

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" /></svg>
      </div>
      <p className="m-0 text-[13px] font-medium text-slate-400">No {label} yet</p>
      <p className="m-0 mt-1 text-xs text-slate-300">Add one using the form above</p>
    </div>
  );
}

// ─── BANKS TAB ────────────────────────────────────────────────────────────────

function BanksTab() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", usdToInr: "", usdToRub: "", inrToRub: "", isActive: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchBanks = async () => {
    setLoading(true);
    const res = await fetch(`${API}/banks`).then(r => r.json());
    if (res.success) setBanks(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchBanks(); }, []);

  const resetForm = () => {
    setForm({ name: "", usdToInr: "", usdToRub: "", inrToRub: "", isActive: true });
    setEditingId(null);
    setError("");
  };

  const handleEdit = (bank) => {
    setEditingId(bank._id);
    setForm({ name: bank.name, usdToInr: bank.usdToInr, usdToRub: bank.usdToRub, inrToRub: bank.inrToRub, isActive: bank.isActive });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.usdToInr || !form.usdToRub || !form.inrToRub) { setError("All fields are required"); return; }
    setSaving(true);
    setError("");
    const body = { name: form.name, usdToInr: parseFloat(form.usdToInr), usdToRub: parseFloat(form.usdToRub), inrToRub: parseFloat(form.inrToRub), isActive: form.isActive };
    const url = editingId ? `${API}/banks/${editingId}` : `${API}/banks`;
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json());
    if (res.success) { fetchBanks(); resetForm(); }
    else setError(res.message || "Something went wrong");
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this bank?")) return;
    await fetch(`${API}/banks/${id}`, { method: "DELETE" });
    fetchBanks();
  };

  const handleToggleActive = async (bank) => {
    await fetch(`${API}/banks/${bank._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...bank, isActive: !bank.isActive }) });
    fetchBanks();
  };

  const inputClass = "w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white outline-none font-[DM_Sans,sans-serif] focus:border-blue-400";

  return (
    <div className="space-y-5">

      {/* Form */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <p className="m-0 mb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em]">
          {editingId ? "Edit Bank" : "Add New Bank"}
        </p>
        <div className="grid grid-cols-5 gap-3 mb-3">
          <div className="col-span-2">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Bank Name</label>
            <input type="text" placeholder="e.g. Dubai Exchange" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">USD → INR</label>
            <input type="number" step="any" placeholder="e.g. 95.6" value={form.usdToInr}
              onChange={e => setForm(p => ({ ...p, usdToInr: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">USD → RUB</label>
            <input type="number" step="any" placeholder="e.g. 81.5" value={form.usdToRub}
              onChange={e => setForm(p => ({ ...p, usdToRub: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">INR → RUB</label>
            <input type="number" step="any" placeholder="e.g. 1.173" value={form.inrToRub}
              onChange={e => setForm(p => ({ ...p, inrToRub: e.target.value }))} className={inputClass} />
          </div>
        </div>
        {error && <p className="m-0 mb-2 text-xs text-red-500">{error}</p>}
        <div className="flex items-center gap-2">
          <button onClick={handleSubmit} disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 border-none rounded-lg cursor-pointer font-[DM_Sans,sans-serif] hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : editingId ? "Update Bank" : "Add Bank"}
          </button>
          {editingId && (
            <button onClick={resetForm} className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer font-[DM_Sans,sans-serif] hover:bg-slate-50">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ animation: "spin 0.7s linear infinite" }} className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : banks.length === 0 ? <EmptyState label="banks" /> : (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full border-collapse font-[DM_Sans,sans-serif]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Bank Name", "USD → INR", "USD → RUB", "INR → RUB", "Active", "Actions"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {banks.map((bank, i) => (
                <tr key={bank._id} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}>
                  <td className="px-4 py-3 text-xs font-medium text-slate-800">{bank.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 tabular-nums">₹{bank.usdToInr}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 tabular-nums">₽{bank.usdToRub}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 tabular-nums">{bank.inrToRub}</td>
                  <td className="px-4 py-3"><Toggle value={bank.isActive} onChange={() => handleToggleActive(bank)} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(bank)} className="text-xs text-blue-600 bg-transparent border-none cursor-pointer font-[DM_Sans,sans-serif] hover:underline">Edit</button>
                      <button onClick={() => handleDelete(bank._id)} className="text-xs text-red-400 bg-transparent border-none cursor-pointer font-[DM_Sans,sans-serif] hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── STATUS TAB ───────────────────────────────────────────────────────────────

function StatusTab({ endpoint, label }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ label: "", color: "#64748b", isActive: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch(`${API}/${endpoint}`).then(r => r.json());
    if (res.success) setItems(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [endpoint]);

  const resetForm = () => {
    setForm({ label: "", color: "#64748b", isActive: true });
    setEditingId(null);
    setError("");
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({ label: item.label, color: item.color, isActive: item.isActive });
  };

  const handleSubmit = async () => {
    if (!form.label) { setError("Label is required"); return; }
    setSaving(true);
    setError("");
    const url = editingId ? `${API}/${endpoint}/${editingId}` : `${API}/${endpoint}`;
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }).then(r => r.json());
    if (res.success) { fetchItems(); resetForm(); }
    else setError(res.message || "Something went wrong");
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm(`Delete this ${label}?`)) return;
    await fetch(`${API}/${endpoint}/${id}`, { method: "DELETE" });
    fetchItems();
  };

  const handleToggleActive = async (item) => {
    await fetch(`${API}/${endpoint}/${item._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item, isActive: !item.isActive }) });
    fetchItems();
  };

  const inputClass = "w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white outline-none font-[DM_Sans,sans-serif] focus:border-blue-400";

  return (
    <div className="space-y-5">

      {/* Form */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <p className="m-0 mb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em]">
          {editingId ? `Edit ${label}` : `Add New ${label}`}
        </p>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="col-span-2">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Label</label>
            <input type="text" placeholder={`e.g. ${label === "Status" ? "In Stock" : "Paid"}`} value={form.label}
              onChange={e => setForm(p => ({ ...p, label: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.color}
                onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                className="h-[34px] w-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white" />
              <input type="text" value={form.color}
                onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                className={inputClass} />
            </div>
          </div>
          <div className="flex flex-col justify-end pb-0.5">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Active</label>
            <Toggle value={form.isActive} onChange={v => setForm(p => ({ ...p, isActive: v }))} />
          </div>
        </div>
        {error && <p className="m-0 mb-2 text-xs text-red-500">{error}</p>}
        <div className="flex items-center gap-2">
          <button onClick={handleSubmit} disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 border-none rounded-lg cursor-pointer font-[DM_Sans,sans-serif] hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : editingId ? `Update ${label}` : `Add ${label}`}
          </button>
          {editingId && (
            <button onClick={resetForm} className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer font-[DM_Sans,sans-serif] hover:bg-slate-50">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ animation: "spin 0.7s linear infinite" }} className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : items.length === 0 ? <EmptyState label={label.toLowerCase() + "es"} /> : (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full border-collapse font-[DM_Sans,sans-serif]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Label", "Color", "Active", "Actions"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item._id} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ColorDot color={item.color} />
                      <span style={{ color: item.color }} className="text-xs font-medium">{item.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 tabular-nums font-mono">{item.color}</td>
                  <td className="px-4 py-3"><Toggle value={item.isActive} onChange={() => handleToggleActive(item)} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(item)} className="text-xs text-blue-600 bg-transparent border-none cursor-pointer font-[DM_Sans,sans-serif] hover:underline">Edit</button>
                      <button onClick={() => handleDelete(item._id)} className="text-xs text-red-400 bg-transparent border-none cursor-pointer font-[DM_Sans,sans-serif] hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── MASTERS PAGE ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "banks", label: "Banks", icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11" /></svg> },
  { id: "status", label: "Status", icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { id: "paymentStatus", label: "Payment Status", icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg> },
];

export default function Masters({ onBack }) {
  const [activeTab, setActiveTab] = useState("banks");

  return (
    <div className="min-h-screen bg-slate-50 font-[DM_Sans,sans-serif]">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-7 flex items-center justify-between h-[60px] sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>
          </div>
          <span className="text-[17px] font-bold text-slate-900">Manage Masters</span>
        </div>
      </div>

      <div className="px-7 py-6 max-w-5xl mx-auto">

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-6 w-fit">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg border-none cursor-pointer font-[DM_Sans,sans-serif] transition-all duration-150 ${activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "banks" && <BanksTab />}
        {activeTab === "status" && <StatusTab endpoint="statuses" label="Status" />}
        {activeTab === "paymentStatus" && <StatusTab endpoint="payment-statuses" label="Payment Status" />}
      </div>
    </div>
  );
}