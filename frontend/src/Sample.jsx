import { useState, useRef, useEffect } from "react";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs";

const COLUMNS = [
  { key: "Shipping no", label: "Shipping No", width: "w-28", type: "text" },
  { key: "SKU no.", label: "SKU No.", width: "w-24", type: "text" },
  { key: "Currier", label: "Courier", width: "w-28", type: "text" },
  { key: "Supplier", label: "Supplier", width: "w-28", type: "text" },
  { key: "Buyer", label: "Buyer", width: "w-28", type: "text" },
  { key: "Date of purchase", label: "Date of Purchase", width: "w-32", type: "date" },
  { key: "Shape", label: "Shape", width: "w-24", type: "text" },
  { key: "Waight", label: "Weight (ct)", width: "w-24", type: "number", dependencies: ["Price per ct. USD", "Price (USD)", "Price per ct"] },
  { key: "Number Of Certy", label: "Cert. No.", width: "w-28", type: "text" },
  { key: "Price per ct. USD", label: "Price/ct (USD)", width: "w-28", type: "number", dependencies: ["Waight", "GST %", "Buy price total"] },
  { key: "GST %", label: "GST %", width: "w-20", type: "number", dependencies: ["Buy price total", "GST amount"] },
  { key: "GST amount", label: "GST Amt", width: "w-24", type: "number", readOnly: true },
  { key: "Buy price total", label: "Buy Price Total", width: "w-28", type: "number", readOnly: true },
  { key: "Currency", label: "Currency", width: "w-22", type: "text" },
  { key: "Rate", label: "Rate", width: "w-20", type: "number", dependencies: ["Based currency INR", "Actual price INR"] },
  { key: "Based currency INR", label: "Base (INR)", width: "w-28", type: "number", readOnly: true },
  { key: "Correction price USD", label: "Correction (USD)", width: "w-28", type: "number" },
  { key: "Actual rate", label: "Actual Rate", width: "w-24", type: "number" },
  { key: "Actual price  INR", label: "Actual Price (INR)", width: "w-32", type: "number", readOnly: true },
  { key: "Market P/L", label: "Market P/L", width: "w-24", type: "number", readOnly: true },
  { key: "Mark up", label: "Mark Up", width: "w-20", type: "number", dependencies: ["Sell price local currency"] },
  { key: "Sell price local currency", label: "Sell Price (Local)", width: "w-32", type: "number" },
  { key: "Local currency", label: "Local Currency", width: "w-28", type: "text" },
  { key: "Type of exchange", label: "Exchange Type", width: "w-28", type: "text" },
  { key: "Payment status", label: "Payment Status", width: "w-28", type: "select", options: ["Paid", "Pending"] },
  { key: "Status", label: "Status", width: "w-24", type: "select", options: ["In Stock", "Sold", "Pending"] },
  { key: "Wirehouse", label: "Warehouse", width: "w-24", type: "text" },
  { key: "Inventory date", label: "Inventory Date", width: "w-28", type: "date" },
  { key: "Inventory manager", label: "Inv. Manager", width: "w-28", type: "text" },
  { key: "Inventory history", label: "Inv. History", width: "w-28", type: "text" },
  { key: "Синтез", label: "Synthesis", width: "w-24", type: "text" },
  { key: "Cut", label: "Cut", width: "w-24", type: "text" },
  { key: "Ct", label: "Ct", width: "w-16", type: "number" },
  { key: "Colour", label: "Colour", width: "w-20", type: "text" },
  { key: "Clarity", label: "Clarity", width: "w-20", type: "text" },
  { key: "Price (RUB)", label: "Price (RUB)", width: "w-24", type: "number" },
  { key: "Price (USD)", label: "Price (USD)", width: "w-24", type: "number", readOnly: true },
  { key: "Price per ct", label: "Price/ct", width: "w-24", type: "number", readOnly: true },
  { key: "Rate.1", label: "Rate", width: "w-20", type: "number" },
  { key: "Location", label: "Location", width: "w-24", type: "text" },
  { key: "Laboratory", label: "Laboratory", width: "w-24", type: "text" },
  { key: "Sertificate", label: "Certificate", width: "w-28", type: "text" },
  { key: "Mesurment", label: "Measurements", width: "w-32", type: "text" },
  { key: "Date of sale", label: "Date of Sale", width: "w-28", type: "date" },
  { key: "Buyer.1", label: "Final Buyer", width: "w-28", type: "text" },
  { key: "Sale amount", label: "Sale Amount", width: "w-24", type: "number" },
  { key: "Currency.1", label: "Sale Currency", width: "w-28", type: "text" },
  { key: "Rate on dare of sale", label: "Rate on Sale", width: "w-28", type: "number" },
  { key: "Base currency", label: "Base Currency", width: "w-28", type: "number" },
  { key: "Base currency.1", label: "Base Currency 2", width: "w-28", type: "number" },
  { key: "Marginality", label: "Marginality", width: "w-24", type: "number", readOnly: true },
  { key: "Actual markup", label: "Actual Markup", width: "w-24", type: "number" },
  { key: "Manager", label: "Manager", width: "w-24", type: "text" },
  { key: "Bonus points", label: "Bonus Pts", width: "w-24", type: "number" },
  { key: "Bonus amount", label: "Bonus Amt", width: "w-24", type: "number" },
  { key: "Rate.2", label: "Rate", width: "w-20", type: "number" },
  { key: "Bonus in local currency", label: "Bonus (Local)", width: "w-28", type: "number" },
];

