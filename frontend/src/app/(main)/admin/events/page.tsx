/**
 * @project AncestorTree
 * @file src/app/(main)/admin/events/page.tsx
 * @description Admin event management — CRUD for events (Sprint 8)
 * @version 1.0.0
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/use-events';
import { usePeople } from '@/hooks/use-people';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft, Plus, CalendarDays, Loader2, Pencil, Trash2, MapPin, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';
import type { Event, EventType } from '@/types';
import { PersonCombobox } from '@/components/shared/person-combobox';
import type { SearchPerson } from '@/types';

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  gio: 'Giỗ',
  hop_ho: 'Họp họ',
  le_tet: 'Lễ / Tết',
  other: 'Khác',
};

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  gio: 'bg-purple-100 text-purple-800',
  hop_ho: 'bg-blue-100 text-blue-800',
  le_tet: 'bg-red-100 text-red-800',
  other: 'bg-gray-100 text-gray-800',
};

type FormState = {
  title: string;
  description: string;
  event_date: string;
  event_lunar: string;
  event_type: EventType;
  location: string;
  recurring: boolean;
  person: SearchPerson | null;
};

const emptyForm: FormState = {
  title: '',
  description: '',
  event_date: '',
  event_lunar: '',
  event_type: 'other',
  location: '',
  recurring: false,
  person: null,
};

export default function AdminEventsPage() {
  const { data: events, isLoading } = useEvents();
  const { data: people } = usePeople();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);

  const peopleMap = new Map<string, string>();
  if (people) {
    for (const p of people) {
      peopleMap.set(p.id, p.display_name);
    }
  }

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (event: Event) => {
    setEditingId(event.id);
    const matchedPerson = event.person_id && people
      ? people.find(p => p.id === event.person_id)
      : null;
    setForm({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date || '',
      event_lunar: event.event_lunar || '',
      event_type: event.event_type,
      location: event.location || '',
      recurring: event.recurring,
      person: matchedPerson ? {
        id: matchedPerson.id,
        display_name: matchedPerson.display_name,
        gender: matchedPerson.gender,
        generation: matchedPerson.generation,
        birth_year: matchedPerson.birth_year,
        avatar_url: matchedPerson.avatar_url,
        is_living: matchedPerson.is_living,
      } : null,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;

    const input = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      event_date: form.event_date || undefined,
      event_lunar: form.event_lunar || undefined,
      event_type: form.event_type,
      location: form.location.trim() || undefined,
      recurring: form.recurring,
      person_id: form.person?.id || undefined,
    };

    try {
      if (editingId) {
        await updateEvent.mutateAsync({ id: editingId, input });
        toast.success('Đã cập nhật sự kiện');
      } else {
        await createEvent.mutateAsync(input as Omit<Event, 'id' | 'created_at'>);
        toast.success('Đã tạo sự kiện mới');
      }
      setDialogOpen(false);
      setForm(emptyForm);
    } catch {
      toast.error('Lỗi khi lưu sự kiện');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEvent.mutateAsync(deleteTarget.id);
      toast.success(`Đã xóa "${deleteTarget.title}"`);
      setDeleteTarget(null);
    } catch {
      toast.error('Lỗi khi xóa sự kiện');
    }
  };

  const isSaving = createEvent.isPending || updateEvent.isPending;

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quản trị
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="h-6 w-6" />
              Quản lý sự kiện
            </h1>
            <p className="text-muted-foreground">Thêm, sửa, xóa sự kiện và lịch giỗ</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm sự kiện
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Danh sách sự kiện
          </CardTitle>
          <CardDescription>
            {isLoading ? 'Đang tải...' : `${events?.length || 0} sự kiện`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : events && events.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên sự kiện</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="hidden sm:table-cell">Ngày</TableHead>
                  <TableHead className="hidden md:table-cell">Địa điểm</TableHead>
                  <TableHead className="hidden lg:table-cell">Người liên quan</TableHead>
                  <TableHead className="hidden sm:table-cell">Hàng năm</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="font-medium truncate">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground truncate">{event.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={EVENT_TYPE_COLORS[event.event_type]}>
                        {EVENT_TYPE_LABELS[event.event_type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {event.event_date
                        ? formatDate(event.event_date, { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : event.event_lunar || '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {event.location ? (
                        <span className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[120px]">{event.location}</span>
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">
                      {event.person_id ? (peopleMap.get(event.person_id) || '—') : '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {event.recurring ? (
                        <RefreshCw className="h-4 w-4 text-green-600" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Một lần</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => openEdit(event)} title="Sửa">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(event)}
                          title="Xóa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Chưa có sự kiện nào</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setForm(emptyForm); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {editingId ? 'Sửa sự kiện' : 'Thêm sự kiện mới'}
            </DialogTitle>
            <DialogDescription>
              {editingId ? 'Cập nhật thông tin sự kiện' : 'Điền thông tin cho sự kiện mới'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="event-title">Tên sự kiện *</Label>
              <Input
                id="event-title"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="VD: Giỗ Ông Tổ đời 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-desc">Mô tả</Label>
              <Textarea
                id="event-desc"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả chi tiết sự kiện"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại sự kiện</Label>
                <Select value={form.event_type} onValueChange={(v) => setForm(f => ({ ...f, event_type: v as EventType }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-date">Ngày dương lịch</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={form.event_date}
                  onChange={(e) => setForm(f => ({ ...f, event_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-lunar">Ngày âm lịch</Label>
                <Input
                  id="event-lunar"
                  value={form.event_lunar}
                  onChange={(e) => setForm(f => ({ ...f, event_lunar: e.target.value }))}
                  placeholder="VD: 15/01 ÂL"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-location">Địa điểm</Label>
                <Input
                  id="event-location"
                  value={form.location}
                  onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="VD: Nhà thờ họ"
                />
              </div>
            </div>

            <PersonCombobox
              label="Người liên quan (tùy chọn)"
              hint="Sự kiện gắn với ai trong gia phả? (VD: giỗ ai)"
              selected={form.person}
              onSelect={(p) => setForm(f => ({ ...f, person: p }))}
            />

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Sự kiện hàng năm</Label>
                <p className="text-xs text-muted-foreground">Sự kiện lặp lại hàng năm (giỗ, lễ tết...)</p>
              </div>
              <Switch
                checked={form.recurring}
                onCheckedChange={(checked) => setForm(f => ({ ...f, recurring: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setForm(emptyForm); }} disabled={isSaving}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !form.title.trim()}>
              {isSaving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang lưu...</>
              ) : (
                editingId ? 'Lưu thay đổi' : 'Tạo sự kiện'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa sự kiện</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa sự kiện <strong>{deleteTarget?.title}</strong>? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteEvent.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang xóa...</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" /> Xóa vĩnh viễn</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
