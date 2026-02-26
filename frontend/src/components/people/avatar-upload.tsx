/**
 * @project AncestorTree
 * @file src/components/people/avatar-upload.tsx
 * @description Avatar component with upload capability
 * @version 1.0.0
 * @updated 2026-02-25
 */

'use client';

import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, User } from 'lucide-react';
import { uploadFile } from '@/lib/supabase-storage';
import { useUpdatePerson } from '@/hooks/use-people';
import { toast } from 'sonner';
import type { Person } from '@/types';
import { GENDER } from '@/lib/constants';

interface AvatarUploadProps {
  person: Person;
  canEdit: boolean;
  size?: 'sm' | 'lg';
}

export function AvatarUpload({ person, canEdit, size = 'lg' }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const updateMutation = useUpdatePerson();

  const sizeClass = size === 'lg' ? 'h-24 w-24' : 'h-14 w-14';
  const iconSize = size === 'lg' ? 'h-10 w-10' : 'h-6 w-6';
  const textSize = size === 'lg' ? 'text-2xl' : 'text-base';

  const initials = person.display_name
    .split(' ')
    .map((n) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const genderColor = person.gender === GENDER.MALE ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800';

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFile(file, person.id);
      await updateMutation.mutateAsync({ id: person.id, input: { avatar_url: url } });
      toast.success('Đã cập nhật ảnh đại diện');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi tải ảnh lên');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative group">
      <Avatar className={sizeClass}>
        <AvatarImage src={person.avatar_url} alt={person.display_name} />
        <AvatarFallback className={`${genderColor} ${textSize}`}>
          {initials || <User className={iconSize} />}
        </AvatarFallback>
      </Avatar>

      {canEdit && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </button>
        </>
      )}
    </div>
  );
}
