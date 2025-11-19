import { useState, useEffect } from "react";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { MemberManagement } from "./components/MemberManagement";
import { InvoiceManagement } from "./components/InvoiceManagement";
import { RekapanManagement } from "./components/RekapanManagement";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Toaster } from "./components/ui/sonner";
import { authAPI } from "./lib/api";
import { toast } from "sonner";
import { NotificationLog } from "./components/NotificationLog";

export interface Member {
  id: string;
  // Indonesian naming
  nama?: string;
  noHp?: string;
  // alternative names used in some components
  name?: string;
  position?: string;
  joinDate?: string;
  status: "active" | "inactive";
  createdAt?: string;
}

export interface Invoice {
  id: string;
  memberId: string;
  memberName: string;
  periode: string;
  amount: number;
  status: "paid" | "unpaid";
  buktiPembayaran?: string;
  createdAt: string;
  paidAt?: string;
}

export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
  period: string;
  notes?: string;
}

export interface User {
  name: string;
  email: string;
  token: string;
}

export default function App() {
  // Auto-authenticated for dev: always show dashboard without login
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [user, setUser] = useState<User | null>({
    name: "admin",
    email: "admin",
    token: "dev-mock-token-admin",
  });
  const [currentMenu, setCurrentMenu] = useState<
    "dashboard" | "members" | "invoices" | "rekapan" | "notifications"
  >("dashboard");

  // keep the existing localStorage check, but don't override our dev auto-login
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user_data");

    if (token && userData) {
      setIsAuthenticated(true);
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        // ignore parse errors and keep dev user
      }
    }
  }, []);

  const handleLogin = (
    username: string,
    password: string
  ): Promise<boolean> => {
    // Call real backend auth endpoint
    return new Promise(async (resolve) => {
      try {
        const resp = await authAPI.login(username, password);

        // store token and user info
        const token = resp.token;
        const expiresAt = Date.now() + resp.expires_in * 1000;
        const userData: User = {
          name: username,
          email: username,
          token,
        };

        localStorage.setItem("auth_token", token);
        localStorage.setItem(
          "user_data",
          JSON.stringify({
            ...userData,
            role: resp.role,
            expires_at: expiresAt,
          })
        );

        setIsAuthenticated(true);
        setUser(userData);
        toast.success("Berhasil login");
        resolve(true);
      } catch (err: any) {
        console.error("Login error", err);
        toast.error("Gagal login: " + (err?.message || "Unknown error"));
        resolve(false);
      }
    });
  };

  const handleLogout = () => {
    // Keep signature synchronous for Header prop; run async logout in background
    const token = localStorage.getItem("auth_token") || user?.token || "";
    (async () => {
      try {
        console.debug("handleLogout: token", token);
        const resp = await authAPI.logout(token);
        console.debug("handleLogout: logout resp", resp);
        toast.success(resp?.message || "Logged out successfully");
      } catch (err: any) {
        console.error("Logout error", err);
        toast.error("Gagal logout: " + (err?.message || "Unknown error"));
      } finally {
        // always clear session client-side
        console.debug(
          "handleLogout: clearing local storage and resetting state"
        );
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
        setIsAuthenticated(false);
        setUser(null);
        setCurrentMenu("dashboard");
      }
    })();
  };

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar hidden - menu navigation disabled */}
      {/* <Sidebar currentMenu={currentMenu} onMenuChange={setCurrentMenu} /> */}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Hide logout by not passing onLogout (dev mode: no logout) */}
        <Header user={user} />

        <main className="flex-1 overflow-y-auto">
          {currentMenu === "dashboard" && (
            <Dashboard token={user?.token || ""} />
          )}
          {currentMenu === "members" && (
            <MemberManagement token={user?.token || ""} />
          )}
          {currentMenu === "invoices" && (
            <InvoiceManagement token={user?.token || ""} />
          )}
          {currentMenu === "rekapan" && (
            <RekapanManagement token={user?.token || ""} />
          )}
          {currentMenu === "notifications" && (
            <NotificationLog token={user?.token || ""} />
          )}
        </main>
      </div>

      <Toaster />
    </div>
  );
}
