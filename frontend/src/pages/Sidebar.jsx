const NAV_ITEMS = [
  {
    id: "transactions",
    label: "Transactions",
    description: "View & manage",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: "masters",
    label: "Manage Masters",
    description: "Config & settings",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

export default function Sidebar({ collapsed, onToggle, activePage, onNavigate }) {
  return (
    <div
      style={{ width: collapsed ? 64 : 228, transition: "width 0.22s cubic-bezier(.4,0,.2,1)" }}
      className="h-screen bg-white border-r border-slate-200 flex flex-col flex-shrink-0 overflow-hidden z-40 sticky top-0 font-[DM_Sans,sans-serif]"
    >
      {/* ── Logo + toggle ── */}
      <div className="flex items-center gap-2.5 h-[60px] px-3 border-b border-slate-100 flex-shrink-0">
        <button
          onClick={onToggle}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors flex-shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md bg-blue-600">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 5v8l-8 5-8-5V8l8-5z" />
              </svg>
            </div>
            <span className="text-[13px] font-bold text-slate-800 truncate leading-tight tracking-tight">
              Diamond
            </span>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-4 px-2.5 flex flex-col gap-0.5 overflow-hidden">
        

        {NAV_ITEMS.map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : ""}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              className={`
                w-full border-none cursor-pointer text-left rounded-xl outline-none
                flex items-center transition-all duration-150 relative
                ${collapsed ? "justify-center p-1.5" : "justify-start gap-2.5 px-2.5 py-2"}
                ${active
                  ? "bg-blue-50 text-blue-700"
                  : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }
              `}
            >
              {/* Active left accent bar */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2  w-[3px] h-5 bg-blue-600 rounded-r-full" />
              )}

              {/* Icon — fixed square, uniform padding on all sides */}
              <span
                className={`
                  flex-shrink-0 flex items-center justify-center rounded-lg w-9 h-9 transition-all duration-150
                  ${active ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}
                `}
              >
                {item.icon}
              </span>

              {/* Label + description */}
              {!collapsed && (
                <span className="flex flex-col min-w-0 flex-1">
                  <span className={`text-[13px] leading-tight truncate ${active ? "font-semibold text-blue-700" : "font-medium text-slate-700"}`}>
                    {item.label}
                  </span>
                  <span className={`text-[11px] truncate mt-0.5 ${active ? "text-blue-400" : "text-slate-400"}`}>
                    {item.description}
                  </span>
                </span>
              )}

              {/* Active dot */}
              {active && !collapsed && (
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom ── */}
      <div className={`border-t border-slate-100 flex-shrink-0 ${collapsed ? "py-3 flex justify-center" : "p-3"}`}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 5v8l-8 5-8-5V8l8-5z" />
            </svg>
          </div>
        ) : (
          <div className="rounded-xl p-3 flex items-center gap-2.5 bg-slate-50 border border-slate-100">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-100">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 5v8l-8 5-8-5V8l8-5z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="m-0 text-[12px] font-semibold text-slate-700 truncate leading-tight">Diamond Mgmt</p>
              <p className="m-0 text-[10px] text-slate-400 mt-0.5">v1.0 · Production</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}