const STATUS_STYLES = {
  "In Stock": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Sold: "bg-blue-50 text-blue-700 border border-blue-200",
  Pending: "bg-amber-50 text-amber-700 border border-amber-200",
  default: "bg-slate-50 text-slate-600 border border-slate-200",
};

const PAYMENT_STYLES = {
  Paid: "bg-green-50 text-green-700 border border-green-200",
  Pending: "bg-orange-50 text-orange-700 border border-orange-200",
  default: "bg-slate-50 text-slate-500 border border-slate-200",
};

function Badge({ value, styleMap }) {
  if (!value) return <span className="text-slate-300">—</span>;
  const cls = styleMap[value] || styleMap.default;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {value}
    </span>
  );
}

function formatCell(key, value) {
  if (value === null || value === undefined || value === "") return <span className="text-slate-300">—</span>;

  if (key === "Status") return <Badge value={value} styleMap={STATUS_STYLES} />;
  if (key === "Payment status") return <Badge value={value} styleMap={PAYMENT_STYLES} />;

  if (
    typeof value === "number" &&
    (key.toLowerCase().includes("price") ||
      key.toLowerCase().includes("amount") ||
      key.toLowerCase().includes("inr") ||
      key.toLowerCase().includes("rub") ||
      key.toLowerCase().includes("usd") ||
      key === "GST amount" ||
      key === "Based currency INR" ||
      key === "Actual price  INR" ||
      key === "Base currency" ||
      key === "Base currency.1" ||
      key === "Bonus amount" ||
      key === "Bonus in local currency" ||
      key === "Sale amount")
  ) {
    return (
      <span className="font-mono text-slate-700">
        {Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </span>
    );
  }

  if (key === "Market P/L" && typeof value === "number") {
    const pos = value >= 0;
    return (
      <span className={`font-mono font-medium ${pos ? "text-emerald-600" : "text-red-500"}`}>
        {pos ? "+" : ""}
        {Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </span>
    );
  }

  if (value instanceof Date) {
    return <span>{value.toLocaleDateString("en-IN")}</span>;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return <span>{new Date(value).toLocaleDateString("en-IN")}</span>;
  }

  if (typeof value === "number") {
    return <span className="font-mono text-slate-700">{Number(value).toLocaleString("en-IN", { maximumFractionDigits: 4 })}</span>;
  }

  return <span>{String(value)}</span>;
}

// Calculation functions
const calculateValues = (data) => {
  const newData = { ...data };
  
  // Calculate Buy Price Total = Weight * Price per ct. USD
  if (newData["Waight"] && newData["Price per ct. USD"]) {
    newData["Buy price total"] = newData["Waight"] * newData["Price per ct. USD"];
  }
  
  // Calculate GST Amount = Buy Price Total * (GST % / 100)
  if (newData["Buy price total"] && newData["GST %"]) {
    newData["GST amount"] = newData["Buy price total"] * (newData["GST %"] / 100);
  }
  
  // Calculate Based currency INR = Buy Price Total * Rate
  if (newData["Buy price total"] && newData["Rate"]) {
    newData["Based currency INR"] = newData["Buy price total"] * newData["Rate"];
  }
  
  // Calculate Actual price INR = Based currency INR + Correction price USD * Rate
  if (newData["Based currency INR"] && newData["Correction price USD"] && newData["Rate"]) {
    newData["Actual price  INR"] = newData["Based currency INR"] + (newData["Correction price USD"] * newData["Rate"]);
  } else if (newData["Based currency INR"]) {
    newData["Actual price  INR"] = newData["Based currency INR"];
  }
  
  // Calculate Price (USD) = Weight * Price per ct
  if (newData["Waight"] && newData["Price per ct"]) {
    newData["Price (USD)"] = newData["Waight"] * newData["Price per ct"];
  }
  
  // Calculate Market P/L = Actual price INR - Based currency INR
  if (newData["Actual price  INR"] && newData["Based currency INR"]) {
    newData["Market P/L"] = newData["Actual price  INR"] - newData["Based currency INR"];
  }
  
  // Calculate Sell price local currency = Buy price total * (1 + Mark up / 100)
  if (newData["Buy price total"] && newData["Mark up"]) {
    newData["Sell price local currency"] = newData["Buy price total"] * (1 + newData["Mark up"] / 100);
  }
  
  // Calculate Marginality = (Sell price local currency - Buy price total) / Buy price total * 100
  if (newData["Sell price local currency"] && newData["Buy price total"] && newData["Buy price total"] !== 0) {
    newData["Marginality"] = ((newData["Sell price local currency"] - newData["Buy price total"]) / newData["Buy price total"]) * 100;
  }
  
  return newData;
};

function EditModal({ diamond, index, onSave, onClose }) {
  const [formData, setFormData] = useState(() => calculateValues({ ...diamond }));
  const [activeTab, setActiveTab] = useState("general");

  const handleChange = (key, value) => {
    let updatedData = { ...formData, [key]: value };
    
    // Convert empty strings to null for numbers
    COLUMNS.forEach(col => {
      if (col.type === "number" && updatedData[col.key] === "") {
        updatedData[col.key] = null;
      }
    });
    
    // Recalculate all dependent values
    updatedData = calculateValues(updatedData);
    setFormData(updatedData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(index, formData);
    onClose();
  };

  // Group columns for better organization
  const generalColumns = COLUMNS.slice(0, 20);
  const pricingColumns = COLUMNS.slice(20, 35);
  const salesColumns = COLUMNS.slice(35, 45);
  const additionalColumns = COLUMNS.slice(45);

  const renderField = (col) => {
    const value = formData[col.key] || "";
    
    if (col.type === "select") {
      return (
        <select
          value={value}
          onChange={(e) => handleChange(col.key, e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        >
          <option value="">Select {col.label}</option>
          {col.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    
    if (col.type === "date") {
      const dateValue = value ? (value instanceof Date ? value.toISOString().split('T')[0] : value.split('T')[0]) : "";
      return (
        <input
          type="date"
          value={dateValue}
          onChange={(e) => handleChange(col.key, e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        />
      );
    }
    
    if (col.type === "number") {
      return (
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => handleChange(col.key, e.target.value === "" ? null : parseFloat(e.target.value))}
          readOnly={col.readOnly}
          className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent ${
            col.readOnly ? "bg-slate-50 text-slate-600" : ""
          }`}
        />
      );
    }
    
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(col.key, e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
      />
    );
  };

  const renderColumnGroup = (columns, title) => (
    <div className="mb-6">
      <h3 className="text-md font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div key={col.key} className="flex flex-col">
            <label className="text-xs font-medium text-slate-600 mb-1">
              {col.label}
              {col.readOnly && <span className="ml-1 text-xs text-slate-400">(Auto)</span>}
            </label>
            {renderField(col)}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Edit Diamond Details</h2>
            <p className="text-sm text-slate-500 mt-1">
              SKU: {formData["SKU no."] || "N/A"} | Weight: {formData["Waight"] || "N/A"} ct
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 px-6">
          <div className="flex gap-4">
            {[
              { id: "general", label: "General Information" },
              { id: "pricing", label: "Pricing & Currency" },
              { id: "sales", label: "Sales Information" },
              { id: "additional", label: "Additional Details" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {activeTab === "general" && renderColumnGroup(generalColumns, "General Information")}
          {activeTab === "pricing" && renderColumnGroup(pricingColumns, "Pricing & Currency")}
          {activeTab === "sales" && renderColumnGroup(salesColumns, "Sales Information")}
          {activeTab === "additional" && renderColumnGroup(additionalColumns, "Additional Details")}
          
          {/* Summary Cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Total Value (USD)</p>
              <p className="text-lg font-semibold text-slate-900">
                ${(formData["Buy price total"] || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Total Value (INR)</p>
              <p className="text-lg font-semibold text-slate-900">
                ₹{(formData["Based currency INR"] || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Market P/L</p>
              <p className={`text-lg font-semibold ${(formData["Market P/L"] || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {(formData["Market P/L"] || 0) >= 0 ? "+" : ""}
                ₹{(formData["Market P/L"] || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Marginality</p>
              <p className="text-lg font-semibold text-slate-900">
                {(formData["Marginality"] || 0).toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Sample() {
  const [rows, setRows] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [search, setSearch] = useState("");
  const [editingDiamond, setEditingDiamond] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const fileRef = useRef();

  const parseExcel = async (file) => {
    setIsLoading(true);
    setFileName(file.name);
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
    
    // Apply calculations to all rows
    const calculatedData = data.map(row => calculateValues(row));
    setRows(calculatedData);
    setIsLoading(false);
  };

  const handleFile = (file) => {
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
      parseExcel(file);
    }
  };

  const handleRowClick = (row, index) => {
    setEditingDiamond(row);
    setEditingIndex(index);
  };

  const handleSave = (index, updatedDiamond) => {
    const newRows = [...rows];
    newRows[index] = calculateValues(updatedDiamond);
    setRows(newRows);
  };

  const filtered = rows.filter((row) =>
    search
      ? COLUMNS.some((col) => String(row[col.key] ?? "").toLowerCase().includes(search.toLowerCase()))
      : true
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l8 5v8l-8 5-8-5V8l8-5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Diamond Stock</h1>
            <p className="text-xs text-slate-400">Inventory Management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {rows.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-48"
              />
            </div>
          )}
          <button
            onClick={() => fileRef.current.click()}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4-4 4 4M12 8v8" />
            </svg>
            Import Excel
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      </div>

      <div className="px-6 py-4">
        {/* Stats bar */}
        {rows.length > 0 && (
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span><span className="font-semibold text-slate-900">{rows.filter(r => r["Status"] === "In Stock").length}</span> In Stock</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span><span className="font-semibold text-slate-900">{rows.filter(r => r["Status"] === "Sold").length}</span> Sold</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 rounded-full bg-slate-300"></div>
              <span><span className="font-semibold text-slate-900">{filtered.length}</span> {search ? "Filtered" : "Total"} Records</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-400">Total Inventory Value</p>
                <p className="text-sm font-semibold text-slate-900">
                  ₹{rows.reduce((sum, row) => sum + (row["Based currency INR"] || 0), 0).toLocaleString("en-IN")}
                </p>
              </div>
              {fileName && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {fileName}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Drop zone / Empty state */}
        {rows.length === 0 && !isLoading && (
          <div
            className={`border-2 border-dashed rounded-xl transition-all mb-4 ${
              isDragging ? "border-slate-400 bg-slate-100" : "border-slate-200 bg-white"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
          >
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3l8 5v8l-8 5-8-5V8l8-5z" />
                </svg>
              </div>
              <p className="text-slate-700 font-medium mb-1">No diamonds imported yet</p>
              <p className="text-slate-400 text-sm mb-4">Import an Excel file or drag & drop here to populate the table</p>
              <button
                onClick={() => fileRef.current.click()}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4-4 4 4M12 8v8" />
                </svg>
                Import Excel File
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-24 bg-white rounded-xl border border-slate-200">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-500">Loading diamonds...</p>
            </div>
          </div>
        )}

        {/* Table */}
        {!isLoading && rows.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-900">
                    <th className="sticky left-0 z-20 bg-slate-900 px-3 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider whitespace-nowrap border-r border-slate-700">
                      #
                    </th>
                    {COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className="px-3 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider whitespace-nowrap border-r border-slate-800 last:border-r-0"
                      >
                        {col.label}
                      </th>
                    ))}
                   </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const originalIndex = rows.findIndex(r => r === row);
                    return (
                      <tr
                        key={i}
                        onClick={() => handleRowClick(row, originalIndex)}
                        className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                      >
                        <td className="sticky left-0 z-10 bg-inherit px-3 py-2.5 text-slate-400 text-xs border-r border-slate-100 font-mono">
                          {i + 1}
                        </td>
                        {COLUMNS.map((col) => (
                          <td
                            key={col.key}
                            className="px-3 py-2.5 text-xs text-slate-700 border-r border-slate-100 last:border-r-0 whitespace-nowrap"
                          >
                            {formatCell(col.key, row[col.key])}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between bg-slate-50/50">
              <p className="text-xs text-slate-400">
                Showing <span className="font-medium text-slate-600">{filtered.length}</span> of{" "}
                <span className="font-medium text-slate-600">{rows.length}</span> records
              </p>
              <button
                onClick={() => { setRows([]); setFileName(""); setSearch(""); }}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingDiamond && (
        <EditModal
          diamond={editingDiamond}
          index={editingIndex}
          onSave={handleSave}
          onClose={() => {
            setEditingDiamond(null);
            setEditingIndex(null);
          }}
        />
      )}
    </div>
  );
}