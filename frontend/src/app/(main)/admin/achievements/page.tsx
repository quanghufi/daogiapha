/**
 * @project AncestorTree
 * @file src/app/(main)/admin/achievements/page.tsx
 * @description Admin achievement management page
 * @version 1.0.0
 * @updated 2026-02-25
 */

'use client';

import { useState, useMemo } from 'react';
import { useAchievements, useCreateAchievement, useUpdateAchievement, useDeleteAchievement } from '@/hooks/use-achievements';
import { usePeople } from '@/hooks/use-people';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Trophy, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';
import Link from 'next/link';
import type { Achievement, AchievementCategory, CreateAchievementInput, Person } from '@/types';

const CATEGORY_OPTIONS: { value: AchievementCategory; label: string }[] = [
  { value: 'hoc_tap', label: 'Học tập' },
  { value: 'su_nghiep', label: 'Sự nghiệp' },
  { value: 'cong_hien', label: 'Cống hiến' },
  { value: 'other', label: 'Khác' },
];

function AchievementForm({
  achievement,
  people,
  onSubmit,
  isPending,
}: {
  achievement?: Achievement;
  people: Person[];
  onSubmit: (data: CreateAchievementInput) => void;
  isPending: boolean;
}) {
  const [personId, setPersonId] = useState(achievement?.person_id || '');
  const [title, setTitle] = useState(achievement?.title || '');
  const [category, setCategory] = useState<AchievementCategory>(achievement?.category || 'hoc_tap');
  const [description, setDescription] = useState(achievement?.description || '');
  const [year, setYear] = useState(achievement?.year?.toString() || '');
  const [awardedBy, setAwardedBy] = useState(achievement?.awarded_by || '');
  const [isFeatured, setIsFeatured] = useState(achievement?.is_featured || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId || !title) {
      toast.error('Vui lòng điền đủ thông tin bắt buộc');
      return;
    }
    onSubmit({
      person_id: personId,
      title,
      category,
      description: description || undefined,
      year: year ? parseInt(year) : undefined,
      awarded_by: awardedBy || undefined,
      is_featured: isFeatured,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Thành viên *</Label>
        <Select value={personId} onValueChange={setPersonId}>
          <SelectTrigger><SelectValue placeholder="Chọn thành viên" /></SelectTrigger>
          <SelectContent>
            {people.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.display_name} (Đời {p.generation})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Tiêu đề *</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Thủ khoa Đại học Bách Khoa" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Danh mục</Label>
          <Select value={category} onValueChange={v => setCategory(v as AchievementCategory)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Năm</Label>
          <Input type="number" value={year} onChange={e => setYear(e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Trao bởi</Label>
        <Input value={awardedBy} onChange={e => setAwardedBy(e.target.value)} placeholder="Sở GD&ĐT Nam Định" />
      </div>
      <div>
        <Label>Mô tả</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
        <Label>Nổi bật (hiển thị trên trang chủ)</Label>
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Đang lưu...' : (achievement ? 'Cập nhật' : 'Thêm mới')}
      </Button>
    </form>
  );
}

export default function AdminAchievementsPage() {
  const { isEditor } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Achievement | undefined>();
  const [search, setSearch] = useState('');

  const { data: achievements, isLoading } = useAchievements();
  const { data: people } = usePeople();
  const createMutation = useCreateAchievement();
  const updateMutation = useUpdateAchievement();
  const deleteMutation = useDeleteAchievement();

  const peopleMap = useMemo(() => {
    const map = new Map<string, Person>();
    for (const p of people || []) map.set(p.id, p);
    return map;
  }, [people]);

  const filtered = useMemo(() => {
    if (!search.trim()) return achievements || [];
    const q = search.toLowerCase();
    return (achievements || []).filter(a => {
      const person = peopleMap.get(a.person_id);
      return a.title.toLowerCase().includes(q) || person?.display_name.toLowerCase().includes(q);
    });
  }, [achievements, search, peopleMap]);

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

  const handleCreate = async (data: CreateAchievementInput) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Đã thêm thành tích');
      setDialogOpen(false);
    } catch {
      toast.error('Lỗi khi thêm thành tích');
    }
  };

  const handleUpdate = async (data: CreateAchievementInput) => {
    if (!editingItem) return;
    try {
      await updateMutation.mutateAsync({ id: editingItem.id, input: data });
      toast.success('Đã cập nhật thành tích');
      setDialogOpen(false);
      setEditingItem(undefined);
    } catch {
      toast.error('Lỗi khi cập nhật');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Đã xóa thành tích');
    } catch {
      toast.error('Lỗi khi xóa');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Vinh danh</h1>
          <p className="text-muted-foreground">Thêm, sửa, xóa thành tích thành viên</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingItem(undefined); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Thêm thành tích</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Sửa thành tích' : 'Thêm thành tích mới'}</DialogTitle>
            </DialogHeader>
            <AchievementForm
              key={editingItem?.id || 'new'}
              achievement={editingItem}
              people={people || []}
              onSubmit={editingItem ? handleUpdate : handleCreate}
              isPending={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Input
        placeholder="Tìm kiếm theo tên hoặc tiêu đề..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-md"
      />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-4 h-16" /></Card>)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Trophy className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Chưa có thành tích nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => {
            const person = peopleMap.get(a.person_id);
            return (
              <Card key={a.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {a.is_featured && <Star className="h-4 w-4 text-amber-500 shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {person?.display_name || '?'} · {CATEGORY_OPTIONS.find(c => c.value === a.category)?.label}
                        {a.year && ` · ${a.year}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => { setEditingItem(a); setDialogOpen(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xóa thành tích?</AlertDialogTitle>
                          <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(a.id)}>Xóa</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
