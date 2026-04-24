import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL;

const CREATE_TABS = [
  {
    id: "general",
    label: "General",
    fields: [
      { key: "shippingNo", label: "Shipping No", type: "text" },
      { key: "skuNo", label: "SKU No.", type: "text" },
      { key: "courier", label: "Courier", type: "text" },
      { key: "supplier", label: "Supplier", type: "text" },
      { key: "buyerAtSource", label: "Buyer", type: "text" },
      { key: "dateOfPurchase", label: "Date of Purchase", type: "date" },
      { key: "shape", label: "Shape", type: "text" },
      { key: "weight", label: "Weight (ct)", type: "number" },
      { key: "certificateNo", label: "Cert. No.", type: "text" },
      { key: "synthesis", label: "Synthesis", type: "text" },
      { key: "diamondType", label: "Type", type: "text" },
      { key: "cut", label: "Cut", type: "text" },
      { key: "carat", label: "Ct", type: "number" },
      { key: "colour", label: "Colour", type: "text" },
      { key: "clarity", label: "Clarity", type: "text" },
      { key: "laboratory", label: "Laboratory", type: "text" },
      { key: "length", label: "Length (mm)", type: "number" },
      { key: "width", label: "Width (mm)", type: "number" },
      { key: "height", label: "Height (mm)", type: "number" }, { key: "location", label: "Location", type: "text" },
      { key: "warehouse", label: "Warehouse", type: "text" },
      { key: "inventoryDate", label: "Inventory Date", type: "date" },
      { key: "inventoryManager", label: "Inv. Manager", type: "text" },
      { key: "status", label: "Status", type: "status" },
      { key: "paymentStatus", label: "Payment Status", type: "paymentStatus" },
    ],
  },
  {
    id: "pricing",
    label: "Pricing",
    fields: [
      { key: "typeOfExchange", label: "Bank", type: "bank" },
      { key: "purchaseCurrency", label: "Currency", type: "text" },
      { key: "pricePerCaratUSD", label: "Price/ct (USD)", type: "number" },
      { key: "gstPercent", label: "GST %", type: "number" },
      { key: "correctionPriceUSD", label: "Correction (USD)", type: "number" },
      { key: "actualRate", label: "Actual Rate", type: "number" },
      { key: "markup", label: "Mark Up %", type: "number", hint: "e.g. 20 = 20%" },
      { key: "localCurrency", label: "Local Currency", type: "text" },
      { key: "_gstAmount", label: "GST Amt", type: "preview" },
      { key: "_buyPriceTotal", label: "Buy Price Total", type: "preview" },
      { key: "_basePriceINR", label: "Base (INR)", type: "preview" },
      { key: "_actualPriceINR", label: "Actual Price (INR)", type: "preview" },
      { key: "_marketPL", label: "Market P/L", type: "preview", signed: true },
      { key: "_sellPrice", label: "Sell Price (INR)", type: "preview" },
      { key: "_priceRUB", label: "Price (RUB)", type: "preview" },
      { key: "_priceUSD", label: "Price (USD)", type: "preview" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    fields: [
      { key: "dateOfSale", label: "Date of Sale", type: "date" },
      { key: "buyerName", label: "Final Buyer", type: "text" },
      { key: "saleAmount", label: "Sale Amount", type: "number" },
      { key: "saleCurrency", label: "Sale Currency", type: "text" },
      { key: "rateOnDateOfSale", label: "Rate on Sale", type: "number" },
      { key: "_saleBaseINR", label: "Base (INR)", type: "preview" },
      { key: "_marginality", label: "Marginality", type: "preview", signed: true },
      { key: "_actualMarkup", label: "Actual Markup %", type: "preview" },
    ],
  },
  {
    id: "bonus",
    label: "Bonus",
    fields: [
      { key: "manager", label: "Manager", type: "text" },
      { key: "bonusPoints", label: "Bonus Pts", type: "number" },
      { key: "bonusRate", label: "Rate (Bonus)", type: "number" },
      { key: "_bonusAmount", label: "Bonus Amt", type: "preview" },
      { key: "_bonusLocal", label: "Bonus (Local)", type: "preview" },
    ],
  },
];

// ── Formulas ─────────────────────────────────────────────────────────────────
// gstAmount        = weight * pricePerCaratUSD * (gstPercent / 100)
// buyPriceTotal    = weight * pricePerCaratUSD
// basePriceINR     = buyPriceTotal * bank.usdToInr
// actualPriceINR   = correctionUSD * weight * actualRate
// marketPL         = actualPriceINR - basePriceINR
// sellPrice (INR)  = actualPriceINR * (1 + markup / 100)
// priceRUB         = ROUNDUP(sellPrice_INR * inrToRub, -2)  → ceil to nearest 100
// priceUSD         = sellPrice_INR / usdToInr
// saleBaseINR      = saleAmount * rateOnDateOfSale
// marginality      = saleBaseINR - basePriceINR
// actualMarkup     = saleBaseINR / (basePriceINR / 100) - 100
// bonusAmount      = (actualPriceINR / 100) * bonusPoints
// bonusLocal       = bonusAmount / bonusRate
function calcPreview(form, bank) {
  const n = (v) => { const x = Number(v); return isNaN(x) || v === "" || v === null || v === undefined ? null : x; };

  const weight = n(form.weight);
  const pricePerCaratUSD = n(form.pricePerCaratUSD);
  const gstPercent = n(form.gstPercent) ?? 0;
  const usdToInr = bank?.usdToInr ?? null;   // e.g. 94.2
  const inrToRub = bank?.inrToRub ?? null;   // e.g. 1.173
  const correctionUSD = n(form.correctionPriceUSD) ?? pricePerCaratUSD;
  const actualRate = n(form.actualRate) ?? usdToInr;
  // markup is now entered as a percentage integer, e.g. 20 means 20%
  const markupRaw = n(form.markup);
  const markup = markupRaw != null ? markupRaw / 100 : null;
  const saleAmount = n(form.saleAmount);
  const rateOnDateOfSale = n(form.rateOnDateOfSale);
  const bonusPoints = n(form.bonusPoints) ?? 0;
  const bonusRate = n(form.bonusRate);

  const gstAmount = weight != null && pricePerCaratUSD != null
    ? weight * pricePerCaratUSD * (gstPercent / 100) : null;

  const buyPriceTotal = weight != null && pricePerCaratUSD != null
    ? weight * pricePerCaratUSD : null;

  const basePriceINR = buyPriceTotal != null && usdToInr != null
    ? buyPriceTotal * usdToInr : null;

  const actualPriceINR = correctionUSD != null && weight != null && actualRate != null
    ? correctionUSD * weight * actualRate : null;

  const marketPL = actualPriceINR != null && basePriceINR != null
    ? actualPriceINR - basePriceINR : null;

  // sellPrice in INR: apply markup on top of actualPriceINR
  const sellPrice = actualPriceINR != null && markup != null
    ? actualPriceINR * (1 + markup) : null;

  // priceRUB: convert sellPrice (INR) → RUB, round up to nearest 100
  // inrToRub in bank data = "1 RUB costs X INR", so divide INR by rate to get RUB
  const priceRUB = sellPrice != null && inrToRub != null
    ? Math.ceil((sellPrice / inrToRub) / 100) * 100 : null;

  // priceUSD: convert sellPrice (INR) → USD
  const priceUSD = sellPrice != null && usdToInr != null
    ? sellPrice / usdToInr : null;

  const saleBaseINR = saleAmount != null && rateOnDateOfSale != null
    ? saleAmount * rateOnDateOfSale : null;

  const marginality = saleBaseINR != null && basePriceINR != null
    ? saleBaseINR - basePriceINR : null;

  const actualMarkup = saleBaseINR != null && basePriceINR != null && basePriceINR !== 0
    ? saleBaseINR / (basePriceINR / 100) - 100 : null;

  const bonusAmount = actualPriceINR != null
    ? (actualPriceINR / 100) * bonusPoints : null;

  const bonusLocal = bonusAmount != null && bonusRate != null
    ? bonusAmount / bonusRate : null;

  return {
    _gstAmount: gstAmount, _buyPriceTotal: buyPriceTotal, _basePriceINR: basePriceINR,
    _actualPriceINR: actualPriceINR, _marketPL: marketPL, _sellPrice: sellPrice,
    _priceRUB: priceRUB, _priceUSD: priceUSD, _saleBaseINR: saleBaseINR,
    _marginality: marginality, _actualMarkup: actualMarkup,
    _bonusAmount: bonusAmount, _bonusLocal: bonusLocal,
  };
}

const fmt = (v, decimals = 2) =>
  v == null ? "—" : Number(v).toLocaleString("en-IN", { maximumFractionDigits: decimals });

export default function CreateTransactionModal({ onSave, onClose }) {
  const [banks, setBanks] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);

  const [form, setForm] = useState({
    shippingNo: "", skuNo: "", courier: "", supplier: "",
    buyerAtSource: "", dateOfPurchase: "", shape: "",
    weight: "", certificateNo: "", synthesis: "", diamondType: "", cut: "",
    carat: "", colour: "", clarity: "", laboratory: "",
    length: "", width: "", height: "",
    location: "", warehouse: "",
    inventoryDate: "", inventoryManager: "",
    status: "", paymentStatus: "",
    typeOfExchange: "",
    purchaseCurrency: "USD",
    pricePerCaratUSD: "", gstPercent: "0",
    correctionPriceUSD: "", actualRate: "", markup: "",
    localCurrency: "RUB",
    dateOfSale: "", buyerName: "", saleAmount: "",
    saleCurrency: "RUB", rateOnDateOfSale: "",
    manager: "", bonusPoints: "", bonusRate: "",
  });

  useEffect(() => {
    fetch(`${API}/banks/active`).then(r => r.json()).then(d => { if (d.success) setBanks(d.data); }).catch(() => { });
    fetch(`${API}/statuses/active`).then(r => r.json()).then(d => { if (d.success) setStatuses(d.data); }).catch(() => { });
    fetch(`${API}/payment-statuses/active`).then(r => r.json()).then(d => { if (d.success) setPaymentStatuses(d.data); }).catch(() => { });
  }, []);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === "typeOfExchange") setSelectedBank(banks.find(b => b._id === value) || null);
  };

  const preview = calcPreview(form, selectedBank);

  const handleSave = async () => {
    if (!form.skuNo.trim()) { alert("SKU No. is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach(k => { if (payload[k] === "") delete payload[k]; });
      if (payload.typeOfExchange) payload.bank = payload.typeOfExchange;
      const res = await fetch(`${API}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(r => r.json());
      if (res.success) { onSave(res.data, banks); onClose(); }
      else alert(res.message || "Failed to create transaction");
    } catch (e) { console.error(e); alert("Network error: " + e.message); }
    setSaving(false);
  };

  const base = "w-full px-2.5 py-[7px] text-xs border border-slate-200 rounded-lg bg-white outline-none font-[DM_Sans,sans-serif] box-border focus:border-blue-400";
  const roClass = "w-full px-2.5 py-[7px] text-xs border border-slate-100 rounded-lg bg-slate-50 text-slate-400 outline-none font-[DM_Sans,sans-serif] box-border";

  const renderField = (f) => {
    if (f.type === "preview") {
      const val = preview[f.key];
      const isNeg = f.signed && val != null && val < 0;
      const isPos = f.signed && val != null && val >= 0;
      return (
        <div className={roClass} style={{ color: isNeg ? "#dc2626" : isPos ? "#16a34a" : undefined }}>
          {f.signed && val != null ? (val >= 0 ? "↑ " : "↓ ") : ""}
          {val == null ? "—" : fmt(Math.abs(val))}
        </div>
      );
    }
    if (f.type === "bank") return (
      <select value={form[f.key]} onChange={e => handleChange(f.key, e.target.value)} className={base}>
        <option value="">— Select Bank —</option>
        {banks.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
      </select>
    );
    if (f.type === "status") return (
      <select value={form[f.key]} onChange={e => handleChange(f.key, e.target.value)} className={base}>
        <option value="">—</option>
        {statuses.map(s => <option key={s._id} value={s._id}>{s.label}</option>)}
      </select>
    );
    if (f.type === "paymentStatus") return (
      <select value={form[f.key]} onChange={e => handleChange(f.key, e.target.value)} className={base}>
        <option value="">—</option>
        {paymentStatuses.map(s => <option key={s._id} value={s._id}>{s.label}</option>)}
      </select>
    );
    if (f.type === "date") return (
      <input type="date" value={form[f.key]} onChange={e => handleChange(f.key, e.target.value)} className={base} />
    );
    if (f.type === "number") return (
      <input type="number" step="any" value={form[f.key]} placeholder={f.hint || ""}
        onChange={e => handleChange(f.key, e.target.value)} className={base} />
    );
    return <input type="text" value={form[f.key]} onChange={e => handleChange(f.key, e.target.value)} className={base} />;
  };

  const activeFields = CREATE_TABS.find(t => t.id === activeTab)?.fields ?? [];

  const summaryCards = [
    { label: "Buy Total", val: `$${fmt(preview._buyPriceTotal)}`, colorClass: "text-slate-900" },
    { label: "Base INR", val: `₹${fmt(preview._basePriceINR, 0)}`, colorClass: "text-slate-900" },
    { label: "Market P/L", val: `${(preview._marketPL ?? 0) >= 0 ? "↑" : "↓"} ₹${fmt(Math.abs(preview._marketPL ?? 0), 0)}`, colorClass: (preview._marketPL ?? 0) >= 0 ? "text-green-600" : "text-red-600" },
    { label: "Price (RUB)", val: preview._priceRUB == null ? "—" : `₽${fmt(preview._priceRUB, 0)}`, colorClass: "text-slate-900" },
  ];

  const subtitle = selectedBank
    ? <><span className="text-blue-600 font-semibold">{selectedBank.name}</span> · USD→INR: <span className="text-slate-600 font-medium">{selectedBank.usdToInr}</span> · INR→RUB: <span className="text-slate-600 font-medium">{selectedBank.inrToRub}</span></>
    : "Select a bank in Pricing to auto-fill rates";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 font-[DM_Sans,sans-serif]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[900px] max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-[18px] border-b border-slate-100">
          <div>
            <h2 className="m-0 text-base font-bold text-slate-900">New Transaction</h2>
            <p className="m-0 mt-0.5 text-xs text-slate-400">{subtitle}</p>
          </div>
          <button onClick={onClose} className="border-none bg-transparent cursor-pointer p-1.5 rounded-lg text-slate-400 text-xl leading-none hover:text-slate-600">✕</button>
        </div>

        <div className="flex border-b border-slate-100 px-6">
          {CREATE_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`border-none bg-transparent cursor-pointer px-4 py-2.5 text-[13px] font-medium font-[DM_Sans,sans-serif] transition-colors duration-150 border-b-2 ${activeTab === tab.id ? "text-slate-900 border-blue-600" : "text-slate-400 border-transparent"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-4 gap-4">
            {activeFields.map(f => (
              <div key={f.key}>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-[0.04em]">
                  {f.label}
                  {f.type === "preview" && <span className="text-slate-300 font-normal ml-0.5 normal-case text-[10px]"> (auto)</span>}
                </label>
                {renderField(f)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-3 mt-6">
            {summaryCards.map(s => (
              <div key={s.label} className="bg-slate-50 rounded-xl px-4 py-3 text-center border border-slate-100">
                <p className="m-0 mb-1 text-[11px] text-slate-400 font-medium uppercase tracking-[0.04em]">{s.label}</p>
                <p className={`m-0 text-[15px] font-bold ${s.colorClass}`}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 px-6 py-3.5 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-[18px] py-2 text-[13px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer font-[DM_Sans,sans-serif] hover:bg-slate-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-[18px] py-2 text-[13px] font-semibold text-white bg-blue-600 border-none rounded-lg cursor-pointer font-[DM_Sans,sans-serif] hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Creating..." : "Create Transaction"}
          </button>
        </div>
      </div>
    </div>
  );
}
