/**
 * @project AncestorTree
 * @file src/components/people/person-card.tsx
 * @description Card component displaying person information
 * @version 1.0.0
 * @updated 2026-02-24
 */

'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { type Person, getZodiacYear } from '@/types';
import { User, MapPin, Calendar } from 'lucide-react';
import { GENDER } from '@/lib/constants';

interface PersonCardProps {
  person: Person;
  showDetails?: boolean;
}

export function PersonCard({ person, showDetails = true }: PersonCardProps) {
  const initials = person.display_name
    .split(' ')
    .map((n) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const genderColor = person.gender === GENDER.MALE ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800';
  const statusColor = person.is_living ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';

  return (
    <Link href={`/people/${person.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={person.avatar_url} alt={person.display_name} />
              <AvatarFallback className={genderColor}>
                {initials || <User className="h-6 w-6" />}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">
                {person.display_name}
              </h3>
              
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <Badge variant="outline" className="text-xs">
                  Đời {person.generation}
                </Badge>
                {person.chi && (
                  <Badge variant="outline" className="text-xs">
                    Chi {person.chi}
                  </Badge>
                )}
                <Badge className={`text-xs ${statusColor}`}>
                  {person.is_living ? 'Còn sống' : 'Đã mất'}
                </Badge>
              </div>

              {showDetails && (
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {person.birth_year && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {person.birth_year}
                        {` (${getZodiacYear(person.birth_year)})`}
                        {person.death_year && ` - ${person.death_year}`}
                      </span>
                    </div>
                  )}
                  {person.hometown && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{person.hometown}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
