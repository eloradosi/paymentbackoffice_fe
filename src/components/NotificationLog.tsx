import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { notificationAPI } from "../lib/api";

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

interface NotificationLogProps {
  token: string;
}

export function NotificationLog({ token }: NotificationLogProps) {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<Notification[]>([]);

  // server-side pagination state
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // LOAD DATA
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll(token, page, perPage);
      setLogs(res.data);
      setTotalItems(res.totalItems);
      setTotalPages(res.totalPages);
      setHasNext(res.hasNext);
      setHasPrevious(res.hasPrevious);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  useEffect(() => {
    setPage(0);
  }, [perPage]);

  return (
    <div className="p-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notification Logs</CardTitle>
              <CardDescription>
                Riwayat pengiriman notifikasi dan status pengiriman
              </CardDescription>
            </div>
            <Button onClick={loadData} variant="outline" size="sm">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-slate-200 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="p-4 text-sm text-left">Receiver</th>
                      <th className="p-4 text-sm text-left">Time</th>
                      <th className="p-4 text-sm text-left">Status</th>
                      <th className="p-4 text-sm text-left">Channel</th>
                      <th className="p-4 text-sm text-left">Message</th>
                    </tr>
                  </thead>

                  <tbody>
                    {logs.length > 0 ? (
                      logs.map((l) => (
                        <tr
                          key={l.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="p-4 text-sm">{l.receiver}</td>

                          <td className="p-4 text-sm text-slate-600">
                            {new Date(l.time).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>

                          <td className="p-4">
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
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-8 text-sm text-slate-600"
                        >
                          Tidak ada notifikasi
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {logs.length > 0 && (
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
                      disabled={!hasPrevious}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" /> Sebelumnya
                    </Button>

                    <span>
                      Halaman {page + 1} / {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasNext}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Berikutnya <ChevronRight className="w-4 h-4" />
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
