/**
 * @project AncestorTree
 * @file src/app/(main)/admin/documents/page.tsx
 * @description Admin document management — upload, edit, archive, delete (Sprint 8)
 * @version 1.0.0
 */

'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useAllDocuments, useCreateDocument, useUpdateDocument, useArchiveDocument, useDeleteDocument } from '@/hooks/use-documents';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft, Plus, FileText, Loader2, Pencil, Archive, Trash2, Upload, FolderOpen,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';
import type { DocumentCategory, ClanDocument, CreateClanDocumentInput } from '@/types';
import { DOCUMENT_CATEGORY_LABELS } from '@/types';
import { MAX_DOCUMENT_UPLOAD_SIZE_BYTES, ALLOWED_DOCUMENT_TYPES } from '@/lib/constants';

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  gia_pha: 'bg-purple-100 text-purple-800',
  lich_su: 'bg-amber-100 text-amber-800',
  hinh_anh: 'bg-green-100 text-green-800',
  van_kien: 'bg-blue-100 text-blue-800',
  other: 'bg-gray-100 text-gray-800',
};

type FilterCategory = 'all' | DocumentCategory;

export default function AdminDocumentsPage() {
  const { profile } = useAuth();
  const [category, setCategory] = useState<FilterCategory>('all');
  const queryCategory = category === 'all' ? undefined : category;
  const { data: documents, isLoading } = useAllDocuments(queryCategory);

  const createDoc = useCreateDocument();
  const updateDoc = useUpdateDocument();
  const archiveDoc = useArchiveDocument();
  const deleteDoc = useDeleteDocument();

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [docCategory, setDocCategory] = useState<DocumentCategory>('other');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit dialog
  const [editDoc, setEditDoc] = useState<ClanDocument | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<DocumentCategory>('other');

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<ClanDocument | null>(null);

  const resetUploadForm = () => {
    setTitle('');
    setDescription('');
    setDocCategory('other');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!title.trim() || !selectedFile || !profile) return;

    // Client-side validation
    if (selectedFile.size > MAX_DOCUMENT_UPLOAD_SIZE_BYTES) {
      toast.error(`File quá lớn. Tối đa ${MAX_DOCUMENT_UPLOAD_SIZE_BYTES / 1024 / 1024}MB.`);
      return;
    }
    if (!ALLOWED_DOCUMENT_TYPES.includes(selectedFile.type)) {
      toast.error('Định dạng không hỗ trợ. Chấp nhận: PDF, JPEG, PNG, WebP, GIF.');
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to Supabase storage
      const ext = selectedFile.name.split('.').pop() || 'bin';
      const path = `documents/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: selectedFile.type,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);

      const input: CreateClanDocumentInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        category: docCategory,
        file_url: urlData.publicUrl,
        file_type: selectedFile.type || ext,
        file_size: selectedFile.size,
        uploaded_by: profile.user_id,
      };

      await createDoc.mutateAsync(input);
      toast.success('Đã tải lên tài liệu thành công');
      setUploadOpen(false);
      resetUploadForm();
    } catch (err: unknown) {
      console.error('[DocumentUpload] Upload failed:', err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Lỗi khi tải lên';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = async () => {
    if (!editDoc || !editTitle.trim()) return;
    try {
      await updateDoc.mutateAsync({
        id: editDoc.id,
        input: {
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
          category: editCategory,
        },
      });
      toast.success('Đã cập nhật tài liệu');
      setEditDoc(null);
    } catch {
      toast.error('Lỗi khi cập nhật');
    }
  };

  const handleArchive = async (doc: ClanDocument) => {
    try {
      await archiveDoc.mutateAsync(doc.id);
      toast.success(`Đã lưu trữ "${doc.title}"`);
    } catch {
      toast.error('Lỗi khi lưu trữ');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc.mutateAsync(deleteTarget.id);
      toast.success(`Đã xóa "${deleteTarget.title}"`);
      setDeleteTarget(null);
    } catch {
      toast.error('Lỗi khi xóa');
    }
  };

  const openEdit = (doc: ClanDocument) => {
    setEditDoc(doc);
    setEditTitle(doc.title);
    setEditDescription(doc.description || '');
    setEditCategory(doc.category);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quản trị
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FolderOpen className="h-6 w-6" />
              Quản lý tài liệu
            </h1>
            <p className="text-muted-foreground">Tải lên, sửa, lưu trữ và xóa tài liệu</p>
          </div>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Tải lên tài liệu
        </Button>
      </div>

      {/* Filter */}
      <Tabs value={category} onValueChange={(v) => setCategory(v as FilterCategory)}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          {(Object.entries(DOCUMENT_CATEGORY_LABELS) as [DocumentCategory, string][]).map(([key, label]) => (
            <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Danh sách tài liệu
          </CardTitle>
          <CardDescription>
            {isLoading ? 'Đang tải...' : `${documents?.length || 0} tài liệu`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : documents && documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên tài liệu</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead className="hidden md:table-cell">Loại file</TableHead>
                  <TableHead className="hidden md:table-cell">Trạng thái</TableHead>
                  <TableHead className="hidden sm:table-cell">Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id} className={!doc.is_active ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="font-medium truncate">{doc.title}</p>
                        {doc.description && (
                          <p className="text-xs text-muted-foreground truncate">{doc.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={CATEGORY_COLORS[doc.category]}>
                        {DOCUMENT_CATEGORY_LABELS[doc.category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {doc.file_type?.split('/').pop()?.toUpperCase() || '—'}
                        {doc.file_size ? ` · ${(doc.file_size / 1024 / 1024).toFixed(1)}MB` : ''}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {doc.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Đang hiển thị</Badge>
                      ) : (
                        <Badge variant="secondary">Đã lưu trữ</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {formatDate(doc.created_at, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => openEdit(doc)} title="Sửa">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {doc.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-orange-600 hover:text-orange-700"
                            onClick={() => handleArchive(doc)}
                            disabled={archiveDoc.isPending}
                            title="Lưu trữ"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(doc)}
                          title="Xóa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Chưa có tài liệu nào</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={(open) => { if (!open) { setUploadOpen(false); resetUploadForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Tải lên tài liệu mới
            </DialogTitle>
            <DialogDescription>Chọn file và điền thông tin mô tả</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="doc-title">Tên tài liệu *</Label>
              <Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tên tài liệu" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-desc">Mô tả</Label>
              <Textarea id="doc-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả ngắn về tài liệu" rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Danh mục</Label>
              <Select value={docCategory} onValueChange={(v) => setDocCategory(v as DocumentCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(DOCUMENT_CATEGORY_LABELS) as [DocumentCategory, string][]).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chọn file *</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Chọn file
                </Button>
                {selectedFile && (
                  <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadOpen(false); resetUploadForm(); }} disabled={isUploading}>
              Hủy
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || !title.trim() || !selectedFile}>
              {isUploading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang tải lên...</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Tải lên</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editDoc && (
        <Dialog open={!!editDoc} onOpenChange={(open) => { if (!open) setEditDoc(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Sửa tài liệu
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Tên tài liệu</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select value={editCategory} onValueChange={(v) => setEditCategory(v as DocumentCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(DOCUMENT_CATEGORY_LABELS) as [DocumentCategory, string][]).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDoc(null)} disabled={updateDoc.isPending}>Hủy</Button>
              <Button onClick={handleEdit} disabled={updateDoc.isPending || !editTitle.trim()}>
                {updateDoc.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang lưu...</>
                ) : (
                  'Lưu thay đổi'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa tài liệu</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa tài liệu <strong>{deleteTarget?.title}</strong>? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteDoc.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang xóa...</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" /> Xóa vĩnh viễn</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
