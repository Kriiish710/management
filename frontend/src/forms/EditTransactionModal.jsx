import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL;

const COLUMNS = [
  { key: "shippingNo", label: "Shipping No", type: "text" },
  { key: "skuNo", label: "SKU No.", type: "text" },
  { key: "courier", label: "Courier", type: "text" },
  { key: "supplier", label: "Supplier", type: "text" },
  { key: "buyerAtSource", label: "Buyer", type: "text" },
  { key: "dateOfPurchase", label: "Date of Purchase", type: "date" },
  { key: "shape", label: "Shape", type: "text" },
  { key: "weight", label: "Weight (ct)", type: "number" },
  { key: "certificateNo", label: "Cert. No.", type: "text" },
  { key: "pricePerCaratUSD", label: "Price/ct (USD)", type: "number" },
  { key: "gstPercent", label: "GST %", type: "number" },
  { key: "gstAmount", label: "GST Amt", type: "preview" },
  { key: "buyPriceTotal", label: "Buy Price Total", type: "preview" },
  { key: "purchaseCurrency", label: "Currency", type: "text" },
  { key: "rateAtPurchase", label: "Rate (USD/INR)", type: "preview" },
  { key: "basePriceINR", label: "Base (INR)", type: "preview" },
  { key: "correctionPriceUSD", label: "Correction (USD)", type: "number" },
  { key: "actualRate", label: "Actual Rate", type: "number" },
  { key: "actualPriceINR", label: "Actual Price (INR)", type: "preview" },
  { key: "marketPL", label: "Market P/L", type: "preview", signed: true },
  { key: "markup", label: "Mark Up", type: "number", hint: "e.g. 0.7 = 70%" },
  { key: "sellPriceLocalCurrency", label: "Sell Price (INR)", type: "preview" },
  { key: "localCurrency", label: "Local Currency", type: "text" },
  { key: "typeOfExchange", label: "Bank", type: "bank" },
  { key: "paymentStatus", label: "Payment Status", type: "paymentStatus" },
  { key: "status", label: "Status", type: "status" },
  { key: "warehouse", label: "Warehouse", type: "text" },
  { key: "inventoryDate", label: "Inventory Date", type: "date" },
  { key: "inventoryManager", label: "Inv. Manager", type: "text" },
  { key: "synthesis", label: "Synthesis", type: "text" },
  { key: "cut", label: "Cut", type: "text" },
  { key: "carat", label: "Ct", type: "number" },
  { key: "colour", label: "Colour", type: "text" },
  { key: "clarity", label: "Clarity", type: "text" },
  { key: "priceRUB", label: "Price (RUB)", type: "preview" },
  { key: "priceUSD", label: "Price (USD)", type: "preview" },
  { key: "pricePerCt", label: "Price/ct", type: "preview" },
  { key: "rateRUB", label: "Rate (USD/RUB)", type: "preview" },
  { key: "location", label: "Location", type: "text" },
  { key: "laboratory", label: "Laboratory", type: "text" },
  { key: "length", label: "Length (mm)", type: "number" },
  { key: "width", label: "Width (mm)", type: "number" },
  { key: "height", label: "Height (mm)", type: "number" },
  { key: "dateOfSale", label: "Date of Sale", type: "date" },
  { key: "buyerName", label: "Final Buyer", type: "text" },
  { key: "saleAmount", label: "Sale Amount", type: "number" },
  { key: "saleCurrency", label: "Sale Currency", type: "text" },
  { key: "rateOnDateOfSale", label: "Rate on Sale", type: "number" },
  { key: "saleBaseINR", label: "Base Currency (INR)", type: "preview" },
  { key: "marginality", label: "Marginality", type: "preview", signed: true },
  { key: "actualMarkup", label: "Actual Markup %", type: "preview" },
  { key: "manager", label: "Manager", type: "text" },
  { key: "bonusPoints", label: "Bonus Pts", type: "number" },
  { key: "bonusAmount", label: "Bonus Amt", type: "preview" },
  { key: "bonusRate", label: "Rate (Bonus)", type: "number" },
  { key: "bonusInLocalCurrency", label: "Bonus (Local)", type: "preview" },
];

const EDIT_TABS = [
  {
    id: "general", label: "General",
    keys: ["shippingNo", "skuNo", "courier", "supplier", "buyerAtSource", "dateOfPurchase", "shape", "weight", "certificateNo", "synthesis", "cut", "carat", "colour", "clarity", "laboratory", "length", "width", "height", "location", "warehouse", "inventoryDate", "inventoryManager", "status", "paymentStatus"],
  },
  {
    id: "pricing", label: "Pricing",
    keys: ["purchaseCurrency", "typeOfExchange", "rateAtPurchase", "pricePerCaratUSD", "gstPercent", "gstAmount", "buyPriceTotal", "basePriceINR", "correctionPriceUSD", "actualRate", "actualPriceINR", "marketPL", "markup", "localCurrency", "sellPriceLocalCurrency", "priceRUB", "priceUSD", "pricePerCt", "rateRUB"],
  },
  {
    id: "sales", label: "Sales",
    keys: ["dateOfSale", "buyerName", "saleAmount", "saleCurrency", "rateOnDateOfSale", "saleBaseINR", "marginality", "actualMarkup"],
  },
  {
    id: "bonus", label: "Bonus",
    keys: ["manager", "bonusPoints", "bonusAmount", "bonusRate", "bonusInLocalCurrency"],
  },
];

