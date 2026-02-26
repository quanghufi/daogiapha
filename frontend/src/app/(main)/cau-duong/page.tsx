/**
 * @project AncestorTree
 * @file src/app/(main)/cau-duong/page.tsx
 * @description Trang Lịch Cầu đương — xem danh sách xoay vòng và lịch phân công
 * @version 1.0.0
 * @updated 2026-02-25
 */

'use client';

import { useState } from 'react';
import { useCauDuongPools, useCauDuongAssignments, useEligibleMembers } from '@/hooks/use-cau-duong';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, RotateCcw, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { CAU_DUONG_CEREMONY_LABELS, CAU_DUONG_CEREMONY_ORDER, type CauDuongStatus } from '@/types';
import { formatDate } from '@/lib/format';

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

const STATUS_LABELS: Record<CauDuongStatus, string> = {
  scheduled: 'Đã phân công',
  completed: 'Đã hoàn thành',
  delegated: 'Đã ủy quyền',
  rescheduled: 'Đổi ngày',
  cancelled: 'Đã hủy',
};

const STATUS_VARIANT: Record<CauDuongStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  scheduled: 'secondary',
  completed: 'default',
  delegated: 'outline',
  rescheduled: 'outline',
  cancelled: 'destructive',
};

export default function CauDuongPage() {
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: pools, isLoading: poolsLoading } = useCauDuongPools();
  const firstPool = pools?.[0];
  const poolId = firstPool?.id;

  const { data: assignments, isLoading: assignmentsLoading } = useCauDuongAssignments(poolId, selectedYear);
  const { data: eligibleMembers, isLoading: eligibleLoading } = useEligibleMembers(poolId, currentYear);

  if (poolsLoading) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!pools || pools.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">Chưa thiết lập lịch Cầu đương</p>
            <p className="text-sm">Quản trị viên cần tạo nhóm Cầu đương trong trang Admin.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-primary" />
            Lịch Cầu đương
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Phân công xoay vòng chủ lễ các ngày cúng chính trong năm
          </p>
        </div>
        <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEAR_OPTIONS.map(y => (
              <SelectItem key={y} value={y.toString()}>Năm {y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pool info */}
      {firstPool && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
            <span className="font-medium">{firstPool.name}</span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <span className="text-muted-foreground">
              Đời {firstPool.min_generation} trở xuống • Dưới {firstPool.max_age_lunar} tuổi âm • Nam giới đã lập gia đình
            </span>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule" className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Lịch phân công
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Danh sách thành viên ({eligibleMembers?.length ?? '...'})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Lịch phân công năm đã chọn */}
        <TabsContent value="schedule" className="mt-4 space-y-4">
          {assignmentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse h-20 bg-muted rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              {CAU_DUONG_CEREMONY_ORDER.map(ceremonyType => {
                const assignment = assignments?.find(a => a.ceremony_type === ceremonyType);
                return (
                  <Card key={ceremonyType} className={assignment ? '' : 'border-dashed opacity-60'}>
                    <CardContent className="py-4 px-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {assignment?.status === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : assignment ? (
                              <Clock className="h-5 w-5 text-orange-400" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{CAU_DUONG_CEREMONY_LABELS[ceremonyType]}</p>
                            {assignment ? (
                              <div className="mt-1 text-sm text-muted-foreground space-y-0.5">
                                <p>
                                  <span className="font-medium text-foreground">
                                    {assignment.host_person?.display_name ?? '—'}
                                  </span>
                                  {assignment.actual_host_person && assignment.actual_host_person.id !== assignment.host_person?.id && (
                                    <span className="ml-2 text-xs">
                                      (Ủy quyền: <span className="font-medium">{assignment.actual_host_person.display_name}</span>)
                                    </span>
                                  )}
                                </p>
                                {assignment.reason && (
                                  <p className="text-xs italic">{assignment.reason}</p>
                                )}
                                {assignment.scheduled_date && (
                                  <p className="text-xs">Dự kiến: {formatDate(assignment.scheduled_date)}</p>
                                )}
                                {assignment.actual_date && assignment.actual_date !== assignment.scheduled_date && (
                                  <p className="text-xs text-orange-600">Thực hiện: {formatDate(assignment.actual_date)}</p>
                                )}
                                {assignment.notes && (
                                  <p className="text-xs text-muted-foreground">{assignment.notes}</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground mt-1">Chưa phân công</p>
                            )}
                          </div>
                        </div>

                        {assignment && (
                          <Badge variant={STATUS_VARIANT[assignment.status]} className="self-start sm:self-center">
                            {STATUS_LABELS[assignment.status]}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </TabsContent>

        {/* Tab: Danh sách thành viên đủ điều kiện */}
        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Danh sách xoay vòng</CardTitle>
              <CardDescription>
                Thứ tự theo cây gia phả (DFS preorder) — đời trên trước, trong mỗi đời theo thứ tự gia đình
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eligibleLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="animate-pulse h-10 bg-muted rounded" />
                  ))}
                </div>
              ) : !eligibleMembers || eligibleMembers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Chưa có thành viên đủ điều kiện
                </p>
              ) : (
                <div className="space-y-2">
                  {eligibleMembers.map((member, idx) => (
                    <div
                      key={member.person.id}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-muted-foreground w-7 text-right">
                          {idx + 1}.
                        </span>
                        <div>
                          <p className="font-medium">{member.person.display_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Đời {member.person.generation}
                            {member.person.chi ? ` • Chi ${member.person.chi}` : ''}
                            {member.person.hometown ? ` • ${member.person.hometown}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {member.ageLunar > 0 && <span>{member.ageLunar} tuổi âm</span>}
                        {member.person.birth_year && (
                          <p className="text-muted-foreground/60">sinh {member.person.birth_year}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
