/**
 * @project AncestorTree
 * @file src/lib/book-generator.ts
 * @description Utility to structure family tree data for printable book view
 * @version 1.0.0
 * @updated 2026-02-25
 */

import type { FullTreeData } from './supabase-data';
import type { Person } from '@/types';
import { getZodiacYear } from '@/types';
import { PRIVACY } from '@/lib/constants';

export interface BookPerson {
  person: Person;
  father?: Person;
  mother?: Person;
  spouses: Person[];
  children: Person[];
  zodiacYear?: string;
}

export interface BookBranch {
  chi: number | null;
  people: BookPerson[];
}

export interface BookChapter {
  generation: number;
  title: string;
  branches: BookBranch[];
}

export function generateBookData(data: FullTreeData): BookChapter[] {
  const peopleMap = new Map<string, Person>();
  for (const p of data.people) {
    peopleMap.set(p.id, p);
  }

  // Build parent lookup: person_id -> { father, mother }
  const parentMap = new Map<string, { father?: Person; mother?: Person }>();
  const childrenByFamily = new Map<string, string[]>();

  for (const c of data.children) {
    const list = childrenByFamily.get(c.family_id) || [];
    list.push(c.person_id);
    childrenByFamily.set(c.family_id, list);
  }

  for (const family of data.families) {
    const childIds = childrenByFamily.get(family.id) || [];
    const father = family.father_id ? peopleMap.get(family.father_id) : undefined;
    const mother = family.mother_id ? peopleMap.get(family.mother_id) : undefined;
    for (const childId of childIds) {
      parentMap.set(childId, { father, mother });
    }
  }

  // Build spouse lookup: person_id -> spouse Person[] (supports remarriage)
  const spouseMap = new Map<string, Person[]>();
  for (const family of data.families) {
    if (family.father_id && family.mother_id) {
      const father = peopleMap.get(family.father_id);
      const mother = peopleMap.get(family.mother_id);
      if (father && mother) {
        const fatherSpouses = spouseMap.get(father.id) || [];
        fatherSpouses.push(mother);
        spouseMap.set(father.id, fatherSpouses);
        const motherSpouses = spouseMap.get(mother.id) || [];
        motherSpouses.push(father);
        spouseMap.set(mother.id, motherSpouses);
      }
    }
  }

  // Build children lookup: person_id -> children Person[]
  const childrenMap = new Map<string, Person[]>();
  for (const family of data.families) {
    const parentIds = [family.father_id, family.mother_id].filter(Boolean) as string[];
    const childIds = childrenByFamily.get(family.id) || [];
    const childPeople = childIds
      .map(id => peopleMap.get(id))
      .filter((p): p is Person => !!p)
      .sort((a, b) => (a.birth_year || 9999) - (b.birth_year || 9999));

    for (const pid of parentIds) {
      const existing = childrenMap.get(pid) || [];
      childrenMap.set(pid, [...existing, ...childPeople]);
    }
  }

  // Group people by generation
  const generationMap = new Map<number, Person[]>();
  for (const person of data.people) {
    if (person.privacy_level === PRIVACY.PRIVATE) continue; // Skip private
    const gen = person.generation;
    const list = generationMap.get(gen) || [];
    list.push(person);
    generationMap.set(gen, list);
  }

  // Build chapters sorted by generation
  const generations = Array.from(generationMap.keys()).sort((a, b) => a - b);
  const chapters: BookChapter[] = [];

  for (const gen of generations) {
    const people = generationMap.get(gen) || [];

    // Group by chi within generation
    const chiMap = new Map<number | null, Person[]>();
    for (const person of people) {
      const chi = person.chi ?? null;
      const list = chiMap.get(chi) || [];
      list.push(person);
      chiMap.set(chi, list);
    }

    const chiKeys = Array.from(chiMap.keys()).sort((a, b) => (a ?? 999) - (b ?? 999));
    const branches: BookBranch[] = chiKeys.map(chi => {
      const branchPeople = chiMap.get(chi) || [];
      branchPeople.sort((a, b) => (a.birth_year || 9999) - (b.birth_year || 9999));

      return {
        chi,
        people: branchPeople.map(person => ({
          person,
          father: parentMap.get(person.id)?.father,
          mother: parentMap.get(person.id)?.mother,
          spouses: spouseMap.get(person.id) || [],
          children: childrenMap.get(person.id) || [],
          zodiacYear: person.birth_year ? getZodiacYear(person.birth_year) : undefined,
        })),
      };
    });

    chapters.push({
      generation: gen,
      title: `Đời thứ ${gen}`,
      branches,
    });
  }

  return chapters;
}
