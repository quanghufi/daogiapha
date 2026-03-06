/**
 * @project AncestorTree
 * @file src/app/(auth)/forgot-password/page.tsx
 * @description Forgot password page - sends reset email via Supabase
 * @version 1.0.0
 * @updated 2026-02-25
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success('Email đặt lại mật khẩu đã được gửi!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gửi email thất bại';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="theme-auth-shell">
      <Card className="theme-auth-card w-full max-w-md">
        <CardHeader className="text-center">
          <div className="theme-brand-mark mx-auto mb-4 flex h-12 w-12 items-center justify-center text-xl font-bold">
            Đ
          </div>
          <CardTitle>Quên mật khẩu</CardTitle>
          <CardDescription>
            Nhập email để nhận link đặt lại mật khẩu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <div className="theme-status-icon mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                <Mail className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                Email đặt lại mật khẩu đã được gửi đến <strong>{email}</strong>.
                Vui lòng kiểm tra hộp thư (bao gồm thư rác).
              </p>
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại đăng nhập
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <Link href="/login" className="theme-link inline-flex items-center">
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