const COL_MAP = Object.fromEntries(COLUMNS.map(c => [c.key, c]));

function calcPreview(form, bank) {
  const n = (v) => { const x = Number(v); return isNaN(x) || v === "" || v === null || v === undefined ? null : x; };

  const weight = n(form.weight);
  const pricePerCaratUSD = n(form.pricePerCaratUSD);
  const gstPercent = n(form.gstPercent) ?? 0;
  const usdToInr = bank?.usdToInr ?? null;
  const inrToRub = bank?.inrToRub ?? null;
  const correctionUSD = n(form.correctionPriceUSD) ?? pricePerCaratUSD;
  const actualRate = n(form.actualRate) ?? usdToInr;
  const markup = n(form.markup);
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

  const sellPrice = actualPriceINR != null && inrToRub != null && markup != null
    ? (actualPriceINR / inrToRub) * (1 + markup) : null;

  const priceRUB = sellPrice != null && inrToRub != null
    ? Math.ceil((sellPrice * inrToRub) / 100) * 100 : null;

  const priceUSD = sellPrice != null && usdToInr != null
    ? sellPrice / usdToInr : null;

  const pricePerCt = priceUSD != null && weight != null && weight !== 0
    ? priceUSD / weight : null;

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
    gstAmount,
    buyPriceTotal,
    rateAtPurchase: usdToInr,
    basePriceINR,
    actualPriceINR,
    marketPL,
    sellPriceLocalCurrency: sellPrice,
    priceRUB,
    priceUSD,
    pricePerCt,
    rateRUB: inrToRub,
    saleBaseINR,
    marginality,
    actualMarkup,
    bonusAmount,
    bonusInLocalCurrency: bonusLocal,
  };
}

const fmt = (v, decimals = 2) =>
  v == null ? "—" : Number(v).toLocaleString("en-IN", { maximumFractionDigits: decimals });

function getLabel(value) {
  if (!value) return "";
  if (typeof value === "object" && value.label) return value.label;
  if (typeof value === "object" && value.name) return value.name;
  return String(value);
}

