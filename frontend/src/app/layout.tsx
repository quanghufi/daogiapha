/**
 * @project AncestorTree
 * @file src/app/layout.tsx
 * @description Root layout with providers (Auth, Tooltip, Toaster)
 * @version 2.0.0
 * @updated 2026-02-25
 */

import type { Metadata } from "next";
import { Be_Vietnam_Pro, Noto_Serif } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { DEFAULT_CLAN_MOTTO, DEFAULT_CLAN_NAME } from "@/lib/clan-defaults";

const bodyFont = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const headingFont = Noto_Serif({
  subsets: ["latin", "vietnamese"],
  variable: "--font-display",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `Gia Phả Điện Tử - ${DEFAULT_CLAN_NAME}`,
    template: '%s | Gia Phả Đào tộc',
  },
  description: `Phần mềm quản lý gia phả điện tử cho ${DEFAULT_CLAN_NAME}. Lưu trữ thông tin dòng họ, cây gia phả, lịch giỗ chạp.`,
  keywords: ['gia phả', 'gia phả điện tử', 'Đào tộc', 'Ninh thôn', 'dòng họ', 'cây gia phả', 'phả hệ'],
  authors: [{ name: DEFAULT_CLAN_NAME }],
  openGraph: {
    title: `Gia Phả Điện Tử - ${DEFAULT_CLAN_NAME}`,
    description: DEFAULT_CLAN_MOTTO,
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
      <body className={`${bodyFont.variable} ${headingFont.variable} font-sans antialiased`}>
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
