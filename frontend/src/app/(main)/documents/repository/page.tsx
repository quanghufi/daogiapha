/**
 * @project AncestorTree
 * @file src/app/(main)/documents/repository/page.tsx
 * @description Public document repository — browse by category (Sprint 8)
 * @version 1.0.0
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDocuments } from '@/hooks/use-documents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText, ArrowLeft, Download, Calendar, FolderOpen,
} from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { DocumentCategory, ClanDocument } from '@/types';
import { DOCUMENT_CATEGORY_LABELS } from '@/types';

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  gia_pha: 'bg-purple-100 text-purple-800',
  lich_su: 'bg-amber-100 text-amber-800',
  hinh_anh: 'bg-green-100 text-green-800',
  van_kien: 'bg-blue-100 text-blue-800',
  other: 'bg-gray-100 text-gray-800',
};

type FilterCategory = 'all' | DocumentCategory;

export default function DocumentRepositoryPage() {
  const [category, setCategory] = useState<FilterCategory>('all');
  const queryCategory = category === 'all' ? undefined : category;
  const { data: documents, isLoading } = useDocuments(queryCategory);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/documents">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tài liệu
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="h-6 w-6" />
            Kho tài liệu
          </h1>
          <p className="text-muted-foreground">Tài liệu, hình ảnh lịch sử và văn kiện gia tộc</p>
        </div>
      </div>

      {/* Category filter */}
      <Tabs value={category} onValueChange={(v) => setCategory(v as FilterCategory)}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          {(Object.entries(DOCUMENT_CATEGORY_LABELS) as [DocumentCategory, string][]).map(([key, label]) => (
            <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc: ClanDocument) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <CardTitle className="text-sm truncate">{doc.title}</CardTitle>
                  </div>
                  <Badge className={CATEGORY_COLORS[doc.category]} >
                    {DOCUMENT_CATEGORY_LABELS[doc.category]}
                  </Badge>
                </div>
                {doc.description && (
                  <CardDescription className="line-clamp-2">{doc.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(doc.created_at, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                  {doc.file_url && (
                    <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-3 w-3 mr-1" />
                        Tải xuống
                      </a>
                    </Button>
                  )}
                </div>
                {doc.file_type && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {doc.file_type.toUpperCase()}
                    {doc.file_size ? ` · ${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : ''}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Chưa có tài liệu nào</p>
          <p className="text-sm mt-1">
            {category !== 'all'
              ? `Không có tài liệu trong danh mục "${DOCUMENT_CATEGORY_LABELS[category as DocumentCategory]}"`
              : 'Quản trị viên sẽ tải lên tài liệu tại trang quản trị'}
          </p>
        </div>
      )}
    </div>
  );
}
