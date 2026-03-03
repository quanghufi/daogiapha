'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

export default function PendingVerificationPage() {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Tài khoản đang chờ duyệt</CardTitle>
          <CardDescription>
            Tài khoản của bạn đã được tạo thành công nhưng cần quản trị viên phê duyệt trước khi sử dụng.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Vui lòng liên hệ quản trị viên để được phê duyệt tài khoản. Bạn sẽ nhận được thông báo khi tài khoản được kích hoạt.
          </p>
          <Button variant="outline" onClick={signOut} className="w-full">
            Đăng xuất
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
