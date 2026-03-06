/**
 * @project AncestorTree
 * @file src/app/(main)/page.tsx
 * @description Homepage with hero, features, stats, and upcoming events
 * @version 2.0.0
 * @updated 2026-03-06
 */

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranchPlus, Calendar, Users, ArrowRight } from 'lucide-react';
import { StatsCard } from '@/components/home/stats-card';
import { FeaturedCharter } from '@/components/home/featured-charter';

const features = [
  {
    title: 'Cây Gia Phả',
    description: 'Khám phá cội nguồn và các thế hệ trong dòng tộc qua sơ đồ trực quan.',
    icon: GitBranchPlus,
    href: '/tree',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    title: 'Lịch Cúng Lễ',
    description: 'Theo dõi các ngày giỗ chạp, lễ tết và sự kiện quan trọng của dòng họ.',
    icon: Calendar,
    href: '/events',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    title: 'Thành Viên',
    description: 'Danh sách thành viên và thông tin liên lạc để gắn kết tình thân.',
    icon: Users,
    href: '/people',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden border-b border-amber-200"
        style={{
          backgroundImage: 'url(/tree-assets/bg-pattern.png)',
          backgroundRepeat: 'repeat',
          backgroundSize: '320px 320px',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100/95 via-amber-50/85 to-amber-100/95" />

        <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-amber-700 via-yellow-500 to-amber-700 opacity-60" />
        <div className="absolute right-0 top-0 h-full w-2 bg-gradient-to-b from-amber-700 via-yellow-500 to-amber-700 opacity-60" />

        <div className="container relative z-10 mx-auto px-4 py-10 md:py-14">
          <div className="relative mx-auto max-w-5xl rounded-2xl border-2 border-amber-700/70 bg-amber-50/80 px-5 py-8 shadow-[0_16px_36px_rgba(125,85,15,0.18)] backdrop-blur-sm md:px-10 md:py-10">
            <div className="relative mx-auto mb-4 w-full max-w-[360px] aspect-[560/250]">
              <Image
                src="/tree-assets/temple-header-trim.png"
                alt="Trang trí gia phả"
                fill
                sizes="(max-width: 768px) 80vw, 360px"
                className="object-contain"
                priority
              />
            </div>

            <div className="mx-auto mb-5 w-fit rounded-md border border-yellow-500 bg-gradient-to-r from-red-900/95 via-red-800/95 to-red-900/95 px-5 py-2 text-center shadow-md">
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-yellow-200">Gia phả điện tử</p>
              <h1
                className="text-2xl font-bold tracking-wide text-yellow-300 md:text-4xl"
                style={{ fontFamily: '"Noto Serif", "Times New Roman", serif' }}
              >
                Đào tộc - Ninh thôn
              </h1>
            </div>

            <p className="mx-auto mb-7 max-w-2xl text-center text-base text-amber-900/85 md:text-lg">
              &ldquo;Gìn giữ tinh hoa - Tiếp bước cha ông&rdquo;
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-amber-700 text-white hover:bg-amber-800">
                <Link href="/tree">
                  <GitBranchPlus className="mr-2 h-5 w-5" />
                  Xem Gia Phả
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-amber-700 bg-transparent text-amber-900 hover:bg-amber-100"
              >
                <Link href="/people">
                  <Users className="mr-2 h-5 w-5" />
                  Danh sách thành viên
                </Link>
              </Button>
            </div>

            <div className="pointer-events-none absolute -bottom-1 left-3 hidden lg:block">
              <div className="relative w-[120px] aspect-[296/205] overflow-hidden opacity-80">
                <Image
                  src="/tree-assets/lotus-decoration-trim.png"
                  alt="Hoa sen trái"
                  fill
                  sizes="120px"
                  className="object-cover object-left"
                />
              </div>
            </div>
            <div className="pointer-events-none absolute -bottom-1 right-3 hidden lg:block">
              <div className="relative w-[120px] aspect-[296/205] overflow-hidden opacity-80">
                <Image
                  src="/tree-assets/lotus-decoration-trim.png"
                  alt="Hoa sen phải"
                  fill
                  sizes="120px"
                  className="object-cover object-right"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="group-hover:translate-x-1 transition-transform">
                  <Link href={feature.href}>
                    Xem ngay
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section - Dynamic */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <StatsCard />
      </section>

      {/* Featured Charter */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <FeaturedCharter />
      </section>

      {/* Upcoming Events */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <Card>
          <CardHeader>
            <CardTitle>🕯️ Ngày giỗ sắp tới</CardTitle>
            <CardDescription>Các ngày giỗ trong 30 ngày tới</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Chưa có dữ liệu ngày giỗ</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/people">Thêm thành viên để quản lý ngày giỗ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
