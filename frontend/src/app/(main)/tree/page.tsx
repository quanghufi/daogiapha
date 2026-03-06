/**
 * @project AncestorTree
 * @file src/app/(main)/tree/page.tsx
 * @description Family tree visualization page with GEDCOM export
 * @version 2.0.0
 * @updated 2026-02-25
 */

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTreeData } from '@/hooks/use-families';
import { downloadGedcom } from '@/lib/gedcom-export';
import { GitBranchPlus, Download, Loader2 } from 'lucide-react';
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
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranchPlus className="h-6 w-6" />
            Cây Gia Phả
          </h1>
          <p className="text-muted-foreground">
            Sơ đồ phả hệ trực quan - Click vào từng thành viên để xem chi tiết
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting || !treeData}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Xuất GEDCOM
        </Button>
      </div>

      <FamilyTree />
    </div>
  );
}
