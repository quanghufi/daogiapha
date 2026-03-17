/**
 * @project AncestorTree
 * @file src/app/(main)/charter/page.tsx
 * @description Family charter page - Hương ước dòng họ
 * @version 1.0.0
 * @updated 2026-02-25
 */

'use client';

import { useState } from 'react';
import { useClanArticles } from '@/hooks/use-clan-articles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollText, BookOpen, MessageCircle, Star, Info } from 'lucide-react';
import type { ClanArticle, ClanArticleCategory } from '@/types';

const TABS: { value: ClanArticleCategory; label: string; icon: typeof ScrollText }[] = [
  { value: 'gioi_thieu', label: 'Giới thiệu', icon: Info },
  { value: 'gia_huan', label: 'Gia huấn', icon: BookOpen },
  { value: 'quy_uoc', label: 'Quy ước', icon: ScrollText },
  { value: 'loi_dan', label: 'Lời dặn con cháu', icon: MessageCircle },
];

function ArticleCard({ article, index }: { article: ClanArticle; index?: number }) {
  return (
    <div className="py-4">
      <div className="flex items-start gap-2">
        {article.is_featured && <Star className="h-4 w-4 text-amber-500 mt-1 shrink-0" />}
        <div className="flex-1">
          <h3 className="font-semibold text-base">
            {index != null && <span className="text-muted-foreground mr-2">{index}.</span>}
            {article.title}
          </h3>
          <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {article.content}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturedQuote({ article }: { article: ClanArticle }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = article.content.length > 200;
  const displayContent = expanded || !isLong
    ? article.content
    : article.content.slice(0, 200) + '...';

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-center mb-3">
          <Star className="h-5 w-5 text-amber-500" />
        </div>
        <h3 className="text-center font-semibold text-amber-800 mb-3">{article.title}</h3>
        <div className="text-sm text-amber-900/80 whitespace-pre-wrap leading-relaxed">
          {displayContent}
        </div>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-sm font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2 block mx-auto"
          >
            {expanded ? '↑ Thu gọn' : '↓ Đọc thêm'}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function ArticleList({ articles }: { articles: ClanArticle[] }) {
  const featured = articles.filter(a => a.is_featured);
  const regular = articles.filter(a => !a.is_featured);

  if (articles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ScrollText className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>Chưa có bài viết nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {featured.length > 0 && (
        <div className="space-y-4">
          {featured.map(a => (
            <FeaturedQuote key={a.id} article={a} />
          ))}
        </div>
      )}

      {regular.length > 0 && (
        <div className="divide-y">
          {regular.map((a, i) => (
            <ArticleCard key={a.id} article={a} index={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CharterPage() {
  const [activeTab, setActiveTab] = useState<ClanArticleCategory>('gioi_thieu');
  const { data: articles, isLoading } = useClanArticles(activeTab);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="h-6 w-6" />
          Hương ước Dòng họ
        </h1>
        <p className="text-muted-foreground">Gia huấn, quy ước và lời dặn dò từ tổ tiên</p>
      </div>

      <Separator />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ClanArticleCategory)}>
        <TabsList className="w-full">
          {TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
              <tab.icon className="h-4 w-4 mr-1" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (
                  <ArticleList articles={articles || []} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
