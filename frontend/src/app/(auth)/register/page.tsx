'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/auth-provider';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Mật khẩu không khớp');
      return;
    }
    
    if (password.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signUp(email, password, fullName);
      toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.');
      router.push('/login');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Đăng ký thất bại';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mb-4">
            Đ
          </div>
          <CardTitle>Đăng ký</CardTitle>
          <CardDescription>
            Tạo tài khoản để truy cập Gia Phả Điện Tử
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Đào Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Đã có tài khoản? </span>
            <Link href="/login" className="text-emerald-600 hover:underline">
              Đăng nhập
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
