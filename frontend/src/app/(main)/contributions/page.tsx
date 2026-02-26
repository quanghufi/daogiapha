/**
 * @project AncestorTree
 * @file src/app/(main)/contributions/page.tsx
 * @description Contribution form for members to suggest edits
 * @version 1.0.0
 * @updated 2026-02-25
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { usePeople } from '@/hooks/use-people';
import { useContributions, useCreateContribution } from '@/hooks/use-contributions';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ClipboardList,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
} from 'lucide-react';
import type { ChangeType, ContributionStatus } from '@/types';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';

const STATUS_CONFIG: Record<ContributionStatus, { label: string; icon: typeof Clock; variant: 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: 'Chờ duyệt', icon: Clock, variant: 'default' },
  approved: { label: 'Đã duyệt', icon: CheckCircle2, variant: 'secondary' },
  rejected: { label: 'Từ chối', icon: XCircle, variant: 'destructive' },
};

const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  create: 'Thêm mới',
  update: 'Cập nhật',
  delete: 'Xóa',
};

const FIELD_OPTIONS = [
  { value: 'display_name', label: 'Họ tên' },
  { value: 'phone', label: 'Số điện thoại' },
  { value: 'email', label: 'Email' },
  { value: 'address', label: 'Địa chỉ' },
  { value: 'birth_year', label: 'Năm sinh' },
  { value: 'death_year', label: 'Năm mất' },
  { value: 'death_lunar', label: 'Ngày giỗ (ÂL)' },
  { value: 'occupation', label: 'Nghề nghiệp' },
  { value: 'biography', label: 'Tiểu sử' },
  { value: 'notes', label: 'Ghi chú' },
] as const;

function getFieldLabel(key: string): string {
  return FIELD_OPTIONS.find(f => f.value === key)?.label || key;
}

function NewContributionDialog({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth();
  const { data: people } = usePeople();
  const createContribution = useCreateContribution();

  const [changeType, setChangeType] = useState<ChangeType>('update');
  const [targetPerson, setTargetPerson] = useState('');
  const [reason, setReason] = useState('');

  // Dynamic fields for changes
  const [fieldName, setFieldName] = useState('');
  const [fieldValue, setFieldValue] = useState('');
  const [changes, setChanges] = useState<Record<string, string>>({});

  const addChange = () => {
    if (!fieldName.trim() || !fieldValue.trim()) return;
    setChanges(prev => ({ ...prev, [fieldName.trim()]: fieldValue.trim() }));
    setFieldName('');
    setFieldValue('');
  };

  const removeChange = (key: string) => {
    setChanges(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      toast.error('Vui lòng đăng nhập');
      return;
    }
    if (!targetPerson) {
      toast.error('Vui lòng chọn thành viên');
      return;
    }
    if (Object.keys(changes).length === 0) {
      toast.error('Vui lòng thêm ít nhất một thay đổi');
      return;
    }

    try {
      await createContribution.mutateAsync({
        author_id: profile.id,
        target_person: targetPerson,
        change_type: changeType,
        changes,
        reason: reason || undefined,
      });
      toast.success('Đã gửi đề xuất chỉnh sửa');
      onClose();
    } catch {
      toast.error('Lỗi khi gửi đề xuất');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Loại thay đổi</Label>
        <Select value={changeType} onValueChange={v => setChangeType(v as ChangeType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="update">Cập nhật thông tin</SelectItem>
            <SelectItem value="create">Thêm thành viên mới</SelectItem>
            <SelectItem value="delete">Xóa thành viên</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Thành viên liên quan</Label>
        <Select value={targetPerson} onValueChange={setTargetPerson}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn thành viên..." />
          </SelectTrigger>
          <SelectContent>
            {people?.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.display_name} (Đời {p.generation})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Changes */}
      <div className="space-y-2">
        <Label>Thay đổi đề xuất</Label>
        {Object.entries(changes).length > 0 && (
          <div className="space-y-2 mb-3">
            {Object.entries(changes).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2 bg-muted rounded-md p-2 text-sm">
                <span className="font-medium">
                  {FIELD_OPTIONS.find(f => f.value === key)?.label || key}:
                </span>
                <span className="flex-1 truncate">{val}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => removeChange(key)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Select value={fieldName} onValueChange={setFieldName}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Trường..." />
            </SelectTrigger>
            <SelectContent>
              {FIELD_OPTIONS.filter(f => !changes[f.value]).map(f => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={fieldValue}
            onChange={e => setFieldValue(e.target.value)}
            placeholder="Giá trị mới..."
            className="flex-1"
          />
          <Button type="button" variant="outline" size="icon" onClick={addChange}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Lý do thay đổi</Label>
        <Textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Giải thích tại sao cần thay đổi..."
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
        <Button type="submit" disabled={createContribution.isPending} className="gap-2">
          <Send className="h-4 w-4" />
          {createContribution.isPending ? 'Đang gửi...' : 'Gửi đề xuất'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function ContributionsPage() {
  const { user, profile } = useAuth();
  const { data: contributions, isLoading } = useContributions();
  const { data: people } = usePeople();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Only show user's own contributions (unless admin)
  const myContributions = contributions?.filter(c =>
    profile?.role === 'admin' || c.author_id === profile?.id
  );

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Vui lòng đăng nhập để gửi đề xuất chỉnh sửa</p>
            <Button asChild>
              <Link href="/login">Đăng nhập</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
            <ClipboardList className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Đề xuất chỉnh sửa</h1>
            <p className="text-muted-foreground">
              Gửi yêu cầu cập nhật thông tin thành viên
            </p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Đề xuất mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Đề xuất chỉnh sửa</DialogTitle>
              <DialogDescription>
                Gửi yêu cầu cập nhật thông tin. Quản trị viên sẽ xem xét và phê duyệt.
              </DialogDescription>
            </DialogHeader>
            <NewContributionDialog onClose={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>
            {isLoading ? 'Đang tải...' : `${myContributions?.length || 0} đề xuất`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !myContributions?.length ? (
            <div className="py-12 text-center text-muted-foreground">
              Bạn chưa có đề xuất nào
            </div>
          ) : (
            <div className="space-y-3">
              {myContributions.map(c => {
                const statusInfo = STATUS_CONFIG[c.status];
                const StatusIcon = statusInfo.icon;
                const person = people?.find(p => p.id === c.target_person);
                return (
                  <div key={c.id} className="flex items-start gap-3 rounded-lg border p-4">
                    <StatusIcon className={`h-5 w-5 mt-0.5 ${
                      c.status === 'approved' ? 'text-green-600' :
                      c.status === 'rejected' ? 'text-destructive' :
                      'text-amber-600'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {CHANGE_TYPE_LABELS[c.change_type]}
                        </span>
                        {person && (
                          <Link href={`/people/${person.id}`} className="text-sm hover:underline text-muted-foreground">
                            {person.display_name}
                          </Link>
                        )}
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </div>
                      {c.reason && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Lý do: {c.reason}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(c.changes).map(([key, val]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {getFieldLabel(key)}: {String(val)}
                          </Badge>
                        ))}
                      </div>
                      {c.review_notes && (
                        <p className="text-sm mt-2 text-muted-foreground">
                          Ghi chú duyệt: {c.review_notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(c.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
