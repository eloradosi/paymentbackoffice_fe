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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Plus,
  Loader2,
  CheckCircle,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { invoiceAPI, memberAPI } from "../lib/api";
import { Invoice, Member } from "../App";

interface InvoiceManagementProps {
  token: string;
}

export function InvoiceManagement({ token }: InvoiceManagementProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openApprovalDialog, setOpenApprovalDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    memberId: "",
    periode: "",
    amount: "50000",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesData, membersData] = await Promise.all([
        invoiceAPI.getAll(token),
        memberAPI.getAll(token),
      ]);
      setInvoices(invoicesData);
      setMembers(membersData.filter((m) => m.status === "active"));
    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.memberId || !formData.periode) {
      toast.error("Semua field harus diisi");
      return;
    }

    try {
      const member = members.find((m) => m.id === formData.memberId);
      if (!member) return;

      // Convert YYYY-MM to MMYYYY format
      const [year, month] = formData.periode.split("-");
      const periodeFormatted = `${month}${year}`;

      await invoiceAPI.create(token, {
        memberId: formData.memberId,
        memberName: member.nama,
        periode: periodeFormatted,
        amount: Number(formData.amount),
        status: "unpaid",
      });

      toast.success("Invoice berhasil dibuat");
      await loadData();
      closeAddDialog();
    } catch (error) {
      toast.error("Gagal membuat invoice");
    }
  };

  const handleApprove = async () => {
    if (!selectedInvoice) return;

    try {
      await invoiceAPI.approve(token, selectedInvoice.id);
      toast.success("Pembayaran berhasil disetujui");
      await loadData();
      setOpenApprovalDialog(false);
      setSelectedInvoice(null);
    } catch (error) {
      toast.error("Gagal menyetujui pembayaran");
    }
  };

  const openApproval = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setOpenApprovalDialog(true);
  };

  const closeAddDialog = () => {
    setOpenAddDialog(false);
    setFormData({
      memberId: "",
      periode: "",
      amount: "50000",
    });
  };

  const getStatusBadge = (status: "paid" | "unpaid") => {
    if (status === "paid") {
      return (
        <Badge
          variant="secondary"
          className="bg-green-50 text-green-700 border-green-200"
        >
          Lunas
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="secondary"
          className="bg-red-50 text-red-700 border-red-200"
        >
          Belum Lunas
        </Badge>
      );
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = invoices.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(invoices.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="p-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Data Invoice</CardTitle>
              <CardDescription>
                Kelola invoice dan approval pembayaran
              </CardDescription>
            </div>
            <Button
              onClick={() => setOpenAddDialog(true)}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Invoice
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-slate-200 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left p-4 text-sm">Member</th>
                      <th className="text-left p-4 text-sm">Periode</th>
                      <th className="text-right p-4 text-sm">Jumlah</th>
                      <th className="text-left p-4 text-sm">Status</th>
                      <th className="text-left p-4 text-sm">Tanggal Dibuat</th>
                      <th className="text-right p-4 text-sm">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((invoice) => (
                        <tr
                          key={invoice.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="p-4 text-sm">{invoice.memberName}</td>
                          <td className="p-4 text-sm text-slate-600">
                            {invoice.periode}
                          </td>
                          <td className="p-4 text-sm text-right">
                            Rp {invoice.amount.toLocaleString("id-ID")}
                          </td>
                          <td className="p-4 text-sm">
                            {getStatusBadge(invoice.status)}
                          </td>
                          <td className="p-4 text-sm text-slate-600">
                            {new Date(invoice.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {invoice.status === "unpaid" && (
                              <Button
                                size="sm"
                                onClick={() => openApproval(invoice)}
                                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Tandai Lunas
                              </Button>
                            )}
                            {invoice.status === "paid" && (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-green-600">
                                  Lunas{" "}
                                  {invoice.paidAt &&
                                    `• ${new Date(
                                      invoice.paidAt
                                    ).toLocaleDateString("id-ID")}`}
                                </span>
                                {invoice.buktiPembayaran && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openApproval(invoice)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Lihat Bukti
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-8 text-sm text-slate-600"
                        >
                          Belum ada invoice yang dibuat
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {invoices.length > 0 && (
                <div className="flex items-center justify-between mt-4 gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">
                      Menampilkan {indexOfFirstItem + 1} -{" "}
                      {Math.min(indexOfLastItem, invoices.length)} dari{" "}
                      {invoices.length} invoice
                    </span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
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

                    <span className="px-4 text-sm text-slate-600">
                      Halaman {currentPage} dari {totalPages}
                    </span>

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
              {invoices.length > 0 && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      Total Invoice: {invoices.length}
                    </span>
                    <div className="flex gap-4">
                      <span className="text-green-600">
                        Lunas:{" "}
                        {invoices.filter((i) => i.status === "paid").length}
                      </span>
                      <span className="text-red-600">
                        Belum Lunas:{" "}
                        {invoices.filter((i) => i.status === "unpaid").length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Invoice Dialog */}
      <Dialog open={openAddDialog} onOpenChange={closeAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Invoice Baru</DialogTitle>
            <DialogDescription>
              Buat invoice baru untuk member
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member">Pilih Member</Label>
              <Select
                value={formData.memberId}
                onValueChange={(value) =>
                  setFormData({ ...formData, memberId: value })
                }
              >
                <SelectTrigger id="member">
                  <SelectValue placeholder="Pilih member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.nama} - {member.noHp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periode">Periode</Label>
              <Input
                id="periode"
                type="month"
                value={formData.periode}
                onChange={(e) =>
                  setFormData({ ...formData, periode: e.target.value })
                }
                placeholder="Pilih bulan dan tahun"
              />
              <p className="text-xs text-slate-500">
                Format yang dikirim: MMYYYY (contoh: 112024)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah (Rp)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="50000"
                min="0"
                step="1000"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeAddDialog}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
              >
                Buat Invoice
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={openApprovalDialog} onOpenChange={setOpenApprovalDialog}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedInvoice?.status === "paid"
                ? "Bukti Pembayaran"
                : "Verifikasi Pembayaran"}
            </DialogTitle>
            <DialogDescription>
              {selectedInvoice?.status === "paid"
                ? "Lihat bukti pembayaran yang telah diupload"
                : "Periksa bukti pembayaran sebelum menyetujui"}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-600">Member</p>
                  <p className="text-sm text-slate-900">
                    {selectedInvoice.memberName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Periode</p>
                  <p className="text-sm text-slate-900">
                    {selectedInvoice.periode}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Jumlah</p>
                  <p className="text-sm text-slate-900">
                    Rp {selectedInvoice.amount.toLocaleString("id-ID")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Status</p>
                  <p className="text-sm">
                    {getStatusBadge(selectedInvoice.status)}
                  </p>
                </div>
              </div>

              {selectedInvoice.buktiPembayaran ? (
                <div className="space-y-2">
                  <Label>Bukti Pembayaran</Label>
                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60">
                    <img
                      src={selectedInvoice.buktiPembayaran}
                      alt="Bukti Pembayaran"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-lg text-center">
                  <FileText className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600">
                    Bukti pembayaran belum diupload
                  </p>
                </div>
              )}

              {selectedInvoice.status === "unpaid" && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenApprovalDialog(false)}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Batal
                  </Button>
                  <Button
                    onClick={handleApprove}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Setujui & Tandai Lunas
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
