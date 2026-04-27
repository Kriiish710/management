import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import Sidebar from "./pages/Sidebar";
import Sample from "./Sample";
import Masters from "./pages/Masters";
import ProfitLoss from "./pages/ProfitLoss";
import CreateTransactionPage from "./forms/CreateTransactionModal";
import EditTransactionPage from "./forms/EditTransactionModal";
import "./App.css";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap";
document.head.appendChild(fontLink);

// ── Which sidebar item is "active" based on current path ─────────────────────
function getActivePage(pathname) {
  if (pathname.startsWith("/transactions")) return "transactions";
  if (pathname.startsWith("/pnl"))          return "pnl";
  if (pathname.startsWith("/masters"))      return "masters";
  return "transactions";
}

// ── Inner layout (needs useNavigate, so must be inside BrowserRouter) ────────
function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate  = useNavigate();
  const pathname  = window.location.pathname;
  const activePage = getActivePage(pathname);

  const handleNavigate = (page) => {
    if (page === "transactions") navigate("/transactions");
    else if (page === "pnl")     navigate("/pnl");
    else if (page === "masters") navigate("/masters");
  };

  return (
    <div className="flex h-screen overflow-hidden font-[DM_Sans,sans-serif]">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(p => !p)}
        activePage={activePage}
        onNavigate={handleNavigate}
      />
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <Routes>
          <Route path="/"                         element={<Sample />} />
          <Route path="/transactions"             element={<Sample />} />
          <Route path="/transactions/create"      element={<CreateTransactionPage />} />
          <Route path="/transactions/:id/edit"    element={<EditTransactionPage />} />
          <Route path="/pnl"                      element={<ProfitLoss />} />
          <Route path="/masters"                  element={<Masters />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}