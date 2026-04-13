const NAV_ITEMS = [
  {
    id: "transactions",
    label: "Transactions",
    icon: (
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
    ),
  },
  {
    id: "masters",
    label: "Manage Masters",
    icon: (
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
];

export default function Sidebar({ collapsed, onToggle, activePage, onNavigate }) {
  return (
    <div
      style={{ width: collapsed ? 60 : 220, transition: "width 0.22s cubic-bezier(.4,0,.2,1)" }}
      className="h-screen bg-white border-r border-slate-200 flex flex-col flex-shrink-0 overflow-hidden z-40 sticky top-0 font-[DM_Sans,sans-serif]">

      {/* Logo + toggle */}
      <div className="flex items-center h-[60px] px-3 border-b border-slate-100 flex-shrink-0">
        <button
          onClick={onToggle}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors flex-shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

       
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-hidden">
        {NAV_ITEMS.map(item => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : ""}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg border-none cursor-pointer font-[DM_Sans,sans-serif] transition-all duration-150 text-left ${
                active
                  ? "bg-blue-50 text-blue-600"
                  : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}>
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="text-[13px] font-medium whitespace-nowrap overflow-hidden">{item.label}</span>
              )}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-slate-100">
          <p className="m-0 text-[10px] text-slate-300 font-medium uppercase tracking-[0.06em]">Diamond Mgmt v1.0</p>
        </div>
      )}
    </div>
  );
}