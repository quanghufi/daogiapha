/**
 * @project AncestorTree
 * @file src/app/(main)/admin/settings/page.tsx
 * @description Admin settings — Backup & Reset data
 * @version 1.0.0
 * @updated 2026-03-01
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Settings,
  Download,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { isAdmin, user } = useAuth();

  // Backup state
  const [backupPassword, setBackupPassword] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupResult, setBackupResult] = useState<{ success: boolean; message: string } | null>(null);

  // Reset state
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0); // 0=closed, 1=warning, 2=password
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold">Không có quyền truy cập</p>
            <p className="text-muted-foreground">Trang này chỉ dành cho Quản trị viên (Admin).</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleBackup = async () => {
    if (!backupPassword || !user?.email) return;
    setBackupLoading(true);
    setBackupResult(null);

    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: backupPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBackupResult({ success: false, message: data.error || 'Có lỗi xảy ra' });
        return;
      }

      // Trigger download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `gia-pha-backup_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupResult({ success: true, message: 'Backup thành công! File đã được tải xuống.' });
      setBackupPassword('');
    } catch {
      setBackupResult({ success: false, message: 'Lỗi kết nối. Vui lòng thử lại.' });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleReset = async () => {
    if (!resetPassword || !user?.email) return;
    setResetLoading(true);
    setResetResult(null);

    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: resetPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResetResult({ success: false, message: data.error || 'Có lỗi xảy ra' });
        return;
      }

      setResetResult({ success: true, message: 'Đã reset dữ liệu thành công. Chỉ giữ lại tài khoản admin.' });
      setResetPassword('');
      setResetStep(0);
    } catch {
      setResetResult({ success: false, message: 'Lỗi kết nối. Vui lòng thử lại.' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Cài đặt hệ thống
        </h1>
        <p className="text-muted-foreground">Sao lưu và quản lý dữ liệu gia phả.</p>
      </div>

      <Separator />

      {/* ===== BACKUP SECTION ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Sao lưu dữ liệu (Backup)
          </CardTitle>
          <CardDescription>
            Tải toàn bộ dữ liệu gia phả về máy tính dưới dạng file JSON.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info box */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm leading-relaxed text-blue-900">
              <strong>File backup bao gồm:</strong> Thành viên, gia đình, quan hệ,
              sự kiện, đề xuất, vinh danh, quỹ khuyến học, học bổng, hương ước,
              cầu đương, và ảnh (đường dẫn). Bạn nên backup định kỳ để phòng mất dữ liệu.
            </p>
          </div>

          {/* Backup dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="gap-2">
                <Download className="h-4 w-4" />
                Tải backup
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận sao lưu dữ liệu</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn đang chuẩn bị tải toàn bộ dữ liệu gia phả. Nhập mật khẩu
                  admin để xác nhận.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2 py-2">
                <Label htmlFor="backup-password">Mật khẩu</Label>
                <Input
                  id="backup-password"
                  type="password"
                  placeholder="Nhập mật khẩu admin"
                  value={backupPassword}
                  onChange={(e) => setBackupPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && backupPassword) handleBackup();
                  }}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setBackupPassword(''); setBackupResult(null); }}>
                  Hủy
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => { e.preventDefault(); handleBackup(); }}
                  disabled={!backupPassword || backupLoading}
                >
                  {backupLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang tải...</>
                  ) : (
                    'Xác nhận & Tải'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Backup result */}
          {backupResult && (
            <div className={`rounded-lg border p-3 flex items-start gap-2 ${
              backupResult.success
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}>
              {backupResult.success ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{backupResult.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== RESET SECTION ===== */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="h-5 w-5" />
            Reset dữ liệu
          </CardTitle>
          <CardDescription>
            Xóa toàn bộ dữ liệu nội dung và bắt đầu lại từ đầu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Danger warning */}
          <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 space-y-3">
            <p className="text-base font-bold text-red-800 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              CẢNH BÁO: Hành động này KHÔNG THỂ HOÀN TÁC!
            </p>
            <p className="text-sm leading-relaxed text-red-800">
              Toàn bộ dữ liệu sau sẽ bị <strong>XÓA VĨNH VIỄN</strong>:
            </p>
            <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
              <li>Tất cả thành viên, gia đình, quan hệ cha-con</li>
              <li>Tất cả ảnh đã tải lên</li>
              <li>Tất cả sự kiện, lịch cúng lễ</li>
              <li>Tất cả đề xuất chỉnh sửa</li>
              <li>Tất cả vinh danh, thành tích</li>
              <li>Tất cả giao dịch quỹ khuyến học, học bổng</li>
              <li>Tất cả hương ước, gia huấn</li>
              <li>Tất cả phân công cầu đương</li>
              <li>Tất cả tài khoản không phải admin</li>
            </ul>
            <p className="text-sm font-semibold text-red-800">
              Chỉ giữ lại: tài khoản admin (bạn).
            </p>
          </div>

          {/* Reset dialog — Step 1: Warning */}
          <AlertDialog open={resetStep === 1} onOpenChange={(open) => {
            if (!open) { setResetStep(0); setResetResult(null); }
          }}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => setResetStep(1)}
              >
                <Trash2 className="h-4 w-4" />
                Reset dữ liệu
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-700 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  Bạn chắc chắn muốn xóa toàn bộ dữ liệu?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <span className="block">
                    Hành động này sẽ xóa vĩnh viễn tất cả thành viên, gia đình,
                    sự kiện, ảnh, vinh danh, quỹ, hương ước, cầu đương và các
                    tài khoản không phải admin.
                  </span>
                  <span className="block font-semibold text-red-700">
                    Không thể hoàn tác sau khi xóa. Hãy backup dữ liệu trước!
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setResetStep(0)}>
                  Hủy
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={() => setResetStep(2)}
                >
                  Tôi hiểu, tiếp tục
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Reset dialog — Step 2: Password */}
          <AlertDialog open={resetStep === 2} onOpenChange={(open) => {
            if (!open) { setResetStep(0); setResetPassword(''); setResetResult(null); }
          }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-700">
                  Nhập mật khẩu để xác nhận xóa
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Đây là bước cuối cùng. Nhập mật khẩu admin để xóa toàn bộ dữ liệu.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2 py-2">
                <Label htmlFor="reset-password">Mật khẩu admin</Label>
                <Input
                  id="reset-password"
                  type="password"
                  placeholder="Nhập mật khẩu admin"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && resetPassword) handleReset();
                  }}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setResetStep(0); setResetPassword(''); }}>
                  Hủy
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={handleReset}
                  disabled={!resetPassword || resetLoading}
                >
                  {resetLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang xóa dữ liệu...</>
                  ) : (
                    'Xóa vĩnh viễn'
                  )}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Reset result */}
          {resetResult && (
            <div className={`rounded-lg border p-3 flex items-start gap-2 ${
              resetResult.success
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}>
              {resetResult.success ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{resetResult.message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
