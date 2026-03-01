/**
 * @project AncestorTree
 * @file src/app/api/admin/backup/route.ts
 * @description API route for admin data backup (requires admin password)
 * @version 1.0.0
 * @updated 2026-03-01
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import { exportAllData } from '@/lib/supabase-data-settings';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email và mật khẩu là bắt buộc' }, { status: 400 });
    }

    // Verify admin credentials via Supabase Auth
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Mật khẩu không đúng' }, { status: 401 });
    }

    // Verify user is admin (using service role to bypass RLS)
    let admin;
    try {
      admin = createServerClient();
    } catch {
      return NextResponse.json(
        { error: 'Lỗi cấu hình server: thiếu SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 },
      );
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: `Không tìm thấy hồ sơ người dùng (${profileError.message})` },
        { status: 403 },
      );
    }

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: `Bạn không có quyền quản trị viên (role hiện tại: ${profile?.role || 'không có'})` },
        { status: 403 },
      );
    }

    // Export data
    const backup = await exportAllData();

    return NextResponse.json(backup);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
