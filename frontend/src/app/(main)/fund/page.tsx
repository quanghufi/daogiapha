/**
 * @project AncestorTree
 * @file src/app/(main)/fund/page.tsx
 * @description Education fund dashboard - Quỹ khuyến học
 * @version 1.0.0
 * @updated 2026-02-25
 */

'use client';

import { useState, useMemo } from 'react';
import { useFundTransactions, useFundBalance, useScholarships } from '@/hooks/use-fund';
import { usePeople } from '@/hooks/use-people';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  BookOpen, Wallet, ArrowDownCircle, ArrowUpCircle,
  GraduationCap, Award, Printer, Download,
} from 'lucide-react';
import { formatVND, formatDate } from '@/lib/format';
import { ScholarshipStatusBadge } from '@/components/shared/scholarship-status-badge';
import type { Person, FundTransaction, Scholarship, ScholarshipStatus, FundBalance } from '@/types';

function exportFundReport(
  balance: FundBalance | undefined,
  transactions: FundTransaction[],
  scholarships: Scholarship[],
  peopleMap: Map<string, Person>,
) {
  const lines: string[] = [];
  lines.push('BÁO CÁO QUỸ KHUYẾN HỌC - CHI TỘC ĐẶNG ĐÌNH');
  lines.push(`Ngày xuất: ${formatDate(new Date())}`);
  lines.push('');
  lines.push('=== TỔNG QUAN ===');
  lines.push(`Tổng thu: ${formatVND(balance?.income || 0)}`);
  lines.push(`Tổng chi: ${formatVND(balance?.expense || 0)}`);
  lines.push(`Số dư: ${formatVND(balance?.balance || 0)}`);
  lines.push('');
  lines.push('=== HỌC BỔNG & KHEN THƯỞNG ===');
  lines.push('Họ tên,Loại,Số tiền,Năm học,Trường,Khối/Lớp,Trạng thái');
  for (const s of scholarships) {
    const name = peopleMap.get(s.person_id)?.display_name || 'Không rõ';
    const type = s.type === 'hoc_bong' ? 'Học bổng' : 'Khen thưởng';
    const status = s.status === 'paid' ? 'Đã cấp' : s.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt';
    lines.push(`"${name}","${type}",${s.amount},"${s.academic_year}","${s.school || ''}","${s.grade_level || ''}","${status}"`);
  }
  lines.push('');
  lines.push('=== LỊCH SỬ GIAO DỊCH ===');
  lines.push('Ngày,Loại,Người/Mô tả,Số tiền,Năm học');
  for (const tx of transactions) {
    const date = formatDate(tx.transaction_date);    const type = tx.type === 'income' ? 'Thu' : 'Chi';
    const desc = tx.donor_name || tx.description || '';
    lines.push(`"${date}","${type}","${desc}",${tx.amount},"${tx.academic_year || ''}"`);
  }

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bao-cao-quy-khuyen-hoc-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FundPage() {
  const [activeTab, setActiveTab] = useState('scholarships');

  const { data: balance, isLoading: balanceLoading } = useFundBalance();
  const { data: transactions, isLoading: txLoading } = useFundTransactions();
  const { data: scholarships, isLoading: schLoading } = useScholarships();
  const { data: people } = usePeople();

  const peopleMap = useMemo(() => {
    const map = new Map<string, Person>();
    for (const p of people || []) map.set(p.id, p);
    return map;
  }, [people]);

  const hocBong = useMemo(
    () => (scholarships || []).filter(s => s.type === 'hoc_bong'),
    [scholarships]
  );
  const khenThuong = useMemo(
    () => (scholarships || []).filter(s => s.type === 'khen_thuong'),
    [scholarships]
  );

  const donations = useMemo(
    () => (transactions || []).filter(t => t.type === 'income'),
    [transactions]
  );
  const isLoading = balanceLoading || txLoading || schLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Quỹ Khuyến học
          </h1>
          <p className="text-muted-foreground">Quản lý quỹ khuyến học, học bổng và khen thưởng</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportFundReport(balance, transactions || [], scholarships || [], peopleMap)}
          >
            <Download className="h-4 w-4 mr-2" />
            Xuất CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            In báo cáo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Wallet className="h-6 w-6 mx-auto mb-1 text-emerald-600" />
            <p className="text-lg font-bold text-emerald-600">{formatVND(balance?.balance || 0)}</p>
            <p className="text-xs text-muted-foreground">Số dư</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ArrowDownCircle className="h-6 w-6 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold text-blue-600">{formatVND(balance?.income || 0)}</p>
            <p className="text-xs text-muted-foreground">Tổng thu</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ArrowUpCircle className="h-6 w-6 mx-auto mb-1 text-red-600" />
            <p className="text-lg font-bold text-red-600">{formatVND(balance?.expense || 0)}</p>
            <p className="text-xs text-muted-foreground">Tổng chi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <GraduationCap className="h-6 w-6 mx-auto mb-1 text-purple-600" />
            <p className="text-lg font-bold text-purple-600">{(scholarships || []).length}</p>
            <p className="text-xs text-muted-foreground">Suất học bổng</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="scholarships">Học bổng & Khen thưởng</TabsTrigger>
          <TabsTrigger value="donations">Đóng góp</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
        </TabsList>

        {/* Scholarships & Rewards */}
        <TabsContent value="scholarships" className="space-y-6 mt-4">
          {/* Scholarships */}
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
              <GraduationCap className="h-4 w-4" />
              Học bổng ({hocBong.length})
            </h3>
            {hocBong.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có học bổng nào</p>
            ) : (
              <div className="space-y-2">
                {hocBong.map(s => {
                  const person = peopleMap.get(s.person_id);
                  return (
                    <Card key={s.id}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{person?.display_name || 'Không rõ'}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.school && `${s.school} · `}{s.grade_level && `${s.grade_level} · `}
                            {s.academic_year}
                          </p>
                          {s.reason && <p className="text-xs text-muted-foreground mt-0.5">{s.reason}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{formatVND(s.amount)}</p>
                          {<ScholarshipStatusBadge status={s.status} />}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Rewards */}
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
              <Award className="h-4 w-4" />
              Khen thưởng ({khenThuong.length})
            </h3>
            {khenThuong.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có khen thưởng nào</p>
            ) : (
              <div className="space-y-2">
                {khenThuong.map(s => {
                  const person = peopleMap.get(s.person_id);
                  return (
                    <Card key={s.id}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{person?.display_name || 'Không rõ'}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.school && `${s.school} · `}{s.grade_level && `${s.grade_level} · `}
                            {s.academic_year}
                          </p>
                          {s.reason && <p className="text-xs text-muted-foreground mt-0.5">{s.reason}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{formatVND(s.amount)}</p>
                          {<ScholarshipStatusBadge status={s.status} />}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Donations */}
        <TabsContent value="donations" className="mt-4">
          <h3 className="text-base font-semibold mb-3">Danh sách đóng góp ({donations.length})</h3>
          {donations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Chưa có đóng góp nào
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {donations.map(tx => {
                const person = tx.donor_person_id ? peopleMap.get(tx.donor_person_id) : undefined;
                return (
                  <Card key={tx.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{tx.donor_name || person?.display_name || 'Ẩn danh'}</p>
                        {tx.description && (
                          <p className="text-xs text-muted-foreground">{tx.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-emerald-600">+{formatVND(tx.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.transaction_date)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="mt-4">
          <h3 className="text-base font-semibold mb-3">Lịch sử giao dịch ({(transactions || []).length})</h3>
          {!transactions || transactions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Chưa có giao dịch nào
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <Card key={tx.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {tx.type === 'income' ? (
                        <ArrowDownCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                      ) : (
                        <ArrowUpCircle className="h-5 w-5 text-red-500 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {tx.donor_name || tx.description || (tx.type === 'income' ? 'Thu' : 'Chi')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.transaction_date)}
                          {tx.academic_year && ` · ${tx.academic_year}`}
                        </p>
                      </div>
                    </div>
                    <p className={`font-semibold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatVND(tx.amount)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
