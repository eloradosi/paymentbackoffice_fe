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
  UserPlus,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { memberAPI } from "../lib/api";
import { Member } from "../App";

interface MemberManagementProps {
  token: string;
}

export function MemberManagement({ token }: MemberManagementProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    nama: "",
    noHp: "",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await memberAPI.getAll(token);
      setMembers(data);
    } catch (error) {
      toast.error("Gagal memuat data member");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama || !formData.noHp) {
      toast.error("Nama dan no HP harus diisi");
      return;
    }

    try {
      if (editingMember) {
        await memberAPI.update(token, editingMember.id, formData);
        toast.success("Member berhasil diupdate");
      } else {
        await memberAPI.create(token, formData);
        toast.success("Member berhasil ditambahkan");
      }

      await loadMembers();
      closeDialog();
    } catch (error) {
      toast.error("Gagal menyimpan data");
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      nama: member.nama,
      noHp: member.noHp,
      status: member.status,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${nama}?`)) return;

    try {
      await memberAPI.delete(token, id);
      toast.success("Member berhasil dihapus");
      await loadMembers();
    } catch (error) {
      toast.error("Gagal menghapus member");
    }
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setEditingMember(null);
    setFormData({
      nama: "",
      noHp: "",
      status: "active",
    });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = members.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(members.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="p-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Data Member</CardTitle>
              <CardDescription>
                Kelola data member yang terdaftar dalam sistem
              </CardDescription>
            </div>
            <Button
              onClick={() => setOpenDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Tambah Member
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-slate-200 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left p-4 text-sm">No</th>
                      <th className="text-left p-4 text-sm">Nama</th>
                      <th className="text-left p-4 text-sm">No HP</th>
                      <th className="text-left p-4 text-sm">Status</th>
                      <th className="text-left p-4 text-sm">Tanggal Daftar</th>
                      <th className="text-right p-4 text-sm">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((member, index) => (
                        <tr
                          key={member.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="p-4 text-sm text-slate-600">
                            {index + 1 + (currentPage - 1) * itemsPerPage}
                          </td>
                          <td className="p-4 text-sm">{member.nama}</td>
                          <td className="p-4 text-sm text-slate-600">
                            {member.noHp}
                          </td>
                          <td className="p-4 text-sm">
                            <Badge
                              variant="secondary"
                              className={
                                member.status === "active"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                              }
                            >
                              {member.status === "active"
                                ? "Aktif"
                                : "Tidak Aktif"}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-slate-600">
                            {new Date(member.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(member)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDelete(member.id, member.nama)
                                }
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-8 text-sm text-slate-600"
                        >
                          Belum ada member yang terdaftar
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {members.length > 0 && (
                <div className="flex items-center justify-between mt-4 gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">
                      Menampilkan {indexOfFirstItem + 1} -{" "}
                      {Math.min(indexOfLastItem, members.length)} dari{" "}
                      {members.length} member
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
              {members.length > 0 && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      Total Member: {members.length}
                    </span>
                    <div className="flex gap-4">
                      <span className="text-green-600">
                        Aktif:{" "}
                        {members.filter((m) => m.status === "active").length}
                      </span>
                      <span className="text-slate-600">
                        Tidak Aktif:{" "}
                        {members.filter((m) => m.status === "inactive").length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMember ? "Edit Member" : "Tambah Member Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingMember
                ? "Update informasi member"
                : "Masukkan informasi member baru"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) =>
                  setFormData({ ...formData, nama: e.target.value })
                }
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="noHp">No HP</Label>
              <Input
                id="noHp"
                value={formData.noHp}
                onChange={(e) =>
                  setFormData({ ...formData, noHp: e.target.value })
                }
                placeholder="08123456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {editingMember ? "Update" : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
