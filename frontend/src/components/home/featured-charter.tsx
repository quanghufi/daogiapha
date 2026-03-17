/**
 * @project AncestorTree
 * @file src/components/home/featured-charter.tsx
 * @description Featured clan charter articles for homepage
 * @version 1.0.0
 * @updated 2026-02-25
 */

'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useFeaturedArticles } from '@/hooks/use-clan-articles';

const categoryLabels: Record<string, string> = {
  gioi_thieu: 'Giới thiệu',
  gia_huan: 'Gia huấn',
  quy_uoc: 'Quy ước',
  loi_dan: 'Lời dặn',
};

export function FeaturedCharter() {
  const { data: articles, isLoading } = useFeaturedArticles();

  if (isLoading || !articles || articles.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Hương ước dòng họ
            </CardTitle>
            <CardDescription>Gia huấn và quy ước truyền thống</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/charter">
              Xem tất cả
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {articles.slice(0, 3).map((article) => (
            <div key={article.id} className="border-l-2 border-emerald-500 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm">{article.title}</h4>
                <Badge variant="outline" className="text-xs">
                  {categoryLabels[article.category] || article.category}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {article.content}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
