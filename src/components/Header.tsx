import { Button } from "./ui/button";
import { LogOut, User } from "lucide-react";
import { User as UserType } from "../App";

interface HeaderProps {
  user: UserType | null;
  // optional: when not provided, logout button will be hidden
  onLogout?: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-slate-900">Dashboard</h1>
        <p className="text-xs text-slate-600">Monitoring pengiriman email notifikasi</p>
      </div>

      {/* User info and logout button hidden for dev mode */}
      {/* 
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-600">{user?.email}</p>
          </div>
        </div>
        
        {onLogout && (
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </Button>
        )}
      </div>
      */}
    </header>
  );
}
