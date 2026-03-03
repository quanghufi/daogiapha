'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ban } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

export default function AccountSuspendedPage() {
  const { signOut, profile } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Ban className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Tài khoản đã bị khóa</CardTitle>
          <CardDescription>
            Tài khoản của bạn đã bị quản trị viên tạm khóa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.suspended_reason && (
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              <strong>Lý do:</strong> {profile.suspended_reason}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn.
          </p>
          <Button variant="outline" onClick={signOut} className="w-full">
            Đăng xuất
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