export default function EditTransactionModal({ transaction, onSave, onClose }) {
  const [banks, setBanks] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);

  const [formData, setFormData] = useState(() => {
    const parseMeas = (str) => {
      const parts = (str || "").split("*");
      return {
        length: parseFloat(parts[0]) || "",
        width:  parseFloat(parts[1]) || "",
        height: parseFloat(parts[2]) || "",
      };
    };

    return {
      ...transaction,
      ...(!transaction.length && !transaction.width && !transaction.height
        ? parseMeas(transaction.measurement)
        : {}),
      status: typeof transaction.status === "object"
        ? transaction.status?._id ?? ""
        : transaction.status ?? "",
      paymentStatus: typeof transaction.paymentStatus === "object"
        ? transaction.paymentStatus?._id ?? ""
        : transaction.paymentStatus ?? "",
      typeOfExchange: typeof transaction.typeOfExchange === "object"
        ? transaction.typeOfExchange?._id ?? ""
        : transaction.typeOfExchange ?? "",
    };
  });

  useEffect(() => {
    fetch(`${API}/banks/active`).then(r => r.json()).then(d => {
      if (d.success) {
        setBanks(d.data);
        const txBankId = typeof transaction.typeOfExchange === "object"
          ? transaction.typeOfExchange?._id
          : transaction.typeOfExchange;
        const match = d.data.find(b => b._id === txBankId);
        if (match) setSelectedBank(match);
      }
    }).catch(() => { });
    fetch(`${API}/statuses/active`).then(r => r.json()).then(d => { if (d.success) setStatuses(d.data); }).catch(() => { });
    fetch(`${API}/payment-statuses/active`).then(r => r.json()).then(d => { if (d.success) setPaymentStatuses(d.data); }).catch(() => { });
  }, []);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (key === "typeOfExchange") {
      setSelectedBank(banks.find(b => b._id === value) || null);
    }
  };

  const preview = calcPreview(formData, selectedBank);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...formData, ...preview };
      const res = await fetch(`${API}/transactions/${transaction._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(r => r.json());
      if (res.success) {
        const savedBank = banks.find(b => b._id === formData.typeOfExchange);
        const patched = {
          ...res.data,
          typeOfExchange: savedBank
            ? { _id: savedBank._id, name: savedBank.name }
            : res.data.typeOfExchange,
        };
        onSave(patched);
        onClose();
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const baseInputClass = "w-full px-2.5 py-[7px] text-xs border border-slate-200 rounded-lg bg-white outline-none font-[DM_Sans,sans-serif] box-border focus:border-blue-400";
  const roClass = "w-full px-2.5 py-[7px] text-xs border border-slate-100 rounded-lg bg-slate-50 text-slate-400 outline-none font-[DM_Sans,sans-serif] box-border";

  const renderField = (col) => {
    if (col.type === "preview") {
      const val = preview[col.key];
      const isNeg = col.signed && val != null && val < 0;
      const isPos = col.signed && val != null && val >= 0;
      return (
        <div className={roClass} style={{ color: isNeg ? "#dc2626" : isPos ? "#16a34a" : undefined }}>
          {col.signed && val != null ? (val >= 0 ? "↑ " : "↓ ") : ""}
          {val == null ? "—" : fmt(Math.abs(val))}
        </div>
      );
    }

    const value = formData[col.key] ?? "";

    if (col.type === "bank") {
      const currentBankId = (() => {
        const v = formData[col.key];
        if (!v) return "";
        const byId = banks.find(b => b._id === v);
        if (byId) return byId._id;
        const byName = banks.find(b =>
          b.name.toLowerCase().includes(String(v).toLowerCase()) ||
          String(v).toLowerCase().includes(b.name.toLowerCase())
        );
        return byName ? byName._id : "";
      })();
      return (
        <select value={currentBankId} onChange={e => handleChange(col.key, e.target.value)} className={baseInputClass}>
          <option value="">— No Bank —</option>
          {banks.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
      );
    }
    if (col.type === "status") return (
      <select value={value} onChange={e => handleChange(col.key, e.target.value)} className={baseInputClass}>
        <option value="">—</option>
        {statuses.map(s => <option key={s._id} value={s._id}>{s.label}</option>)}
      </select>
    );
    if (col.type === "paymentStatus") return (
      <select value={value} onChange={e => handleChange(col.key, e.target.value)} className={baseInputClass}>
        <option value="">—</option>
        {paymentStatuses.map(s => <option key={s._id} value={s._id}>{s.label}</option>)}
      </select>
    );
    if (col.type === "date") {
      const dv = value ? String(value).split("T")[0] : "";
      return <input type="date" value={dv} onChange={e => handleChange(col.key, e.target.value)} className={baseInputClass} />;
    }
    if (col.type === "number") return (
      <input type="number" step="any" value={value ?? ""}
        placeholder={col.hint || ""}
        onChange={e => handleChange(col.key, e.target.value === "" ? "" : e.target.value)}
        className={baseInputClass} />
    );
    return <input type="text" value={value} onChange={e => handleChange(col.key, e.target.value)} className={baseInputClass} />;
  };

  const activeKeys = EDIT_TABS.find(t => t.id === activeTab)?.keys ?? [];

  const subtitle = selectedBank
    ? <><span className="text-blue-600 font-semibold">{selectedBank.name}</span> · USD→INR: <span className="text-slate-600 font-medium">{selectedBank.usdToInr}</span> · INR→RUB: <span className="text-slate-600 font-medium">{selectedBank.inrToRub}</span></>
    : <>SKU: <span className="text-blue-600 font-semibold">{formData.skuNo || "—"}</span> · Weight: <span className="text-slate-600 font-medium">{formData.weight || "—"} ct</span></>;

  const summaryCards = [
    { label: "Buy Total", val: `$${fmt(preview.buyPriceTotal)}`, colorClass: "text-slate-900" },
    { label: "Base INR", val: `₹${fmt(preview.basePriceINR, 0)}`, colorClass: "text-slate-900" },
    { label: "Market P/L", val: `${(preview.marketPL ?? 0) >= 0 ? "↑" : "↓"} ₹${fmt(Math.abs(preview.marketPL ?? 0), 0)}`, colorClass: (preview.marketPL ?? 0) >= 0 ? "text-green-600" : "text-red-600" },
    { label: "Price (RUB)", val: preview.priceRUB == null ? "—" : `₽${fmt(preview.priceRUB, 0)}`, colorClass: "text-slate-900" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 font-[DM_Sans,sans-serif]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[900px] max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-[18px] border-b border-slate-100">
          <div>
            <h2 className="m-0 text-base font-bold text-slate-900">Edit Transaction</h2>
            <p className="m-0 mt-0.5 text-xs text-slate-400">{subtitle}</p>
          </div>
          <button onClick={onClose} className="border-none bg-transparent cursor-pointer p-1.5 rounded-lg text-slate-400 text-xl leading-none hover:text-slate-600">✕</button>
        </div>

        <div className="flex border-b border-slate-100 px-6">
          {EDIT_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`border-none bg-transparent cursor-pointer px-4 py-2.5 text-[13px] font-medium font-[DM_Sans,sans-serif] transition-colors duration-150 border-b-2 ${activeTab === tab.id ? "text-slate-900 border-blue-600" : "text-slate-400 border-transparent"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-4 gap-4">
            {activeKeys.map(key => {
              const col = COL_MAP[key];
              if (!col) return null;
              return (
                <div key={key}>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-[0.04em]">
                    {col.label}
                    {col.type === "preview" && <span className="text-slate-300 font-normal ml-0.5 normal-case text-[10px]"> (auto)</span>}
                  </label>
                  {renderField(col)}
                </div>
              );
            })}
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
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}


