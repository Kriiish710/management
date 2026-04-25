import { useState } from "react";
import Sidebar from "./pages/Sidebar";
import Sample from "./Sample";
import Masters from "./pages/Masters";
import "./App.css";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap";
document.head.appendChild(fontLink);

export default function App() {
  console.log(import.meta.env.VITE_API_URL);
  const [collapsed, setCollapsed]   = useState(false);
  const [activePage, setActivePage] = useState("transactions");
  const [showCreate, setShowCreate] = useState(false);

  const renderPage = () => {
    if (showCreate) return (
      <CreateTransaction
        onBack={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); setActivePage("transactions"); }}
      />
    );
    if (activePage === "transactions") return (
      <Sample onCreateClick={() => setShowCreate(true)} />
    );
    if (activePage === "masters") return (
      <Masters />
    );
    return null;
  };

  return (
    <div className="flex h-screen overflow-hidden font-[DM_Sans,sans-serif]">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(p => !p)}
        activePage={showCreate ? "transactions" : activePage}
        onNavigate={(page) => { setShowCreate(false); setActivePage(page); }}
      />
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {renderPage()}
      </div>
    </div>
  );
}