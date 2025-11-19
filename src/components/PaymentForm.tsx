import { useState } from "react";
import { Member, Payment } from "../App";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface PaymentFormProps {
  members: Member[];
  onAddPayment: (payment: Omit<Payment, "id">) => void;
}

export function PaymentForm({ members, onAddPayment }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    memberId: "",
    amount: "50000",
    date: new Date().toISOString().split("T")[0],
    period: new Date().toLocaleString("id-ID", {
      month: "long",
      year: "numeric",
    }),
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.memberId) {
      toast.error("Pilih anggota terlebih dahulu");
      return;
    }

    const member = members.find((m) => m.id === formData.memberId);
    if (!member) return;

    onAddPayment({
      memberId: formData.memberId,
      memberName: member.name,
      amount: Number(formData.amount),
      date: formData.date,
      period: formData.period,
      notes: formData.notes,
    });

    toast.success("Pembayaran berhasil dicatat!");

    // Reset form
    setFormData({
      memberId: "",
      amount: "50000",
      date: new Date().toISOString().split("T")[0],
      period: new Date().toLocaleString("id-ID", {
        month: "long",
        year: "numeric",
      }),
      notes: "",
    });
  };

  const activeMembers = members.filter((m) => m.status === "active");

  return (
    <Card className="max-w-2xl mx-auto border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
        <CardTitle>Catat Pembayaran Baru</CardTitle>
        <CardDescription>
          Masukkan detail pembayaran uang kas anggota
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="member">Nama Anggota</Label>
            <Select
              value={formData.memberId}
              onValueChange={(value) =>
                setFormData({ ...formData, memberId: value })
              }
            >
              <SelectTrigger id="member">
                <SelectValue placeholder="Pilih anggota" />
              </SelectTrigger>
              <SelectContent>
                {activeMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} - {member.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="date">Tanggal Bayar</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Periode</Label>
            <Input
              id="period"
              type="text"
              value={formData.period}
              onChange={(e) =>
                setFormData({ ...formData, period: e.target.value })
              }
              placeholder="November 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Tambahkan catatan jika diperlukan"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Simpan Pembayaran
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
