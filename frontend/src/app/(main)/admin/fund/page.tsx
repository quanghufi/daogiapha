/**
 * @project AncestorTree
 * @file src/app/(main)/admin/fund/page.tsx
 * @description Admin fund & scholarship management page
 * @version 1.0.0
 * @updated 2026-02-25
 */

'use client';

import { useState, useMemo } from 'react';
import {
  useFundTransactions, useFundBalance, useCreateFundTransaction, useDeleteFundTransaction,
  useScholarships, useCreateScholarship, useUpdateScholarshipStatus, useDeleteScholarship,
} from '@/hooks/use-fund';
import { usePeople } from '@/hooks/use-people';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, CheckCircle, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatVND } from '@/lib/format';
import type { Person, CreateFundTransactionInput, CreateScholarshipInput, ScholarshipStatus } from '@/types';

function getStatusBadge(status: ScholarshipStatus) {
  switch (status) {
    case 'pending': return <Badge variant="outline" className="text-xs">Chờ duyệt</Badge>;
    case 'approved': return <Badge className="bg-blue-100 text-blue-800 text-xs">Đã duyệt</Badge>;
    case 'paid': return <Badge className="bg-green-100 text-green-800 text-xs">Đã cấp</Badge>;
    default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

export default function AdminFundPage() {
  const { profile, isEditor } = useAuth();
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [schDialogOpen, setSchDialogOpen] = useState(false);

  const { data: balance } = useFundBalance();
  const { data: transactions } = useFundTransactions();
  const { data: scholarships } = useScholarships();
  const { data: people } = usePeople();

  const createTx = useCreateFundTransaction();
  const deleteTx = useDeleteFundTransaction();
  const createSch = useCreateScholarship();
  const updateSchStatus = useUpdateScholarshipStatus();
  const deleteSch = useDeleteScholarship();

  const peopleMap = useMemo(() => {
    const map = new Map<string, Person>();
    for (const p of people || []) map.set(p.id, p);
    return map;
  }, [people]);

  // Transaction form state
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txCategory, setTxCategory] = useState('dong_gop');
  const [txAmount, setTxAmount] = useState('');
  const [txDonorName, setTxDonorName] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));

  // Scholarship form state
  const [schPersonId, setSchPersonId] = useState('');
  const [schType, setSchType] = useState<'hoc_bong' | 'khen_thuong'>('hoc_bong');
  const [schAmount, setSchAmount] = useState('');
  const [schReason, setSchReason] = useState('');
  const [schYear, setSchYear] = useState('2025-2026');
  const [schSchool, setSchSchool] = useState('');
  const [schGrade, setSchGrade] = useState('');

  if (!isEditor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Bạn cần quyền biên tập viên để truy cập trang này</p>
            <Button asChild className="mt-4"><Link href="/">Về trang chủ</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const resetTxForm = () => {
    setTxType('income'); setTxCategory('dong_gop'); setTxAmount(''); setTxDonorName(''); setTxDescription(''); setTxDate(new Date().toISOString().slice(0, 10));
  };

  const resetSchForm = () => {
    setSchPersonId(''); setSchType('hoc_bong'); setSchAmount(''); setSchReason(''); setSchYear('2025-2026'); setSchSchool(''); setSchGrade('');
  };

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTxAmount = parseInt(txAmount);
    if (!txAmount || isNaN(parsedTxAmount) || parsedTxAmount <= 0) { toast.error('Số tiền phải lớn hơn 0'); return; }
    try {
      const input: CreateFundTransactionInput = {
        type: txType,
        category: txCategory as CreateFundTransactionInput['category'],
        amount: parsedTxAmount,
        donor_name: txDonorName || undefined,
        description: txDescription || undefined,
        transaction_date: txDate,
        created_by: profile?.id,
      };
      await createTx.mutateAsync(input);
      toast.success('Đã thêm giao dịch');
      setTxDialogOpen(false);
      resetTxForm();
    } catch {
      toast.error('Lỗi khi thêm giao dịch');
    }
  };

  const handleCreateSch = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSchAmount = parseInt(schAmount);
    if (!schPersonId || !schAmount || isNaN(parsedSchAmount) || parsedSchAmount <= 0) { toast.error('Vui lòng điền đủ thông tin (số tiền > 0)'); return; }
    try {
      const input: CreateScholarshipInput = {
        person_id: schPersonId,
        type: schType,
        amount: parsedSchAmount,
        reason: schReason || undefined,
        academic_year: schYear,
        school: schSchool || undefined,
        grade_level: schGrade || undefined,
        status: 'pending',
      };
      await createSch.mutateAsync(input);
      toast.success('Đã thêm đề cử');
      setSchDialogOpen(false);
      resetSchForm();
    } catch {
      toast.error('Lỗi khi thêm đề cử');
    }
  };

  const handleApprove = async (id: string, status: ScholarshipStatus) => {
    try {
      await updateSchStatus.mutateAsync({ id, status, approvedBy: profile?.id });
      toast.success(status === 'approved' ? 'Đã duyệt' : 'Đã cấp phát');
    } catch {
      toast.error('Lỗi khi cập nhật');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý Quỹ & Học bổng</h1>
        <p className="text-muted-foreground">
          Số dư: <span className="font-semibold text-emerald-600">{formatVND(balance?.balance || 0)}</span>
        </p>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Giao dịch</TabsTrigger>
          <TabsTrigger value="scholarships">Học bổng</TabsTrigger>
        </TabsList>

        {/* Transactions */}
        <TabsContent value="transactions" className="mt-4 space-y-4">
          <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Thêm giao dịch</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Thêm giao dịch</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateTx} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Loại</Label>
                    <Select value={txType} onValueChange={v => setTxType(v as 'income' | 'expense')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Thu</SelectItem>
                        <SelectItem value="expense">Chi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Danh mục</Label>
                    <Select value={txCategory} onValueChange={setTxCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dong_gop">Đóng góp</SelectItem>
                        <SelectItem value="hoc_bong">Học bổng</SelectItem>
                        <SelectItem value="khen_thuong">Khen thưởng</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Số tiền (VNĐ) *</Label>
                  <Input type="number" value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="1000000" />
                </div>
                <div>
                  <Label>Người đóng góp</Label>
                  <Input value={txDonorName} onChange={e => setTxDonorName(e.target.value)} placeholder="Ông Đào Văn A" />
                </div>
                <div>
                  <Label>Ngày</Label>
                  <Input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} />
                </div>
                <div>
                  <Label>Ghi chú</Label>
                  <Textarea value={txDescription} onChange={e => setTxDescription(e.target.value)} rows={2} />
                </div>
                <Button type="submit" disabled={createTx.isPending} className="w-full">
                  {createTx.isPending ? 'Đang lưu...' : 'Thêm giao dịch'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <div className="space-y-2">
            {(transactions || []).map(tx => (
              <Card key={tx.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {tx.donor_name || tx.description || (tx.type === 'income' ? 'Thu' : 'Chi')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.transaction_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatVND(tx.amount)}
                    </span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xóa giao dịch?</AlertDialogTitle>
                          <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteTx.mutateAsync(tx.id).then(() => toast.success('Đã xóa')).catch(() => toast.error('Lỗi'))}>Xóa</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!transactions || transactions.length === 0) && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Wallet className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Chưa có giao dịch nào</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Scholarships */}
        <TabsContent value="scholarships" className="mt-4 space-y-4">
          <Dialog open={schDialogOpen} onOpenChange={setSchDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Đề cử học bổng / khen thưởng</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Đề cử học bổng / khen thưởng</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateSch} className="space-y-4">
                <div>
                  <Label>Thành viên *</Label>
                  <Select value={schPersonId} onValueChange={setSchPersonId}>
                    <SelectTrigger><SelectValue placeholder="Chọn thành viên" /></SelectTrigger>
                    <SelectContent>
                      {(people || []).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Loại</Label>
                    <Select value={schType} onValueChange={v => setSchType(v as 'hoc_bong' | 'khen_thuong')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hoc_bong">Học bổng</SelectItem>
                        <SelectItem value="khen_thuong">Khen thưởng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Số tiền (VNĐ) *</Label>
                    <Input type="number" value={schAmount} onChange={e => setSchAmount(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Năm học</Label>
                    <Input value={schYear} onChange={e => setSchYear(e.target.value)} placeholder="2025-2026" />
                  </div>
                  <div>
                    <Label>Lớp / Cấp</Label>
                    <Input value={schGrade} onChange={e => setSchGrade(e.target.value)} placeholder="Lớp 10" />
                  </div>
                </div>
                <div>
                  <Label>Trường</Label>
                  <Input value={schSchool} onChange={e => setSchSchool(e.target.value)} placeholder="THPT Nam Định" />
                </div>
                <div>
                  <Label>Lý do</Label>
                  <Textarea value={schReason} onChange={e => setSchReason(e.target.value)} rows={2} />
                </div>
                <Button type="submit" disabled={createSch.isPending} className="w-full">
                  {createSch.isPending ? 'Đang lưu...' : 'Đề cử'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <div className="space-y-2">
            {(scholarships || []).map(s => {
              const person = peopleMap.get(s.person_id);
              return (
                <Card key={s.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{person?.display_name || '?'}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.type === 'hoc_bong' ? 'Học bổng' : 'Khen thưởng'} · {formatVND(s.amount)} · {s.academic_year}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(s.status)}
                      {s.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => handleApprove(s.id, 'approved')}>
                          <CheckCircle className="h-3 w-3 mr-1" />Duyệt
                        </Button>
                      )}
                      {s.status === 'approved' && (
                        <Button size="sm" variant="outline" onClick={() => handleApprove(s.id, 'paid')}>
                          <CheckCircle className="h-3 w-3 mr-1" />Cấp
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa đề cử?</AlertDialogTitle>
                            <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteSch.mutateAsync(s.id).then(() => toast.success('Đã xóa')).catch(() => toast.error('Lỗi'))}>Xóa</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {(!scholarships || scholarships.length === 0) && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">Chưa có đề cử nào</CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
