import { useState } from 'react';
import { Payment } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search } from 'lucide-react';

interface PaymentHistoryProps {
  payments: Payment[];
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPayments = payments.filter(payment => 
    payment.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.period.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-slate-200">
        <CardTitle>Riwayat Pembayaran</CardTitle>
        <CardDescription>
          Daftar lengkap semua pembayaran yang telah dicatat
        </CardDescription>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cari berdasarkan nama atau periode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Tanggal Bayar</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.memberName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        {payment.period}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(payment.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      Rp {payment.amount.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {payment.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-600">
                    {searchTerm ? 'Tidak ada hasil yang ditemukan' : 'Belum ada pembayaran yang dicatat'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {filteredPayments.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Menampilkan {filteredPayments.length} dari {payments.length} pembayaran
            </p>
            <div className="text-sm">
              <span className="text-slate-600">Total: </span>
              <span className="text-slate-900">
                Rp {filteredPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}