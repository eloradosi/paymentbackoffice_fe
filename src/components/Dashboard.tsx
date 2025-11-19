import { useState, useEffect, useRef, JSX } from "react";
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Users,
  FileText,
  TrendingUp,
  Clock,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { notificationAPI, memberAPI, invoiceAPI } from "../lib/api";
import CustomSelect from "./ui/custim-select";

/* ---------------------------------------------------- */
/* COUNT-UP HOOK */
/* ---------------------------------------------------- */
function useCountUp(targetValue: number, duration = 800) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = timestamp - startTime.current;
      const percent = Math.min(progress / duration, 1);
      const animatedValue = Math.floor(percent * targetValue);
      setValue(animatedValue);

      if (percent < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [targetValue, duration]);

  return value;
}

/* ---------------------------------------------------- */
/* TYPES */
/* ---------------------------------------------------- */
type Notification = {
  id: number;
  receiver: string;
  time: string;
  status:
    | "Sent"
    | "sent"
    | "Failed"
    | "failed"
    | "Pending"
    | "pending"
    | "success";
  channel?: string;
  message?: string;
};

type PaginatedResponse = {
  data: Notification[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

interface DashboardProps {
  token: string;
}

/* ---------------------------------------------------- */
/* COMPONENT */
/* ---------------------------------------------------- */
export function Dashboard({ token }: DashboardProps) {
  // stats
  const [memberCount, setMemberCount] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);

  const [notifSent, setNotifSent] = useState(0);
  const [notifFailed, setNotifFailed] = useState(0);
  const [notifPending, setNotifPending] = useState(0);

  const totalNotif = notifSent + notifFailed + notifPending;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingNotif, setLoadingNotif] = useState(true);

  // smart polling state
  const lastTimeRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  const isInitializedRef = useRef(false);

  // server-side pagination state
  const [page, setPage] = useState(0); // BE uses 0-indexed pages
  const [perPage, setPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // animated values
  const animMember = useCountUp(memberCount);
  const animInvoice = useCountUp(invoiceCount);
  const animPaid = useCountUp(paidCount);
  const animUnpaid = useCountUp(unpaidCount);
  const animSent = useCountUp(notifSent);
  const animFailed = useCountUp(notifFailed);
  const animPending = useCountUp(notifPending);
  const animTotalNotif = useCountUp(totalNotif);

  // Group notifications by date
  const groupedNotifications = notifications.reduce((acc, notif) => {
    const date = new Date(notif.time).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(notif);
    return acc;
  }, {} as Record<string, Notification[]>);

  // reset page kalau perPage berubah
  useEffect(() => {
    setPage(0);
  }, [perPage]);

  // reload notifications when page or perPage changes
  useEffect(() => {
    loadNotifications(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  /* ---------------------------------------------------- */
  /* LOAD STATS (MEMBER + INVOICE) - DISABLED */
  /* ---------------------------------------------------- */
  const loadStats = async () => {
    try {
      setLoadingStats(true);

      // Fetch notification stats from BE
      const stats = await notificationAPI.getStats(token);
      setNotifSent(stats.notifTerkirim);
      setNotifFailed(stats.notifGagal);
      setNotifPending(stats.notifPending);

      // Commented out to reduce API calls - reload page to refresh
      // const members = await memberAPI.getAll(token);
      // setMemberCount(members.filter((m: any) => m.status === "active").length);

      // const inv = await invoiceAPI.getAll(token);
      // setInvoiceCount(inv.length);
      // setPaidCount(inv.filter((i: any) => i.status === "paid").length);
      // setUnpaidCount(inv.filter((i: any) => i.status === "unpaid").length);
    } catch (err) {
      console.error("Failed to load stats", err);
    } finally {
      setLoadingStats(false);
    }
  };

  /* ---------------------------------------------------- */
  /* LOAD NOTIFICATIONS (FULL LIST) */
  /* ---------------------------------------------------- */
  const applyNotificationData = (response: PaginatedResponse) => {
    const {
      data,
      page: currentPage,
      totalItems: total,
      totalPages: pages,
      hasNext: next,
      hasPrevious: prev,
    } = response;

    setNotifications(data);
    setPage(currentPage);
    setTotalItems(total);
    setTotalPages(pages);
    setHasNext(next);
    setHasPrevious(prev);

    if (data.length > 0) {
      lastTimeRef.current = data[0].time;
    }
  };

  const loadNotifications = async (showLoading = true) => {
    // Prevent duplicate calls
    if (isLoadingRef.current) {
      console.log("loadNotifications: already loading, skipping");
      return;
    }

    try {
      isLoadingRef.current = true;
      if (showLoading) setLoadingNotif(true);
      const res = await notificationAPI.getAll(token, page, perPage);
      applyNotificationData(res);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      if (showLoading) setLoadingNotif(false);
      isLoadingRef.current = false;
    }
  };

  /* ---------------------------------------------------- */
  /* INIT LOAD (NO POLLING - reload page to refresh) */
  /* ---------------------------------------------------- */
  useEffect(() => {
    // Prevent double call in React Strict Mode
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    let mounted = true;

    const init = async () => {
      await Promise.all([loadStats(), loadNotifications(true)]);
    };

    init();

    return () => {
      mounted = false;
    };
  }, [token]);

  /* ---------------------------------------------------- */
  /* STAT CARD (SOFT CORPORATE GRADIENT) */
  /* ---------------------------------------------------- */
  const StatCard = ({
    title,
    value,
    subtitle,
    icon,
    gradient,
  }: {
    title: string;
    value: any;
    subtitle: string;
    icon: JSX.Element;
    gradient: string;
  }) => {
    const g = gradient || "bg-indigo";
    const match = g.match(/(blue|emerald|violet|amber|red|slate|indigo)/);
    const colorKey = match ? match[1] : "indigo";

    const stops: Record<string, string[]> = {
      blue: ["#6D8BFF", "#2F4FDB"],
      emerald: ["#53D0A6", "#1F8F6D"],
      violet: ["#B49AFC", "#7450D4"],
      amber: ["#FFCF71", "#E69B00"],
      red: ["#FF7A7A", "#D73232"],
      indigo: ["#8B98FF", "#505ECC"],
      slate: ["#AEB6C7", "#7A8296"],
    };

    const [fromColor, toColor] = stops[colorKey] ?? stops["indigo"];

    const style: React.CSSProperties = {
      backgroundImage: `linear-gradient(135deg, ${fromColor}, ${toColor})`,
      borderRadius: "1rem",
    };

    return (
      <Card
        className="border-0 shadow-md text-white overflow-hidden relative"
        style={style}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8 z-0" />
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
          <CardTitle className="text-sm text-white">{title}</CardTitle>
          <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-white text-2xl font-semibold">
            {loadingStats && title !== "Total Notif" ? "..." : value}
          </div>
          <p className="text-xs text-white/80 mt-1">{subtitle}</p>
        </CardContent>
      </Card>
    );
  };

  /* ---------------------------------------------------- */
  /* RENDER */
  /* ---------------------------------------------------- */
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-slate-900 text-xl font-semibold">Dashboard</h2>
        <p className="text-sm text-slate-600">Overview pengiriman email</p>
      </div>

      {/* MAIN STATS: MEMBER & INVOICE */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Member"
          value={animMember}
          subtitle="Member aktif"
          gradient="bg-blue"
          icon={<Users className="h-5 w-5 text-white" />}
        />
        <StatCard
          title="Total Invoice"
          value={animInvoice}
          subtitle="Invoice dibuat"
          gradient="bg-emerald"
          icon={<FileText className="h-5 w-5 text-white" />}
        />
        <StatCard
          title="Sudah Lunas"
          value={animPaid}
          subtitle="Invoice paid"
          gradient="bg-violet"
          icon={<TrendingUp className="h-5 w-5 text-white" />}
        />
        <StatCard
          title="Belum Lunas"
          value={animUnpaid}
          subtitle="Invoice unpaid"
          gradient="bg-amber"
          icon={<Clock className="h-5 w-5 text-white" />}
        />
      </div> */}

      {/* NOTIFICATION STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Notif"
          value={animTotalNotif}
          subtitle="Semua status"
          gradient="bg-indigo"
          icon={<Bell className="h-5 w-5 text-white" />}
        />
        <StatCard
          title="Notif Terkirim"
          value={animSent}
          subtitle="Status: Sent"
          gradient="bg-emerald"
          icon={<CheckCircle className="h-5 w-5 text-white" />}
        />
        <StatCard
          title="Notif Gagal"
          value={animFailed}
          subtitle="Status: Failed"
          gradient="bg-red"
          icon={<XCircle className="h-5 w-5 text-white" />}
        />
        <StatCard
          title="Notif Pending"
          value={animPending}
          subtitle="Status: Pending"
          gradient="bg-amber"
          icon={<AlertCircle className="h-5 w-5 text-white" />}
        />
      </div>

      {/* FULL NOTIFICATION LOG TABLE */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notification Logs</CardTitle>
              <CardDescription>
                Riwayat pengiriman notifikasi dan status pengiriman
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadNotifications(true)}
            >
              {loadingNotif ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {loadingNotif ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70">
                      <th className="p-4 text-sm text-left font-medium text-slate-700">
                        Receiver
                      </th>
                      <th className="p-4 text-sm text-left font-medium text-slate-700">
                        Time
                      </th>
                      <th className="p-4 text-sm text-left font-medium text-slate-700">
                        Status
                      </th>
                      <th className="p-4 text-sm text-left font-medium text-slate-700">
                        Channel
                      </th>
                      <th className="p-4 text-sm text-left font-medium text-slate-700">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.length > 0 ? (
                      Object.entries(groupedNotifications).map(
                        ([date, notifs]) => (
                          <React.Fragment key={date}>
                            {/* Date Header Row */}
                            <tr className="bg-slate-100">
                              <td
                                colSpan={5}
                                className="p-3 text-sm font-semibold text-slate-700"
                              >
                                📅 {date}
                              </td>
                            </tr>
                            {/* Notification Rows */}
                            {notifs.map((l) => (
                              <tr
                                key={l.id}
                                className="border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors"
                              >
                                <td className="p-4 text-sm text-slate-800">
                                  {l.receiver}
                                </td>
                                <td className="p-4 text-sm text-slate-600">
                                  {new Date(l.time).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </td>
                                <td className="p-4 text-sm">
                                  <Badge
                                    variant="secondary"
                                    className={
                                      l.status === "Sent" ||
                                      l.status === "sent" ||
                                      l.status === "success"
                                        ? "bg-green-50 text-green-700 border border-green-200"
                                        : l.status === "Failed" ||
                                          l.status === "failed"
                                        ? "bg-red-50 text-red-700 border border-red-200"
                                        : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                                    }
                                  >
                                    {l.status === "success"
                                      ? "Sent"
                                      : l.status.charAt(0).toUpperCase() +
                                        l.status.slice(1).toLowerCase()}
                                  </Badge>
                                </td>
                                <td className="p-4 text-sm text-slate-600">
                                  {l.channel || "-"}
                                </td>
                                <td className="p-4 text-sm text-slate-600">
                                  {l.message || "-"}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        )
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-8 text-sm text-slate-600 bg-white"
                        >
                          Tidak ada notifikasi
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {notifications.length > 0 && (
                <div className="flex items-center justify-between mt-4 gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">
                      Menampilkan {totalItems === 0 ? 0 : page * perPage + 1} -{" "}
                      {Math.min((page + 1) * perPage, totalItems)} dari{" "}
                      {totalItems} notifikasi
                    </span>
                    <select
                      value={perPage}
                      onChange={(e) => setPerPage(Number(e.target.value))}
                      className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all cursor-pointer shadow-sm"
                    >
                      <option value={10}>10 per halaman</option>
                      <option value={20}>20 per halaman</option>
                      <option value={50}>50 per halaman</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={!hasPrevious}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Sebelumnya
                    </Button>
                    <span className="text-sm text-slate-600">
                      Halaman {page + 1} dari {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                      disabled={!hasNext}
                    >
                      Berikutnya
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
