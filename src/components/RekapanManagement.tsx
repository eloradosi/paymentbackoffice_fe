import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Loader2,
  Download,
  FileSpreadsheet,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { memberAPI, invoiceAPI } from "../lib/api";
import { Member, Invoice } from "../App";
import * as XLSX from "xlsx";

interface RekapanManagementProps {
  token: string;
}

interface RekapanData {
  memberId: string;
  memberName: string;
  payments: {
    [periode: string]: {
      status: "paid" | "unpaid";
      amount: number;
      paidDate?: string;
    };
  };
  totalPaid: number;
  totalUnpaid: number;
}

export function RekapanManagement({ token }: RekapanManagementProps) {
  const [loading, setLoading] = useState(true);
  const [rekapanData, setRekapanData] = useState<RekapanData[]>([]);
  const [allPeriodes, setAllPeriodes] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadRekapan();
  }, []);

  const loadRekapan = async () => {
    try {
      setLoading(true);
      const [members, invoices] = await Promise.all([
        memberAPI.getAll(token),
        invoiceAPI.getAll(token),
      ]);

      // Get all unique periods
      const periodesSet = new Set<string>();
      invoices.forEach((inv) => periodesSet.add(inv.periode));
      const sortedPeriodes = Array.from(periodesSet).sort();
      setAllPeriodes(sortedPeriodes);

      // Build rekapan data
      const rekapan: RekapanData[] = members.map((member) => {
        const memberInvoices = invoices.filter(
          (inv) => inv.memberId === member.id
        );
        const payments: RekapanData["payments"] = {};

        sortedPeriodes.forEach((periode) => {
          const invoice = memberInvoices.find((inv) => inv.periode === periode);
          if (invoice) {
            payments[periode] = {
              status: invoice.status,
              amount: invoice.amount,
              paidDate: invoice.paidAt,
            };
          } else {
            payments[periode] = {
              status: "unpaid",
              amount: 0,
            };
          }
        });

        const totalPaid = memberInvoices
          .filter((inv) => inv.status === "paid")
          .reduce((sum, inv) => sum + inv.amount, 0);
        const totalUnpaid =
          sortedPeriodes.length -
          memberInvoices.filter((inv) => inv.status === "paid").length;

        return {
          memberId: member.id,
          memberName: member.nama,
          payments,
          totalPaid,
          totalUnpaid,
        };
      });

      setRekapanData(rekapan);
    } catch (error) {
      toast.error("Gagal memuat data rekapan");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = rekapanData.map((item) => {
        const row: any = {
          "Nama Member": item.memberName,
        };

        // Add columns for each period
        allPeriodes.forEach((periode) => {
          const payment = item.payments[periode];
          row[periode] = payment.status === "paid" ? "LUNAS" : "BELUM";
        });

        row["Total Lunas"] = rekapanData.reduce((sum, d) => {
          return (
            sum +
            allPeriodes.filter((p) => d.payments[p].status === "paid").length
          );
        }, 0);

        row["Total Belum"] = item.totalUnpaid;
        row["Total Bayar"] = `Rp ${item.totalPaid.toLocaleString("id-ID")}`;

        return row;
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 25 }, // Nama Member
      ];
      allPeriodes.forEach(() => colWidths.push({ wch: 12 }));
      colWidths.push({ wch: 12 }, { wch: 12 }, { wch: 15 }); // Total columns
      ws["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Rekapan Pembayaran");

      // Generate filename with current date
      const date = new Date().toISOString().split("T")[0];
      const fileName = `Rekapan_Uang_Kas_${date}.xlsx`;

      // Download file
      XLSX.writeFile(wb, fileName);

      toast.success("File Excel berhasil didownload");
    } catch (error) {
      toast.error("Gagal export ke Excel");
    }
  };

  const exportToCSV = () => {
    try {
      // Prepare CSV header
      let csv =
        "Nama Member," +
        allPeriodes.join(",") +
        ",Total Lunas,Total Belum,Total Bayar\n";

      // Add data rows
      rekapanData.forEach((item) => {
        const row = [
          `"${item.memberName}"`,
          ...allPeriodes.map((p) => {
            const payment = item.payments[p];
            return payment.status === "paid" ? "LUNAS" : "BELUM";
          }),
          allPeriodes.filter((p) => item.payments[p].status === "paid").length,
          item.totalUnpaid,
          `"Rp ${item.totalPaid.toLocaleString("id-ID")}"`,
        ];
        csv += row.join(",") + "\n";
      });

      // Create blob and download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().split("T")[0];

      link.setAttribute("href", url);
      link.setAttribute("download", `Rekapan_Uang_Kas_${date}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("File CSV berhasil didownload");
    } catch (error) {
      toast.error("Gagal export ke CSV");
    }
  };

  const getStatusBadge = (status: "paid" | "unpaid") => {
    const variants = {
      paid: {
        className: "bg-green-50 text-green-700 border-green-200",
        label: "✓",
      },
      unpaid: {
        className: "bg-red-50 text-red-700 border-red-200",
        label: "✗",
      },
    };
    const variant = variants[status];
    return (
      <Badge variant="secondary" className={`${variant.className} text-xs`}>
        {variant.label}
      </Badge>
    );
  };

  // Pagination calculations
  const totalItems = rekapanData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = rekapanData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="p-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rekapan Pembayaran</CardTitle>
              <CardDescription>
                Lihat rekap pembayaran semua anggota per periode
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportToCSV} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button
                onClick={exportToExcel}
                className="gap-2 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 shadow-lg shadow-violet-500/30"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : (
            <>
              {/* Legend */}
              <div className="mb-4 flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-600">Keterangan:</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge("paid")}
                  <span className="text-xs text-slate-600">Lunas</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge("unpaid")}
                  <span className="text-xs text-slate-600">Belum Bayar</span>
                </div>
              </div>

              {/* Rekapan Table */}
              <div className="rounded-lg border border-slate-200 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left p-4 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                        <div className="text-sm">Nama Member</div>
                      </th>
                      {/* No HP column removed per request */}
                      {allPeriodes.map((periode) => (
                        <th
                          key={periode}
                          className="text-center p-4 min-w-[100px] border-r border-slate-200"
                        >
                          <div className="text-sm">{periode}</div>
                        </th>
                      ))}
                      <th className="text-center p-4 min-w-[100px] bg-green-50 border-r border-slate-200">
                        <div className="text-sm text-green-700">
                          Total Lunas
                        </div>
                      </th>
                      <th className="text-center p-4 min-w-[100px] bg-red-50 border-r border-slate-200">
                        <div className="text-sm text-red-700">Total Belum</div>
                      </th>
                      <th className="text-right p-4 min-w-[120px] bg-blue-50">
                        <div className="text-sm text-blue-700">Total Bayar</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.length > 0 ? (
                      currentData.map((item, index) => (
                        <tr
                          key={item.memberId}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="p-4 sticky left-0 bg-white z-10 border-r border-slate-200">
                            <div className="text-sm text-slate-900">
                              {item.memberName}
                            </div>
                          </td>
                          {/* No HP column removed */}
                          {allPeriodes.map((periode) => {
                            const payment = item.payments[periode];
                            return (
                              <td
                                key={periode}
                                className="p-4 text-center border-r border-slate-200"
                              >
                                {getStatusBadge(payment.status)}
                              </td>
                            );
                          })}
                          <td className="p-4 text-center bg-green-50/50 border-r border-slate-200">
                            <span className="text-sm text-green-700">
                              {
                                allPeriodes.filter(
                                  (p) => item.payments[p].status === "paid"
                                ).length
                              }
                            </span>
                          </td>
                          <td className="p-4 text-center bg-red-50/50 border-r border-slate-200">
                            <span className="text-sm text-red-700">
                              {item.totalUnpaid}
                            </span>
                          </td>
                          <td className="p-4 text-right bg-blue-50/50">
                            <span className="text-sm text-blue-700">
                              Rp {item.totalPaid.toLocaleString("id-ID")}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={allPeriodes.length + 4}
                          className="text-center py-8 text-slate-600"
                        >
                          Belum ada data rekapan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {rekapanData.length > 0 && (
                <div className="flex items-center justify-between mt-4 gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">
                      Menampilkan {startIndex + 1} -{" "}
                      {Math.min(endIndex, totalItems)} dari {totalItems} member
                    </span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={handleItemsPerPageChange}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 per halaman</SelectItem>
                        <SelectItem value="25">25 per halaman</SelectItem>
                        <SelectItem value="50">50 per halaman</SelectItem>
                        <SelectItem value="100">100 per halaman</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Sebelumnya
                    </Button>

                    {getPageNumbers().map((page, index) =>
                      page === "..." ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-2 text-slate-400"
                        >
                          ...
                        </span>
                      ) : (
                        <Button
                          key={page}
                          onClick={() => handlePageChange(page as number)}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className={
                            currentPage === page
                              ? "bg-violet-600 hover:bg-violet-700"
                              : ""
                          }
                        >
                          {page}
                        </Button>
                      )
                    )}

                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      Selanjutnya
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Summary */}
              {rekapanData.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border-0 shadow bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-4">
                      <p className="text-xs text-blue-100 mb-1">Total Member</p>
                      <p className="text-white">{rekapanData.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow bg-gradient-to-br from-violet-500 to-violet-600 text-white">
                    <CardContent className="p-4">
                      <p className="text-xs text-violet-100 mb-1">
                        Total Periode
                      </p>
                      <p className="text-white">{allPeriodes.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <CardContent className="p-4">
                      <p className="text-xs text-green-100 mb-1">
                        Total Pembayaran Lunas
                      </p>
                      <p className="text-white">
                        {rekapanData.reduce(
                          (sum, item) =>
                            sum +
                            allPeriodes.filter(
                              (p) => item.payments[p].status === "paid"
                            ).length,
                          0
                        )}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <CardContent className="p-4">
                      <p className="text-xs text-emerald-100 mb-1">
                        Total Terkumpul
                      </p>
                      <p className="text-white text-sm">
                        Rp{" "}
                        {rekapanData
                          .reduce((sum, item) => sum + item.totalPaid, 0)
                          .toLocaleString("id-ID")}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
