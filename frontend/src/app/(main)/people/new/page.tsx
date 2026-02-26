/**
 * @project AncestorTree
 * @file src/app/(main)/people/new/page.tsx
 * @description New person creation page with parent selection
 * @version 2.0.0
 * @updated 2026-02-25
 */

'use client';

import { useState } from 'react';
import { useCreatePerson } from '@/hooks/use-people';
import { useAddPersonToParentFamily } from '@/hooks/use-families';
import { PersonForm } from '@/components/people/person-form';
import { PersonCombobox } from '@/components/shared/person-combobox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { PersonFormData } from '@/lib/validations/person';
import type { SearchPerson } from '@/types';

// ─── NewPersonPage ────────────────────────────────────────────────────────────

export default function NewPersonPage() {
  const router = useRouter();
  const createMutation = useCreatePerson();
  const addToParentMutation = useAddPersonToParentFamily();

  const [selectedFather, setSelectedFather] = useState<SearchPerson | null>(null);
  const [selectedMother, setSelectedMother] = useState<SearchPerson | null>(null);

  // Derived: locked generation from parent (father takes priority, fall back to mother)
  const lockedGeneration = selectedFather
    ? selectedFather.generation + 1
    : selectedMother
      ? selectedMother.generation + 1
      : undefined;

  const handleSubmit = async (data: PersonFormData) => {
    try {
      const person = await createMutation.mutateAsync(data);

      // Link to parent family if father or mother was selected
      if (selectedFather || selectedMother) {
        await addToParentMutation.mutateAsync({
          fatherId: selectedFather?.id || null,
          motherId: selectedMother?.id || null,
          childPersonId: person.id,
        });
      }

      toast.success('Đã thêm thành công');
      router.push(`/people/${person.id}`);
    } catch {
      toast.error('Lỗi khi thêm mới');
    }
  };

  const isLoading = createMutation.isPending || addToParentMutation.isPending;

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/people">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Thêm thành viên mới</h1>
      </div>

      {/* Parent selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Thuộc gia đình (tùy chọn)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Chọn cha/mẹ để xác định vị trí trong gia phả. Đời sẽ tự động = đời cha + 1.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PersonCombobox
            label="Cha"
            selected={selectedFather}
            onSelect={setSelectedFather}
            excludeId={selectedMother?.id}
          />
          <PersonCombobox
            label="Mẹ"
            selected={selectedMother}
            onSelect={setSelectedMother}
            excludeId={selectedFather?.id}
          />
        </CardContent>
      </Card>

      <PersonForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        lockedGeneration={lockedGeneration}
      />
    </div>
  );
}
