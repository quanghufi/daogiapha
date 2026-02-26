'use client';

import { useState } from 'react';
import { useSearchPeople } from '@/hooks/use-people';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, X } from 'lucide-react';
import type { SearchPerson } from '@/types';
import { GENDER } from '@/lib/constants';

interface PersonComboboxProps {
  label: string;
  hint?: string;
  selected: SearchPerson | null;
  onSelect: (person: SearchPerson | null) => void;
  excludeId?: string;
}

export function PersonCombobox({ label, hint, selected, onSelect, excludeId }: PersonComboboxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { data: results, isFetching } = useSearchPeople(query);

  const filtered = (results || []).filter((p) => p.id !== excludeId);

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {selected ? (
        <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/50">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
              selected.gender === GENDER.MALE ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
            }`}
          >
            {selected.display_name.slice(-1)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selected.display_name}</p>
            <p className="text-xs text-muted-foreground">Đời {selected.generation}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => onSelect(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Tìm ${label.toLowerCase()}...`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(e.target.value.length > 0);
            }}
            onFocus={() => query.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            className="pl-9"
          />
          {open && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-52 overflow-y-auto">
              {isFetching ? (
                <p className="p-3 text-sm text-muted-foreground">Đang tìm...</p>
              ) : filtered.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">Không tìm thấy</p>
              ) : (
                filtered.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(person);
                      setQuery('');
                      setOpen(false);
                    }}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                        person.gender === GENDER.MALE ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                      }`}
                    >
                      {person.display_name.slice(-1)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{person.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Đời {person.generation}
                        {person.birth_year ? ` · ${person.birth_year}` : ''}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
