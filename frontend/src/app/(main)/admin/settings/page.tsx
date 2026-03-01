/**
 * @project AncestorTree
 * @file src/app/(main)/admin/settings/page.tsx
 * @description Admin settings — Backup, Restore & Reset data
 * @version 1.1.0
 * @updated 2026-03-01
 */

'use client';

import { useRef, useState } from 'react';
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
  Upload,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileUp,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { isAdmin, user } = useAuth();

  // Backup state
  const [backupPassword, setBackupPassword] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupResult, setBackupResult] = useState<{ success: boolean; message: string } | null>(null);

  // Restore state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreFile, setRestoreFile] = useState<{ name: string; data: unknown } | null>(null);
  const [restoreStep, setRestoreStep] = useState<0 | 1 | 2>(0); // 0=closed, 1=preview, 2=password
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{ success: boolean; message: string } | null>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.exported_at || !data.version || !data.tables) {
          setRestoreResult({ success: false, message: 'File không đúng định dạng backup. Vui lòng chọn file backup hợp lệ.' });
          return;
        }
        setRestoreFile({ name: file.name, data });
        setRestoreResult(null);
        setRestoreStep(1);
      } catch {
        setRestoreResult({ success: false, message: 'Không thể đọc file. Vui lòng chọn file JSON hợp lệ.' });
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const getRestoreStats = () => {
    if (!restoreFile?.data) return null;
    const tables = (restoreFile.data as { tables: Record<string, unknown[]> }).tables;
    const exportedAt = (restoreFile.data as { exported_at: string }).exported_at;
    return {
      exportedAt: new Date(exportedAt).toLocaleString('vi-VN'),
      people: tables.people?.length || 0,
      families: tables.families?.length || 0,
      events: tables.events?.length || 0,
      achievements: tables.achievements?.length || 0,
      contributions: tables.contributions?.length || 0,
      fundTransactions: tables.fund_transactions?.length || 0,
      scholarships: tables.scholarships?.length || 0,
      articles: tables.clan_articles?.length || 0,
      media: tables.media?.length || 0,
    };
  };

  const handleRestore = async () => {
    if (!restorePassword || !user?.email || !restoreFile) return;
    setRestoreLoading(true);
    setRestoreResult(null);

    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: restorePassword,
          backup: restoreFile.data,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRestoreResult({ success: false, message: data.error || 'Có lỗi xảy ra' });
        return;
      }

      setRestoreResult({ success: true, message: 'Khôi phục dữ liệu thành công! Trang sẽ tải lại sau 3 giây...' });
      setRestorePassword('');
      setRestoreStep(0);
      setRestoreFile(null);
      setTimeout(() => window.location.reload(), 3000);
    } catch {
      setRestoreResult({ success: false, message: 'Lỗi kết nối. Vui lòng thử lại.' });
    } finally {
      setRestoreLoading(false);
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

      {/* ===== RESTORE SECTION ===== */}
      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <Upload className="h-5 w-5" />
            Khôi phục dữ liệu (Restore)
          </CardTitle>
          <CardDescription>
            Khôi phục dữ liệu từ file backup đã tải về trước đó.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info box */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
            <p className="text-sm font-semibold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Lưu ý quan trọng:
            </p>
            <ul className="text-sm text-amber-900 list-disc list-inside space-y-1">
              <li>Dữ liệu hiện tại sẽ bị <strong>thay thế hoàn toàn</strong> bởi dữ liệu trong file backup</li>
              <li>Nên backup dữ liệu hiện tại trước khi restore</li>
              <li>Chỉ sử dụng file backup được tạo từ hệ thống này</li>
            </ul>
          </div>

          {/* File input (hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Select file button */}
          <Button
            variant="outline"
            className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="h-4 w-4" />
            Chọn file backup (.json)
          </Button>

          {/* Restore dialog — Step 1: Preview */}
          <AlertDialog open={restoreStep === 1} onOpenChange={(open) => {
            if (!open) { setRestoreStep(0); setRestoreFile(null); }
          }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-emerald-700">
                  <Upload className="h-5 w-5" />
                  Xác nhận khôi phục dữ liệu
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <span className="block">
                      File: <strong>{restoreFile?.name}</strong>
                    </span>
                    {(() => {
                      const stats = getRestoreStats();
                      if (!stats) return null;
                      return (
                        <div className="rounded-lg border bg-muted/50 p-3 space-y-1.5 text-sm">
                          <p><strong>Ngày backup:</strong> {stats.exportedAt}</p>
                          <p><strong>Thành viên:</strong> {stats.people} | <strong>Gia đình:</strong> {stats.families}</p>
                          <p><strong>Sự kiện:</strong> {stats.events} | <strong>Đề xuất:</strong> {stats.contributions}</p>
                          <p><strong>Vinh danh:</strong> {stats.achievements} | <strong>Quỹ:</strong> {stats.fundTransactions}</p>
                          <p><strong>Học bổng:</strong> {stats.scholarships} | <strong>Hương ước:</strong> {stats.articles}</p>
                          <p><strong>Ảnh:</strong> {stats.media}</p>
                        </div>
                      );
                    })()}
                    <span className="block text-amber-700 font-semibold">
                      Dữ liệu hiện tại sẽ bị thay thế bởi nội dung trong file backup.
                    </span>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setRestoreStep(0); setRestoreFile(null); }}>
                  Hủy
                </AlertDialogCancel>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setRestoreStep(2)}
                >
                  Tiếp tục
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Restore dialog — Step 2: Password */}
          <AlertDialog open={restoreStep === 2} onOpenChange={(open) => {
            if (!open) { setRestoreStep(0); setRestorePassword(''); setRestoreFile(null); }
          }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-emerald-700">
                  Nhập mật khẩu để xác nhận khôi phục
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Nhập mật khẩu admin để bắt đầu khôi phục dữ liệu từ file backup.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2 py-2">
                <Label htmlFor="restore-password">Mật khẩu admin</Label>
                <Input
                  id="restore-password"
                  type="password"
                  placeholder="Nhập mật khẩu admin"
                  value={restorePassword}
                  onChange={(e) => setRestorePassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && restorePassword) handleRestore();
                  }}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setRestoreStep(0); setRestorePassword(''); setRestoreFile(null); }}>
                  Hủy
                </AlertDialogCancel>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleRestore}
                  disabled={!restorePassword || restoreLoading}
                >
                  {restoreLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang khôi phục...</>
                  ) : (
                    'Xác nhận khôi phục'
                  )}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Restore result */}
          {restoreResult && (
            <div className={`rounded-lg border p-3 flex items-start gap-2 ${
              restoreResult.success
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}>
              {restoreResult.success ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{restoreResult.message}</p>
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
