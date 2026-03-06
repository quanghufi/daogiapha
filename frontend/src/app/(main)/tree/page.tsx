/**
 * @project AncestorTree
 * @file src/app/(main)/tree/page.tsx
 * @description Family tree visualization page with traditional Vietnamese theme
 * @version 3.0.0
 * @updated 2026-03-06
 */

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTreeData } from '@/hooks/use-families';
import { downloadGedcom } from '@/lib/gedcom-export';
import {
  TraditionalHeader,
  TraditionalScroll,
  TraditionalFooter,
  TraditionalBorder,
} from '@/components/tree/traditional-header';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const FamilyTree = dynamic(
  () => import('@/components/tree/family-tree').then(m => ({ default: m.FamilyTree })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[60vh] w-full rounded-lg" />,
  }
);

export default function TreePage() {
  const { data: treeData } = useTreeData();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const [{ getFullTreeData }, { generateGedcom }] = await Promise.all([
        import('@/lib/supabase-data'),
        import('@/lib/gedcom-export'),
      ]);
      const fullData = await getFullTreeData();
      const content = generateGedcom(fullData);
      downloadGedcom(content);
      toast.success('Xuất file GEDCOM thành công');
    } catch {
      toast.error('Lỗi khi xuất file');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen pb-8"
      style={{
        backgroundImage: 'url(/tree-assets/bg-pattern.png)',
        backgroundRepeat: 'repeat',
        backgroundSize: '400px 400px',
      }}
    >
      {/* Subtle overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50/60 via-transparent to-amber-50/60 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-4 space-y-4">
        {/* Traditional Header with temple & family name */}
        <TraditionalHeader familyName="Đào Tộc" subtitle="Ninh Thôn - Gia Phả Điện Tử" />

        {/* Export button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || !treeData}
            className="bg-amber-50/80 border-yellow-700/40 text-yellow-900 hover:bg-amber-100/80 hover:border-yellow-700/60"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Xuất GEDCOM
          </Button>
        </div>

        {/* Main tree area with traditional border & scrolls */}
        <div className="relative">
          {/* Left scroll - Câu đối trái */}
          <TraditionalScroll text="Phúc Đức Tổ Tiên" side="left" />

          {/* Right scroll - Câu đối phải */}
          <TraditionalScroll text="Con Cháu Thảo Hiền" side="right" />

          {/* Tree content with traditional border */}
          <div className="lg:mx-[90px]">
            <TraditionalBorder>
              <FamilyTree />
            </TraditionalBorder>
          </div>
        </div>

        {/* Lotus footer decoration */}
        <TraditionalFooter />
      </div>
    </div>
  );
}
