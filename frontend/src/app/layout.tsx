/**
 * @project AncestorTree
 * @file src/app/layout.tsx
 * @description Root layout with providers (Auth, Tooltip, Toaster)
 * @version 2.0.0
 * @updated 2026-02-25
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: 'Gia Phả Điện Tử - Đào tộc - Ninh thôn',
    template: '%s | Gia Phả Đào tộc',
  },
  description: 'Phần mềm quản lý gia phả điện tử cho Đào tộc - Ninh thôn. Lưu trữ thông tin dòng họ, cây gia phả, lịch giỗ chạp.',
  keywords: ['gia phả', 'gia phả điện tử', 'Đào tộc', 'Ninh thôn', 'dòng họ', 'cây gia phả', 'phả hệ'],
  authors: [{ name: 'Đào tộc - Ninh thôn' }],
  openGraph: {
    title: 'Gia Phả Điện Tử - Đào tộc - Ninh thôn',
    description: 'Gìn giữ tinh hoa - Tiếp bước cha ông',
    type: 'website',
    locale: 'vi_VN',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
