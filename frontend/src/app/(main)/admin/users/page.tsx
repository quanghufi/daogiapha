/**
 * @project AncestorTree
 * @file src/app/(main)/admin/users/page.tsx
 * @description User management — role, tree mapping, verify, suspend, delete (Sprint 8)
 * @version 4.0.0
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useProfiles,
  useUpdateUserRole,
  useUpdateLinkedPerson,
  useUpdateEditRootPerson,
  useVerifyUser,
  useSuspendUser,
  useUnsuspendUser,
  useDeleteUser,
} from '@/hooks/use-profiles';
import { usePeople, usePerson } from '@/hooks/use-people';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Users, ArrowLeft, Shield, UserCog, Loader2, CheckCircle,
  Link2, GitBranch, Ban, Unlock, Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';
import { PersonCombobox } from '@/components/shared/person-combobox';
import type { UserRole, SearchPerson, Profile } from '@/types';

// ─── Role config ──────────────────────────────────────────────────────────────

const roleLabels: Record<UserRole, { label: string; color: string; description: string }> = {
  admin: {
    label: 'Quản trị viên',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    description: 'Toàn quyền quản trị hệ thống',
  },
  editor: {
    label: 'Biên tập viên',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    description: 'Thêm, sửa, xóa dữ liệu thành viên',
  },
  viewer: {
    label: 'Người xem',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    description: 'Chỉ xem thông tin, không chỉnh sửa',
  },
};

type FilterTab = 'all' | 'pending' | 'suspended';

// ─── PersonName ───────────────────────────────────────────────────────────────

function PersonName({ personId, peopleMap }: { personId?: string; peopleMap: Map<string, string> }) {
  if (!personId) return <span className="text-muted-foreground text-xs">—</span>;
  const name = peopleMap.get(personId);
  if (!name) return <span className="text-xs text-muted-foreground">—</span>;
  return <span className="text-xs font-medium truncate max-w-[120px] block">{name}</span>;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function UserStatusBadge({ user }: { user: Profile }) {
  if (user.is_suspended) {
    return <Badge variant="destructive">Bị khóa</Badge>;
  }
  if (!user.is_verified) {
    return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Chờ duyệt</Badge>;
  }
  return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Đã duyệt</Badge>;
}

// ─── TreeMappingDialog ────────────────────────────────────────────────────────

interface TreeMappingDialogProps {
  user: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TreeMappingDialog({ user, open, onOpenChange }: TreeMappingDialogProps) {
  const { data: initialLinked } = usePerson(user.linked_person);
  const { data: initialEditRoot } = usePerson(user.edit_root_person_id);

  const [linkedPerson, setLinkedPerson] = useState<SearchPerson | null>(null);
  const [editRootPerson, setEditRootPerson] = useState<SearchPerson | null>(null);

  useEffect(() => {
    if (open && (initialLinked !== undefined || !user.linked_person)) {
      setLinkedPerson(initialLinked ?? null);
      setEditRootPerson(initialEditRoot ?? null);
    }
  }, [open, initialLinked, initialEditRoot, user.linked_person]);

  const handleClose = () => onOpenChange(false);
  const updateLinked = useUpdateLinkedPerson();
  const updateEditRoot = useUpdateEditRootPerson();

  const handleSave = async () => {
    try {
      await Promise.all([
        updateLinked.mutateAsync({ userId: user.user_id, personId: linkedPerson?.id ?? null }),
        updateEditRoot.mutateAsync({ userId: user.user_id, personId: editRootPerson?.id ?? null }),
      ]);
      toast.success(`Đã lưu cài đặt cây cho ${user.full_name || user.email}`);
      handleClose();
    } catch (err) {
      toast.error('Lỗi khi lưu cài đặt');
      console.error(err);
    }
  };

  const isSaving = updateLinked.isPending || updateEditRoot.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Gắn vào cây gia phả
          </DialogTitle>
          <DialogDescription>
            <strong>{user.full_name || user.email}</strong>
            {' '}— Liên kết tài khoản với thành viên trong cây.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <PersonCombobox
            label="Thành viên tương ứng"
            hint="Người này là ai trong cây gia phả? Họ có thể tự sửa hồ sơ của mình."
            selected={linkedPerson}
            onSelect={setLinkedPerson}
          />

          {user.role === 'editor' && (
            <PersonCombobox
              label="Phạm vi sửa (tùy chọn)"
              hint="Chỉ sửa được người này và toàn bộ con cháu. Để trống = sửa toàn bộ cây."
              selected={editRootPerson}
              onSelect={setEditRootPerson}
            />
          )}

          {user.role !== 'editor' && (
            <p className="text-xs text-muted-foreground bg-muted rounded-md p-3">
              Phạm vi sửa chỉ áp dụng cho vai trò <strong>Biên tập viên</strong>.
              Hiện tại người dùng này là <strong>{roleLabels[user.role].label}</strong>.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Lưu cài đặt
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── SuspendDialog ────────────────────────────────────────────────────────────

function SuspendDialog({
  user,
  open,
  onOpenChange,
}: {
  user: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState('');
  const suspend = useSuspendUser();

  const handleSuspend = async () => {
    try {
      await suspend.mutateAsync({ profileId: user.id, reason });
      toast.success(`Đã khóa tài khoản ${user.full_name || user.email}`);
      onOpenChange(false);
      setReason('');
    } catch {
      toast.error('Lỗi khi khóa tài khoản');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Ban className="h-4 w-4" />
            Khóa tài khoản
          </DialogTitle>
          <DialogDescription>
            Khóa tài khoản <strong>{user.full_name || user.email}</strong>. Người dùng sẽ không thể sử dụng hệ thống.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label htmlFor="suspend-reason">Lý do khóa</Label>
          <Textarea
            id="suspend-reason"
            placeholder="Nhập lý do khóa tài khoản..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={suspend.isPending}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={handleSuspend} disabled={suspend.isPending || !reason.trim()}>
            {suspend.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Ban className="h-4 w-4 mr-2" />
                Khóa tài khoản
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── DeleteDialog ─────────────────────────────────────────────────────────────

function DeleteDialog({
  user,
  open,
  onOpenChange,
}: {
  user: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [confirmEmail, setConfirmEmail] = useState('');
  const deleteUser = useDeleteUser();

  const handleDelete = async () => {
    try {
      await deleteUser.mutateAsync({ userId: user.user_id });
      toast.success(`Đã xóa tài khoản ${user.full_name || user.email}`);
      onOpenChange(false);
      setConfirmEmail('');
    } catch {
      toast.error('Lỗi khi xóa tài khoản');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            Xóa tài khoản vĩnh viễn
          </DialogTitle>
          <DialogDescription>
            Hành động này <strong>không thể hoàn tác</strong>. Tất cả dữ liệu liên quan đến tài khoản{' '}
            <strong>{user.full_name || user.email}</strong> sẽ bị xóa vĩnh viễn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label htmlFor="confirm-email">Nhập email <strong>{user.email}</strong> để xác nhận</Label>
          <Input
            id="confirm-email"
            placeholder={user.email}
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteUser.isPending}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteUser.isPending || confirmEmail !== user.email}
          >
            {deleteUser.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa vĩnh viễn
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { profile: currentProfile } = useAuth();
  const { data: profiles, isLoading, error } = useProfiles();
  const { data: people } = usePeople();
  const queryClient = useQueryClient();
  const updateRole = useUpdateUserRole();
  const verifyUser = useVerifyUser();
  const unsuspendUser = useUnsuspendUser();

  const [filter, setFilter] = useState<FilterTab>('all');
  const [mappingUser, setMappingUser] = useState<Profile | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Profile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    currentRole: UserRole;
    newRole: UserRole;
    userName: string;
  } | null>(null);

  const peopleMap = useMemo(() => {
    const map = new Map<string, string>();
    if (people) {
      for (const p of people) {
        map.set(p.id, p.display_name);
      }
    }
    return map;
  }, [people]);

  // Filter counts
  const pendingCount = useMemo(() =>
    profiles?.filter(u => !u.is_verified).length || 0
  , [profiles]);

  const suspendedCount = useMemo(() =>
    profiles?.filter(u => u.is_suspended).length || 0
  , [profiles]);

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    switch (filter) {
      case 'pending':
        return profiles.filter(u => !u.is_verified);
      case 'suspended':
        return profiles.filter(u => u.is_suspended);
      default:
        return profiles;
    }
  }, [profiles, filter]);

  const handleRoleChange = (userId: string, newRole: UserRole, currentRole: UserRole, userName: string) => {
    if (newRole === currentRole) return;
    setConfirmDialog({ open: true, userId, currentRole, newRole, userName });
  };

  const confirmRoleChange = async () => {
    if (!confirmDialog) return;
    try {
      await updateRole.mutateAsync({ userId: confirmDialog.userId, role: confirmDialog.newRole });
      toast.success(`Đã cập nhật quyền cho ${confirmDialog.userName}`);
    } catch {
      toast.error('Lỗi khi cập nhật quyền');
    } finally {
      setConfirmDialog(null);
    }
  };

  const handleVerify = async (user: Profile) => {
    if (!currentProfile) return;
    try {
      await verifyUser.mutateAsync({ profileId: user.id, verifiedByProfileId: currentProfile.id });
      toast.success(`Đã duyệt tài khoản ${user.full_name || user.email}`);
    } catch {
      toast.error('Lỗi khi duyệt tài khoản');
    }
  };

  const handleUnsuspend = async (user: Profile) => {
    try {
      await unsuspendUser.mutateAsync({ profileId: user.id });
      toast.success(`Đã mở khóa tài khoản ${user.full_name || user.email}`);
    } catch {
      toast.error('Lỗi khi mở khóa tài khoản');
    }
  };

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
              <UserCog className="h-6 w-6" />
              Quản lý người dùng
            </h1>
            <p className="text-muted-foreground">Phân quyền, duyệt tài khoản, gắn vào cây gia phả</p>
          </div>
        </div>
      </div>

      {/* Role Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Cấp độ phân quyền
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.entries(roleLabels) as [UserRole, typeof roleLabels[UserRole]][]).map(([role, info]) => (
              <div key={role} className="flex items-start gap-3 p-3 rounded-lg border">
                <Badge className={info.color}>{info.label}</Badge>
                <span className="text-sm text-muted-foreground">{info.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs + Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Danh sách người dùng
          </CardTitle>
          <CardDescription>
            {isLoading ? 'Đang tải...' : `${profiles?.length || 0} người dùng đã đăng ký`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
            <TabsList>
              <TabsTrigger value="all">
                Tất cả {profiles ? `(${profiles.length})` : ''}
              </TabsTrigger>
              <TabsTrigger value="pending" className="relative">
                Chờ duyệt
                {pendingCount > 0 && (
                  <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-500 px-1 text-xs font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="suspended" className="relative">
                Đã khóa
                {suspendedCount > 0 && (
                  <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                    {suspendedCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-9 w-32" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center text-destructive">
              <p>Lỗi khi tải danh sách: {error.message}</p>
              <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['profiles'] })}>
                Thử lại
              </Button>
            </div>
          ) : filteredProfiles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead className="hidden lg:table-cell">Cây gia phả</TableHead>
                  <TableHead className="hidden md:table-cell">Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {(user.full_name || user.email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name || 'Chưa cập nhật'}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                    <TableCell>
                      <UserStatusBadge user={user} />
                    </TableCell>
                    <TableCell>
                      <Badge className={roleLabels[user.role].color}>
                        {roleLabels[user.role].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="space-y-0.5">
                        {user.linked_person ? (
                          <div className="flex items-center gap-1 text-xs">
                            <Link2 className="h-3 w-3 text-green-600 shrink-0" />
                            <PersonName personId={user.linked_person} peopleMap={peopleMap} />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Chưa gắn</span>
                        )}
                        {user.edit_root_person_id && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <GitBranch className="h-3 w-3 shrink-0" />
                            <PersonName personId={user.edit_root_person_id} peopleMap={peopleMap} />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(user.created_at, { day: '2-digit', month: '2-digit', year: 'numeric' })}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Verify button */}
                        {!user.is_verified && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleVerify(user)}
                            disabled={verifyUser.isPending}
                            title="Duyệt tài khoản"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {/* Unsuspend button */}
                        {user.is_suspended && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleUnsuspend(user)}
                            disabled={unsuspendUser.isPending}
                            title="Mở khóa"
                          >
                            <Unlock className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {/* Suspend button (only for verified, non-suspended, non-admin users) */}
                        {user.is_verified && !user.is_suspended && user.role !== 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={() => setSuspendTarget(user)}
                            title="Khóa tài khoản"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {/* Tree mapping button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => setMappingUser(user)}
                          title="Gắn vào cây gia phả"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                        </Button>

                        {/* Role selector */}
                        <Select
                          value={user.role}
                          onValueChange={(value) =>
                            handleRoleChange(
                              user.user_id,
                              value as UserRole,
                              user.role,
                              user.full_name || user.email,
                            )
                          }
                        >
                          <SelectTrigger className="w-36 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-red-500" />
                                Quản trị viên
                              </span>
                            </SelectItem>
                            <SelectItem value="editor">
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                Biên tập viên
                              </span>
                            </SelectItem>
                            <SelectItem value="viewer">
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-gray-500" />
                                Người xem
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Delete button (admin only, can't delete self) */}
                        {user.user_id !== currentProfile?.user_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(user)}
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>
                {filter === 'pending'
                  ? 'Không có tài khoản nào đang chờ duyệt'
                  : filter === 'suspended'
                  ? 'Không có tài khoản nào bị khóa'
                  : 'Chưa có người dùng nào đăng ký'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm role change dialog */}
      <AlertDialog open={confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thay đổi quyền</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn thay đổi quyền của <strong>{confirmDialog?.userName}</strong> từ{' '}
              <Badge className={roleLabels[confirmDialog?.currentRole || 'viewer'].color}>
                {roleLabels[confirmDialog?.currentRole || 'viewer'].label}
              </Badge>{' '}
              sang{' '}
              <Badge className={roleLabels[confirmDialog?.newRole || 'viewer'].color}>
                {roleLabels[confirmDialog?.newRole || 'viewer'].label}
              </Badge>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange} disabled={updateRole.isPending}>
              {updateRole.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Xác nhận
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tree mapping dialog */}
      {mappingUser && (
        <TreeMappingDialog
          user={mappingUser}
          open={!!mappingUser}
          onOpenChange={(open) => { if (!open) setMappingUser(null); }}
        />
      )}

      {/* Suspend dialog */}
      {suspendTarget && (
        <SuspendDialog
          user={suspendTarget}
          open={!!suspendTarget}
          onOpenChange={(open) => { if (!open) setSuspendTarget(null); }}
        />
      )}

      {/* Delete dialog */}
      {deleteTarget && (
        <DeleteDialog
          user={deleteTarget}
          open={!!deleteTarget}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}
