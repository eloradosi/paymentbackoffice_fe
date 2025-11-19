import { Wallet, LayoutDashboard, Users, FileText, Table2 } from "lucide-react";
import { cn } from "../lib/utils";

interface SidebarProps {
  currentMenu:
    | "dashboard"
    | "members"
    | "invoices"
    | "rekapan"
    | "notifications";
  onMenuChange: (
    menu: "dashboard" | "members" | "invoices" | "rekapan" | "notifications"
  ) => void;
}

export function Sidebar({ currentMenu, onMenuChange }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "members", label: "Data Member", icon: Users },
    { id: "invoices", label: "Data Invoice", icon: FileText },
    { id: "rekapan", label: "Rekapan", icon: Table2 },
    { id: "notifications", label: "Notification Logs", icon: Table2 },
  ] as const;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg shadow-blue-500/30">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-slate-900">Uang Kas</h2>
            <p className="text-xs text-slate-600">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentMenu === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onMenuChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
