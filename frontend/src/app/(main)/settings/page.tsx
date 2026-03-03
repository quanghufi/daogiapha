/**
 * @project AncestorTree
 * @file src/app/(main)/settings/page.tsx
 * @description User settings — profile info, avatar, password change (Sprint 8)
 * @version 1.0.0
 */

'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useUpdateProfile } from '@/hooks/use-profiles';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/supabase-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Settings, User, Lock, Camera, Loader2, CheckCircle, Shield,
  Mail, Calendar, Link2, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'Quản trị viên', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  editor: { label: 'Biên tập viên', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  viewer: { label: 'Người xem', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
};

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const updateProfile = useUpdateProfile();

  // Profile form
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [isSavingName, setIsSavingName] = useState(false);

  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!user || !profile) {
    return null;
  }

  const initials = (profile.full_name || profile.email)
    .split(' ')
    .map((n: string) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const handleSaveName = async () => {
    if (!fullName.trim() || fullName === profile.full_name) return;
    setIsSavingName(true);
    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        input: { full_name: fullName.trim() },
      });
      await refreshProfile();
      toast.success('Đã cập nhật tên thành công');
    } catch {
      toast.error('Lỗi khi cập nhật tên');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      // Upload to storage using profile user_id as folder
      const url = await uploadFile(file, `profile-${user.id}`);
      await updateProfile.mutateAsync({
        userId: user.id,
        input: { avatar_url: url },
      });
      await refreshProfile();
      toast.success('Đã cập nhật ảnh đại diện');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi tải ảnh lên');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) return;
    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Đã đổi mật khẩu thành công');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi đổi mật khẩu');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const roleInfo = roleLabels[profile.role] || roleLabels.viewer;

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Cài đặt tài khoản
        </h1>
        <p className="text-muted-foreground">Quản lý thông tin cá nhân và bảo mật</p>
      </div>

      <Separator />

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Ảnh đại diện
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {isUploadingAvatar ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </button>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Nhấn vào ảnh để thay đổi. Chấp nhận JPEG, PNG, WebP, GIF (tối đa 5MB).
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang tải...</>
              ) : (
                <><Camera className="h-4 w-4 mr-2" /> Chọn ảnh</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Thông tin cá nhân
          </CardTitle>
          <CardDescription>Cập nhật tên hiển thị của bạn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Full name (editable) */}
          <div className="space-y-2">
            <Label htmlFor="full-name">Họ và tên</Label>
            <div className="flex gap-2">
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
              />
              <Button
                onClick={handleSaveName}
                disabled={isSavingName || !fullName.trim() || fullName === profile.full_name}
              >
                {isSavingName ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Email
            </Label>
            <Input value={profile.email} disabled />
          </div>

          {/* Role (read-only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Vai trò
            </Label>
            <div>
              <Badge className={roleInfo.color}>{roleInfo.label}</Badge>
            </div>
          </div>

          {/* Created at */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Ngày tạo tài khoản
            </Label>
            <p className="text-sm text-muted-foreground">
              {formatDate(profile.created_at, { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Đổi mật khẩu
          </CardTitle>
          <CardDescription>Thay đổi mật khẩu đăng nhập của bạn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Mật khẩu mới</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">Mật khẩu không khớp</p>
            )}
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={isChangingPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
          >
            {isChangingPassword ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang đổi...</>
            ) : (
              <><Lock className="h-4 w-4 mr-2" /> Đổi mật khẩu</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Trạng thái tài khoản
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Xác minh</span>
            {profile.is_verified ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Đã xác minh
              </Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Chờ duyệt
              </Badge>
            )}
          </div>

          {profile.linked_person && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Liên kết trong cây</span>
              <Badge variant="outline" className="gap-1">
                <Link2 className="h-3 w-3" />
                Đã liên kết
              </Badge>
            </div>
          )}

          {profile.verified_at && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ngày xác minh</span>
              <span className="text-sm text-muted-foreground">
                {formatDate(profile.verified_at, { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
