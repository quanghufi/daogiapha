/**
 * @project AncestorTree
 * @file src/components/tree/family-tree.tsx
 * @description Interactive family tree with gradient cards, multi-zoom, bus-line connections, generation headers
 * @version 3.0.0 - Demo-style redesign
 */

'use client';

import { useMemo, useState, useRef, useCallback, useEffect, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTreeData } from '@/hooks/use-families';
import { useClanSettings } from '@/hooks/use-clan-settings';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Move,
  Maximize2,
  Users,
  ArrowUpFromLine,
  ArrowDownFromLine,
  Search,
  X,
  GitBranch,
  ChevronsDownUp,
  ChevronsUpDown,
  Crosshair,
  Eye,
  EyeOff,
  Sparkles,
  UserX,
} from 'lucide-react';
import type { TreePerson } from '@/types';
import type { TreeData } from '@/lib/supabase-data';
import Link from 'next/link';
import { GENDER } from '@/lib/constants';
import { DEFAULT_CLAN_MOTTO, DEFAULT_CLAN_NAME } from '@/lib/clan-defaults';
import { TraditionalBorder, TraditionalHeader, TraditionalScroll, TraditionalFooter } from './traditional-header';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const CARD_W = 188;
const CARD_H = 82;
const LEVEL_HEIGHT = 146;
const FIRST_GENERATION_TOP_OFFSET = 96;
const SIBLING_GAP = 24;
const FAMILY_GAP = 84;
const COUPLE_GAP = 12;
const MINIMAP_WIDTH = 160;
const MINIMAP_HEIGHT = 100;
const AUTO_COLLAPSE_GEN = 8;

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

type ViewMode = 'all' | 'ancestors' | 'descendants';
type ZoomLevel = 'full' | 'compact' | 'mini';

function getZoomLevel(scale: number): ZoomLevel {
  if (scale > 0.55) return 'full';
  if (scale > 0.3) return 'compact';
  return 'mini';
}

interface TreeNodeData {
  person: TreePerson;
  x: number;
  y: number;
  isCollapsed: boolean;
  hasChildren: boolean;
  isVisible: boolean;
  spouseOrder?: number;
}

interface TreeConnectionData {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'parent-child' | 'couple' | 'family-link';
  isVisible: boolean;
}

interface BranchSummary {
  totalCount: number;
  livingCount: number;
  minGen: number;
  maxGen: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper: Get initials from name
// ═══════════════════════════════════════════════════════════════════════════

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase();
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper: Get card styles based on gender, patrilineal status, living status
// ═══════════════════════════════════════════════════════════════════════════

function getCardStyle(person: TreePerson) {
  const isMale = person.gender === GENDER.MALE;
  const isPatri = person.is_patrilineal !== false;
  const isLiving = person.is_living !== false;

  if (!isPatri) {
    return {
      card: `from-stone-50 to-stone-100 border-stone-300 border-dashed ${!isLiving ? 'opacity-70' : ''}`,
      avatar: 'bg-stone-200 text-stone-600',
      badge: 'bg-stone-100 text-stone-600 border-stone-200',
    };
  }
  if (isMale) {
    return {
      card: `${isLiving ? 'from-indigo-50 to-violet-50 border-indigo-300' : 'from-indigo-50/60 to-violet-50/60 border-indigo-200 opacity-80'}`,
      avatar: `${isLiving ? 'bg-indigo-400 text-white' : 'bg-indigo-300 text-white'}`,
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
  }
  return {
    card: `${isLiving ? 'from-rose-50 to-pink-50 border-rose-300' : 'from-rose-50/60 to-pink-50/60 border-rose-200 opacity-80'}`,
    avatar: `${isLiving ? 'bg-rose-400 text-white' : 'bg-rose-300 text-white'}`,
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  };
}


// ══════════════════
// Helper: Get generation-based background color (soft pastels for 14 gens)
// 

const GENERATION_COLORS: Record<number, { bg: string; border: string; badge: string; badgeText: string; text: string }> = {
  1:  { bg: '#d62828', border: '#991b1b', badge: '#991b1b', badgeText: '#fde68a', text: '#fff8db' },
  2:  { bg: '#e23d28', border: '#b91c1c', badge: '#b91c1c', badgeText: '#fde68a', text: '#fff8db' },
  3:  { bg: '#eb5a2a', border: '#c2410c', badge: '#c2410c', badgeText: '#fff7d1', text: '#fff8db' },
  4:  { bg: '#f08c2b', border: '#d97706', badge: '#d97706', badgeText: '#fff7d1', text: '#fffdf5' },
  5:  { bg: '#f7d86f', border: '#d4a017', badge: '#d4a017', badgeText: '#7c2d12', text: '#7c2d12' },
  6:  { bg: '#f3efcf', border: '#8aa0b2', badge: '#d6d3b0', badgeText: '#274472', text: '#274472' },
  7:  { bg: '#1fa85b', border: '#0f766e', badge: '#0f766e', badgeText: '#dcfce7', text: '#f0fdf4' },
  8:  { bg: '#159a56', border: '#0f766e', badge: '#0f766e', badgeText: '#dcfce7', text: '#f0fdf4' },
  9:  { bg: '#b9dfff', border: '#4f7aa5', badge: '#7ea7d3', badgeText: '#17325c', text: '#17325c' },
  10: { bg: '#abd5fb', border: '#456d9b', badge: '#78a7d8', badgeText: '#17325c', text: '#17325c' },
  11: { bg: '#9fcef7', border: '#3f6794', badge: '#6b99cb', badgeText: '#17325c', text: '#17325c' },
  12: { bg: '#93c4f3', border: '#365d8a', badge: '#648fbf', badgeText: '#17325c', text: '#17325c' },
  13: { bg: '#87bbee', border: '#315580', badge: '#5b84b2', badgeText: '#17325c', text: '#17325c' },
  14: { bg: '#7db1e7', border: '#2e4f78', badge: '#5379a5', badgeText: '#17325c', text: '#17325c' },
};

function getGenerationColor(generation: number | null | undefined) {
  const gen = generation ?? 1;
  const idx = ((gen - 1) % 14) + 1;
  return GENERATION_COLORS[idx] ?? GENERATION_COLORS[1];
}

// ═══════════════════════════════════════════════════════════════════════════
// PersonCard — 3 zoom levels
// ═══════════════════════════════════════════════════════════════════════════

interface PersonCardProps {
  node: TreeNodeData;
  zoomLevel: ZoomLevel;
  isSelected: boolean;
  onSelect: (person: TreePerson, nodeX: number, nodeY: number) => void;
  onToggleCollapse: (personId: string) => void;
  branchSummary?: BranchSummary;
}

const PersonCard = memo(function PersonCard({
  node,
  zoomLevel,
  isSelected,
  onSelect,
  onToggleCollapse,
  branchSummary,
}: PersonCardProps) {
  const { person, x, y, isCollapsed, hasChildren } = node;
  const genColor = getGenerationColor(person.generation);
  const selectedRing = isSelected ? 'ring-2 ring-[#b91c1c] ring-offset-2 ring-offset-[#fff6db]' : '';
  const spouseBadge = node.spouseOrder ? `Vợ ${node.spouseOrder}` : null;

  // Year/status display
  const birthYear = person.birth_year;
  const deathYear = person.death_year;
  const isLiving = person.is_living !== false;
  let yearText: string;
  if (birthYear && deathYear) {
    yearText = `${birthYear} - ${deathYear}`;
  } else if (birthYear && isLiving) {
    yearText = `${birthYear} - nay`;
  } else if (birthYear && !isLiving) {
    yearText = `${birthYear} - ?`;
  } else if (!birthYear && deathYear) {
    yearText = `? - ${deathYear}`;
  } else {
    yearText = isLiving ? 'Còn sống' : 'Đã mất';
  }

  if (zoomLevel === 'mini') {
    const dotColor = person.gender === GENDER.MALE
      ? (person.is_patrilineal !== false ? 'bg-indigo-400' : 'bg-stone-400')
      : (person.is_patrilineal !== false ? 'bg-rose-400' : 'bg-stone-400');
    return (
      <div
        className={`absolute w-3 h-3 rounded-full ${dotColor} cursor-pointer hover:scale-150 transition-transform ${!person.is_living ? 'opacity-60' : ''}`}
        style={{ left: x + CARD_W / 2 - 6, top: y + CARD_H / 2 - 6 }}
        onClick={() => onSelect(person, x, y)}
        title={`${person.display_name} — Đời ${person.generation}`}
      />
    );
  }

  if (zoomLevel === 'compact') {
    return (
      <div
        className={`absolute cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_14px_rgba(120,53,15,0.16)] ${selectedRing} ${person.is_patrilineal === false ? 'border-dashed' : ''}`}
        style={{
          left: x,
          top: y,
          width: CARD_W,
          height: 48,
          background: `linear-gradient(180deg, ${genColor.bg}, ${genColor.bg})`,
          border: `2px solid ${genColor.border}`,
          borderRadius: 10,
          boxShadow: 'inset 0 0 0 2px rgba(255, 244, 214, 0.42), 0 3px 10px rgba(120,53,15,0.08)',
          opacity: person.is_living === false ? 0.72 : 1,
        }}
        onClick={() => onSelect(person, x, y)}
      >
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-md border border-[#b45309] bg-[#fff1bf] px-2 py-[2px] text-[8px] font-black uppercase tracking-[0.08em] text-[#9a3412] shadow-sm">
          Đời {person.generation}
        </div>
        {spouseBadge && (
          <div className="absolute right-1.5 top-1 z-10 rounded-full border border-rose-200 bg-white/90 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-rose-700 shadow-sm">
            {spouseBadge}
          </div>
        )}
        <div className="flex h-full flex-col items-center justify-center px-2 pt-2">
          <span className="line-clamp-2 text-center text-[10px] font-black uppercase tracking-[0.03em]" style={{ color: genColor.text }}>{person.display_name}</span>
          <span className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.06em]" style={{ color: genColor.text, opacity: 0.86 }}>{yearText}</span>
        </div>
        {/* Collapse button */}
        {hasChildren && (
          <button
            className="absolute -bottom-2.5 left-1/2 z-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border bg-[#fff6db] shadow-sm hover:bg-[#fff1bf]"
            aria-label={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(person.id);
            }}
          >
            {isCollapsed ? <ChevronRight className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
          </button>
        )}
      </div>
    );
  }

  // Full zoom level
  return (
    <>
      <div
        className={`absolute cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_10px_18px_rgba(120,53,15,0.18)] ${selectedRing} ${person.is_patrilineal === false ? 'border-dashed' : ''}`}
        style={{
          left: x,
          top: y,
          width: CARD_W,
          height: CARD_H,
          background: `linear-gradient(180deg, ${genColor.bg}, ${genColor.bg})`,
          border: `2px solid ${genColor.border}`,
          borderRadius: 10,
          boxShadow: 'inset 0 0 0 2px rgba(255, 246, 219, 0.46), 0 6px 16px rgba(120,53,15,0.10)',
          opacity: person.is_living === false ? 0.72 : 1,
        }}
        onClick={() => onSelect(person, x, y)}
      >
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-md border border-[#b45309] bg-[#fff1bf] px-2.5 py-[3px] text-[8px] font-black uppercase tracking-[0.08em] text-[#9a3412] shadow-sm">
          Đời {person.generation}
        </div>
        {spouseBadge && (
          <div className="absolute right-2 top-2 z-10 rounded-full border border-[#fed7aa] bg-[#fff7db] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#9a3412] shadow-sm">
            {spouseBadge}
          </div>
        )}
        <div className="flex h-full flex-col items-center justify-center p-2 pt-3">
          <span className="line-clamp-2 text-center text-[12px] font-black uppercase leading-tight tracking-[0.03em]" style={{ color: genColor.text }}>
            {person.display_name}
          </span>
          <span className="mt-1 text-[8px] font-semibold uppercase tracking-[0.07em]" style={{ color: genColor.text, opacity: 0.9 }}>
            {yearText}
          </span>
        </div>

        {/* Collapse/Expand button */}
        {hasChildren && (
          <button
            className="absolute -bottom-3 left-1/2 z-10 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border bg-[#fff6db] shadow-sm transition-colors hover:bg-[#fff1bf]"
            aria-label={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(person.id);
            }}
          >
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>

      {/* Branch summary card when collapsed */}
      {isCollapsed && branchSummary && branchSummary.totalCount > 0 && (
        <div
          className="absolute bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 rounded-lg cursor-pointer hover:shadow-md transition-all"
          style={{
            left: x + CARD_W / 2 - 60,
            top: y + CARD_H + 24,
            width: 120,
            height: 40,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(person.id);
          }}
        >
          <div className="flex flex-col items-center justify-center h-full gap-0.5">
            <span className="text-[10px] font-medium text-amber-800">
              📦 {branchSummary.totalCount} người
            </span>
            <span className="text-[8px] text-amber-600">
              Đời {branchSummary.minGen}-{branchSummary.maxGen}
              {' · '}
              {branchSummary.livingCount} còn sống
            </span>
          </div>
        </div>
      )}
    </>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// NodeContextMenu — popup next to clicked node
// ═══════════════════════════════════════════════════════════════════════════

interface ContextMenuData {
  person: TreePerson;
  x: number;
  y: number;
}

interface NodeContextMenuProps {
  menu: ContextMenuData;
  onClose: () => void;
  onViewAncestors: (person: TreePerson) => void;
  onViewDescendants: (person: TreePerson) => void;
  onCenter: (x: number, y: number) => void;
}

const NodeContextMenu = memo(function NodeContextMenu({
  menu,
  onClose,
  onViewAncestors,
  onViewDescendants,
  onCenter,
}: NodeContextMenuProps) {
  const { person, x, y } = menu;
  const style = getCardStyle(person);
  const initials = getInitials(person.display_name);

  // Year/status display: "1945 - nay" or "1920 - 1995" or "Còn sống" or "Đã mất"
  const birthYear = person.birth_year;
  const deathYear = person.death_year;
  const isLiving = person.is_living !== false;
  let statusText: string;
  if (birthYear && deathYear) {
    statusText = `${birthYear} - ${deathYear}`;
  } else if (birthYear && isLiving) {
    statusText = `${birthYear} - nay`;
  } else if (birthYear && !isLiving) {
    statusText = `${birthYear} - ?`;
  } else if (!birthYear && deathYear) {
    statusText = `? - ${deathYear}`;
  } else {
    statusText = isLiving ? 'Còn sống' : 'Đã mất';
  }

  const menuItems = [
    {
      icon: <Eye className="h-3.5 w-3.5" />,
      label: 'Xem chi tiết',
      desc: 'Mở trang cá nhân',
      href: `/people/${person.id}`,
    },
    {
      icon: <ArrowDownFromLine className="h-3.5 w-3.5" />,
      label: 'Hậu duệ từ đây',
      desc: 'Hiển thị cây con cháu',
      onClick: () => { onViewDescendants(person); onClose(); },
    },
    {
      icon: <ArrowUpFromLine className="h-3.5 w-3.5" />,
      label: 'Tổ tiên',
      desc: 'Hiển thị dòng tổ tiên',
      onClick: () => { onViewAncestors(person); onClose(); },
    },
    {
      icon: <Crosshair className="h-3.5 w-3.5" />,
      label: 'Căn giữa',
      desc: 'Di chuyển tới vị trí',
      onClick: () => { onCenter(x + CARD_W / 2, y + CARD_H / 2); onClose(); },
    },
  ];

  return (
    <div
      className="absolute z-50"
      style={{ left: x + CARD_W + 8, top: y }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: -8 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: -8 }}
        transition={{ duration: 0.15 }}
        className="bg-background/95 backdrop-blur-sm border rounded-xl shadow-xl min-w-[200px] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 border-b bg-muted/30">
          <div className={`w-8 h-8 rounded-full ${style.avatar} flex items-center justify-center text-[10px] font-bold shrink-0`}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate">{person.display_name}</p>
            <p className="text-[10px] text-muted-foreground">
              Đời {person.generation} · {statusText}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Đóng"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Menu items */}
        <div className="py-1">
          {menuItems.map((item) => {
            const content = (
              <div className="flex items-center gap-2.5 group">
                <span className="text-muted-foreground group-hover:text-primary transition-colors">{item.icon}</span>
                <div>
                  <p className="text-xs font-medium">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            );
            return item.href ? (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className="block px-3 py-2 hover:bg-muted transition-colors group"
              >
                {content}
              </Link>
            ) : (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full px-3 py-2 hover:bg-muted transition-colors text-left group"
              >
                {content}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
});

interface ConnectionsLayerProps {
  connections: TreeConnectionData[];
  offsetX: number;
}

const ConnectionsLayer = memo(function ConnectionsLayer({ connections, offsetX }: ConnectionsLayerProps) {
  // Group parent-child connections by parent point to draw bus-lines
  const coupleLines: TreeConnectionData[] = [];
  const familyLinks: TreeConnectionData[] = [];
  const parentChildGroups = new Map<string, { parentX: number; parentY: number; children: { x: number; y: number }[] }>();

  for (const conn of connections) {
    if (conn.type === 'couple') {
      coupleLines.push(conn);
    } else if (conn.type === 'family-link') {
      familyLinks.push(conn);
    } else {
      const key = `${conn.x1},${conn.y1}`;
      if (!parentChildGroups.has(key)) {
        parentChildGroups.set(key, { parentX: conn.x1, parentY: conn.y1, children: [] });
      }
      parentChildGroups.get(key)!.children.push({ x: conn.x2, y: conn.y2 });
    }
  }

  const paths: string[] = [];

  // Bus-line connections
  for (const [, group] of parentChildGroups) {
    const { parentX, parentY, children: kids } = group;
    if (kids.length === 0) continue;

    if (kids.length === 1) {
      // Single child: orthogonal path (vertical down, horizontal, vertical down)
      const midY = parentY + (kids[0].y - parentY) * 0.45;
      if (Math.abs(parentX - kids[0].x) < 1) {
        // Directly aligned: simple vertical
        paths.push(`M ${parentX} ${parentY} L ${parentX} ${kids[0].y}`);
      } else {
        // Offset: L-shaped orthogonal
        paths.push(`M ${parentX} ${parentY} L ${parentX} ${midY} L ${kids[0].x} ${midY} L ${kids[0].x} ${kids[0].y}`);
      }
    } else {
      // Multiple children: stub down → horizontal bus → vertical drops
      const busY = parentY + (kids[0].y - parentY) * 0.45;
      const sortedKids = [...kids].sort((a, b) => a.x - b.x);
      const leftX = sortedKids[0].x;
      const rightX = sortedKids[sortedKids.length - 1].x;

      // Parent stub down to bus
      paths.push(`M ${parentX} ${parentY} L ${parentX} ${busY}`);
      // Horizontal bus
      paths.push(`M ${leftX} ${busY} L ${rightX} ${busY}`);
      // Vertical drops to each child
      for (const kid of sortedKids) {
        paths.push(`M ${kid.x} ${busY} L ${kid.x} ${kid.y}`);
      }
    }
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
    >
      <g transform={`translate(${offsetX}, 0)`}>
        {familyLinks.map((conn) => {
          // Orthogonal connection: vertical from couple midpoint down, then horizontal to children center
          const midY = conn.y1 + (conn.y2 - conn.y1) * 0.45;
          return (
            <path
              key={conn.id}
              d={`M ${conn.x1} ${conn.y1} L ${conn.x1} ${midY} L ${conn.x2} ${midY} L ${conn.x2} ${conn.y2}`}
              fill="none"
              stroke="#6b7f99"
              strokeWidth={2}
            />
          );
        })}

        {/* Parent-child bus lines */}
        {paths.map((d, i) => (
          <path key={`pc-${i}`} d={d} fill="none" stroke="#6b7f99" strokeWidth={2} />
        ))}

        {/* Couple lines (dashed) */}
        {coupleLines.map((conn) => (
          <g key={conn.id}>
            <line
              x1={conn.x1}
              y1={conn.y1}
              x2={conn.x2}
              y2={conn.y2}
              stroke="#94a3b8"
              strokeWidth={1.75}
              strokeDasharray="4,3"
            />
            {/* Heart icon in the middle */}
            <text
              x={(conn.x1 + conn.x2) / 2}
              y={conn.y1 - 4}
              textAnchor="middle"
              fontSize={8}
              fill="#b91c1c"
              className="select-none"
            >
              ❤
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// Generation Headers
// ═══════════════════════════════════════════════════════════════════════════

interface GenerationHeadersProps {
  nodes: TreeNodeData[];
  offsetX: number;
}

const GenerationHeaders = memo(function GenerationHeaders({ nodes }: GenerationHeadersProps) {
  const generations = useMemo(() => {
    const genMap = new Map<number, { y: number; count: number }>();
    for (const node of nodes) {
      const gen = node.person.generation || 1;
      const existing = genMap.get(gen);
      if (!existing || node.y < existing.y) {
        genMap.set(gen, {
          y: node.y,
          count: (existing?.count ?? 0) + 1,
        });
      } else {
        genMap.set(gen, { ...existing, count: existing.count + 1 });
      }
    }
    return Array.from(genMap.entries())
      .map(([gen, data]) => ({ gen, ...data }))
      .sort((a, b) => a.gen - b.gen);
  }, [nodes]);

  return (
    <div className="absolute left-0 top-0 bottom-0 pointer-events-none z-10" style={{ width: 92 }}>
      {generations.map(({ gen, y, count }) => (
        <div
          key={gen}
          className="absolute flex flex-col items-center justify-center"
          style={{ left: 12, top: y + 2, width: 72, height: CARD_H }}
        >
          <div className="rounded-md border-2 border-[#b45309] bg-[#fff6db]/95 px-2 py-1 text-center shadow-[0_4px_10px_rgba(120,53,15,0.12)]">
            <span className="block leading-none text-[8px] font-black uppercase tracking-[0.08em] text-[#9a3412]">Tầng đời</span>
            <span className="mt-0.5 block leading-none text-[11px] font-black uppercase text-[#9a3412]">Đời {gen}</span>
            <span className="mt-0.5 block leading-none text-[8px] font-semibold text-[#64748b]">{count} người</span>
          </div>
        </div>
      ))}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// Minimap Component
// ═══════════════════════════════════════════════════════════════════════════

interface MinimapProps {
  nodes: TreeNodeData[];
  viewBox: { x: number; y: number; width: number; height: number };
  treeWidth: number;
  treeHeight: number;
  onViewportClick: (x: number, y: number) => void;
}

const Minimap = memo(function Minimap({ nodes, viewBox, treeWidth, treeHeight, onViewportClick }: MinimapProps) {
  const scaleX = MINIMAP_WIDTH / treeWidth;
  const scaleY = MINIMAP_HEIGHT / treeHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    onViewportClick(x, y);
  };

  const visibleNodes = nodes.filter(n => n.isVisible);

  return (
    <div
      className="absolute bottom-4 right-4 z-[15] overflow-hidden rounded-xl shadow-xl"
      style={{
        border: '2px solid #b45309',
        boxShadow: '0 8px 20px rgba(120,53,15,0.25), 0 0 0 1px #facc15',
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-2.5 py-1"
        style={{
          background: 'linear-gradient(180deg, #b91c1c, #991b1b)',
          borderBottom: '1px solid #facc15',
        }}
      >
        <span
          className="text-[10px] font-bold tracking-[0.18em] text-[#fde68a]"
          style={{ fontFamily: '"Noto Serif", serif' }}
        >
          Tree Overview
        </span>
      </div>
      <svg
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        className="cursor-pointer block"
        style={{ background: 'rgba(255, 247, 219, 0.95)' }}
        onClick={handleClick}
      >
        <g transform={`scale(${scale})`}>
          {visibleNodes.map((node) => {
            const gen = Math.min((node.person.generation || 1) - 1, 13);
            const genColors = [
              '#8b1a1a','#a62626','#c43e1e','#d4691e',
              '#b8860b','#8b7d3c','#3d7a3d','#2e8b6e',
              '#1e7a7a','#1e5a8b','#2a4a8b','#2e3a7a',
              '#1a2a5c','#0f1a3d',
            ];
            return (
              <rect
                key={node.person.id}
                x={node.x + CARD_W / 2 - 2 / scale}
                y={node.y + CARD_H / 2 - 1.5 / scale}
                width={4 / scale}
                height={3 / scale}
                fill={genColors[gen] || '#666'}
              />
            );
          })}
          <rect
            x={viewBox.x}
            y={viewBox.y}
            width={viewBox.width}
            height={viewBox.height}
            fill="rgba(197, 148, 42, 0.08)"
            stroke="#c5942a"
            strokeWidth={2 / scale}
          />
        </g>
      </svg>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// Legend Bar
// ═══════════════════════════════════════════════════════════════════════════

function LegendBar({ hideNgoaiToc }: { hideNgoaiToc?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t-2 border-[#d97706]/35 bg-[#fff6db]/92 px-3 py-2 text-[10px] text-[#7c2d12] backdrop-blur-sm">
      <div className="flex items-center gap-1">
        <div className="h-3 w-3 rounded-full bg-[#315580]" />
        <span>Nam</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="h-3 w-3 rounded-full bg-[#b91c1c]" />
        <span>Nữ</span>
      </div>
      {!hideNgoaiToc && (
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded border border-dashed border-stone-500 bg-stone-100" />
          <span>Ngoại tộc</span>
        </div>
      )}
      {!hideNgoaiToc && (
        <div className="flex items-center gap-1">
          <div className="w-6 border-t border-dashed border-slate-500" />
          <span className="text-[8px] text-[#b91c1c]">❤</span>
          <span>Vợ chồng</span>
        </div>
      )}
      <div className="flex items-center gap-1">
        <span className="text-[#315580]">●</span>
        <span>Còn sống</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-amber-700">☸</span>
        <span>Đã mất</span>
      </div>
      <div className="ml-auto hidden text-[9px] font-semibold uppercase tracking-[0.08em] text-[#9a3412] md:block">
        Phong cách phả hệ truyền thống
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tree Layout Builder — Hierarchical (Bottom-up subtree sizing)
// ═══════════════════════════════════════════════════════════════════════════

export function buildTreeLayout(
  data: TreeData,
  collapsedNodes: Set<string>,
  viewMode: ViewMode,
  focusPersonId: string | null,
  filterRootId: string | null = null,
  hideNgoaiToc: boolean = false
) {
  const { people, families, children } = data;

  // Build relationship maps
  const fatherToFamilies = new Map<string, typeof families>();
  const motherToFamilies = new Map<string, typeof families>();
  const childToFamily = new Map<string, (typeof families)[0]>();

  for (const family of families) {
    if (family.father_id) {
      if (!fatherToFamilies.has(family.father_id)) fatherToFamilies.set(family.father_id, []);
      fatherToFamilies.get(family.father_id)!.push(family);
    }
    if (family.mother_id) {
      if (!motherToFamilies.has(family.mother_id)) motherToFamilies.set(family.mother_id, []);
      motherToFamilies.get(family.mother_id)!.push(family);
    }
  }
  for (const child of children) {
    if (!childToFamily.has(child.person_id)) {
      const fam = families.find((f) => f.id === child.family_id);
      if (fam) childToFamily.set(child.person_id, fam);
    }
  }

  for (const familyList of fatherToFamilies.values()) {
    familyList.sort((a, b) => a.sort_order - b.sort_order);
  }
  for (const familyList of motherToFamilies.values()) {
    familyList.sort((a, b) => a.sort_order - b.sort_order);
  }

  // Visible people selection
  const getVisiblePeopleIds = (): Set<string> => {
    const visible = new Set<string>();

    if (filterRootId) {
      const addWithDescendants = (personId: string) => {
        if (visible.has(personId)) return;
        visible.add(personId);
        const fams = [
          ...(fatherToFamilies.get(personId) || []),
          ...(motherToFamilies.get(personId) || []),
        ];
        for (const fam of fams) {
          if (fam.father_id && fam.father_id !== personId) visible.add(fam.father_id);
          if (fam.mother_id && fam.mother_id !== personId) visible.add(fam.mother_id);
          children
            .filter((c) => c.family_id === fam.id)
            .forEach((c) => addWithDescendants(c.person_id));
        }
      };
      addWithDescendants(filterRootId);
      return visible;
    }

    if (viewMode === 'all') {
      people.forEach((p) => visible.add(p.id));
      const hideDescendants = (personId: string) => {
        const fams = fatherToFamilies.get(personId) || [];
        for (const fam of fams) {
          children
            .filter((c) => c.family_id === fam.id)
            .forEach((c) => {
              visible.delete(c.person_id);
              hideDescendants(c.person_id);
            });
        }
      };
      collapsedNodes.forEach((nodeId) => hideDescendants(nodeId));
    } else if (viewMode === 'ancestors' && focusPersonId) {
      const addAncestors = (personId: string) => {
        visible.add(personId);
        const fam = childToFamily.get(personId);
        if (fam?.father_id) addAncestors(fam.father_id);
        if (fam?.mother_id) addAncestors(fam.mother_id);
      };
      addAncestors(focusPersonId);
    } else if (viewMode === 'descendants' && focusPersonId) {
      const addDescendants = (personId: string) => {
        if (visible.has(personId)) return;
        visible.add(personId);
        const fams = [
          ...(fatherToFamilies.get(personId) || []),
          ...(motherToFamilies.get(personId) || []),
        ];
        for (const fam of fams) {
          if (fam.father_id && fam.father_id !== personId) visible.add(fam.father_id);
          if (fam.mother_id && fam.mother_id !== personId) visible.add(fam.mother_id);
          children.filter((c) => c.family_id === fam.id).forEach((c) => addDescendants(c.person_id));
        }
      };
      addDescendants(focusPersonId);
    } else {
      people.forEach((p) => visible.add(p.id));
    }

    return visible;
  };

  const visibleIds = getVisiblePeopleIds();
  // When hideNgoaiToc is enabled, remove all non-patrilineal members from the tree
  if (hideNgoaiToc) {
    for (const p of people) {
      if (p.is_patrilineal === false) visibleIds.delete(p.id);
    }
  }
  const visiblePeople = people.filter((p) => visibleIds.has(p.id));

  if (visiblePeople.length === 0) {
    return { nodes: [], connections: [], width: 0, height: 0, offsetX: 0 };
  }

  const visibleChildIdsByFamily = new Map<string, string[]>();
  for (const family of families) {
    const childIds = children
      .filter((c) => c.family_id === family.id && visibleIds.has(c.person_id))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => c.person_id);
    visibleChildIdsByFamily.set(family.id, childIds);
  }

  const spouseOrderById = new Map<string, number>();
  for (const [fatherId, fatherFamilies] of fatherToFamilies) {
    const visibleSpouseFamilies = fatherFamilies.filter(
      (family) => family.father_id === fatherId && family.mother_id && visibleIds.has(family.mother_id)
    );
    if (visibleSpouseFamilies.length <= 1) continue;
    visibleSpouseFamilies.forEach((family, index) => {
      if (family.mother_id) spouseOrderById.set(family.mother_id, index + 1);
    });
  }

  // Helpers
  const getVisibleFamilyGroupsAsFather = (personId: string) => {
    const fams = fatherToFamilies.get(personId) || [];
    return fams
      .filter((fam) => {
        const hasVisibleSpouse = !!fam.mother_id && visibleIds.has(fam.mother_id);
        const hasVisibleChildren = (visibleChildIdsByFamily.get(fam.id) || []).length > 0;
        return hasVisibleSpouse || hasVisibleChildren || !fam.mother_id;
      })
      .map((family) => ({
        family,
        spouseId: family.mother_id && visibleIds.has(family.mother_id) ? family.mother_id : null,
        childIds: visibleChildIdsByFamily.get(family.id) || [],
      }));
  };

  const getPositionedFamilyGroupsAsFather = (personId: string) => {
    const groups = getVisibleFamilyGroupsAsFather(personId);
    if (groups.length <= 1) {
      return groups.map((group) => ({ ...group, slot: 1 }));
    }

    return groups
      .map((group, index) => {
        const distance = Math.floor(index / 2) + 1;
        const slot = index % 2 === 0 ? -distance : distance;
        return { ...group, slot };
      })
      .sort((a, b) => a.slot - b.slot);
  };

  const getVisibleChildrenAsFather = (personId: string): string[] => {
    const familiesWithChildren = getPositionedFamilyGroupsAsFather(personId);
    const result: string[] = [];
    for (const { childIds } of familiesWithChildren) {
      childIds.forEach((childId) => {
        if (!result.includes(childId)) result.push(childId);
      });
    }
    return result;
  };

  const getVisibleWives = (personId: string): string[] => {
    const fams = getPositionedFamilyGroupsAsFather(personId);
    const result: string[] = [];
    for (const fam of fams) {
      if (fam.spouseId && !result.includes(fam.spouseId)) {
        result.push(fam.spouseId);
      }
    }
    return result;
  };

  // Wives will be positioned adjacent to husband — mark them
  const positionedAsWife = new Set<string>();
  for (const p of visiblePeople) {
    if (p.gender === GENDER.FEMALE) {
      const fams = motherToFamilies.get(p.id) || [];
      if (fams.some((f) => f.father_id && visibleIds.has(f.father_id))) {
        positionedAsWife.add(p.id);
      }
    }
  }

  // Root nodes: not a wife, and no visible father
  const roots: string[] = [];
  for (const p of visiblePeople) {
    if (positionedAsWife.has(p.id)) continue;
    const parentFam = childToFamily.get(p.id);
    if (!parentFam?.father_id || !visibleIds.has(parentFam.father_id)) {
      roots.push(p.id);
    }
  }

  // Bottom-up: subtree widths
  const subtreeWidths = new Map<string, number>();
  const computeSubtreeWidth = (personId: string): number => {
    if (subtreeWidths.has(personId)) return subtreeWidths.get(personId)!;
    const familyGroupsWithSlots = getPositionedFamilyGroupsAsFather(personId);
    const wives = familyGroupsWithSlots.filter(({ spouseId }) => spouseId !== null);
    const familyGroups = collapsedNodes.has(personId)
      ? []
      : familyGroupsWithSlots.filter(({ childIds }) => childIds.length > 0);
    const spouseRowWidth = wives.length > 1
      ? CARD_W + Math.max(...wives.map(({ slot }) => Math.abs(slot)), 0) * 2 * (COUPLE_GAP + CARD_W)
      : CARD_W + wives.length * (COUPLE_GAP + CARD_W);
    const childrenWidth = familyGroups.length > 0
      ? familyGroups.reduce((sum, group, index) => {
          const groupWidth =
            group.childIds.reduce((groupSum, childId) => groupSum + computeSubtreeWidth(childId), 0) +
            (group.childIds.length - 1) * SIBLING_GAP;
          return sum + groupWidth + (index > 0 ? FAMILY_GAP : 0);
        }, 0)
      : 0;
    const result = Math.max(spouseRowWidth, childrenWidth);
    subtreeWidths.set(personId, result);
    return result;
  };
  for (const root of roots) computeSubtreeWidth(root);

  // Top-down: assign X positions
  const xPositions = new Map<string, number>();
  const familyCenterById = new Map<string, number>();
  const assignPositions = (personId: string, startX: number) => {
    const sw = subtreeWidths.get(personId) || CARD_W;
    const familyGroupsWithSlots = getPositionedFamilyGroupsAsFather(personId);
    const wives = familyGroupsWithSlots.filter(({ spouseId }) => spouseId !== null);
    const familyChildren = collapsedNodes.has(personId)
      ? []
      : familyGroupsWithSlots.filter(({ childIds }) => childIds.length > 0);
    const hasMultipleSpouses = wives.length > 1;
    const spouseRowWidth = hasMultipleSpouses
      ? CARD_W + Math.max(...wives.map(({ slot }) => Math.abs(slot)), 0) * 2 * (CARD_W + COUPLE_GAP)
      : CARD_W + wives.length * (CARD_W + COUPLE_GAP);
    const centerX = startX + sw / 2;

    // Single spouse keeps the classic left-right layout. Multiple spouses use a centered hub layout.
    const fatherX = hasMultipleSpouses ? centerX - CARD_W / 2 : centerX - spouseRowWidth / 2;
    xPositions.set(personId, fatherX);
    wives.forEach(({ spouseId, slot }) => {
      if (!spouseId) return;
      if (hasMultipleSpouses) {
        xPositions.set(spouseId, fatherX + slot * (CARD_W + COUPLE_GAP));
      } else {
        xPositions.set(spouseId, fatherX + (CARD_W + COUPLE_GAP));
      }
    });

    // Children stay grouped by the visual spouse order so each branch reads as one family unit.
    if (familyChildren.length > 0) {
      const totalChildW = familyChildren.reduce((sum, group, index) => {
        const groupWidth =
          group.childIds.reduce((groupSum, childId) => groupSum + (subtreeWidths.get(childId) || CARD_W), 0) +
          (group.childIds.length - 1) * SIBLING_GAP;
        return sum + groupWidth + (index > 0 ? FAMILY_GAP : 0);
      }, 0);
      let childX = centerX - totalChildW / 2;
      familyChildren.forEach(({ family, childIds }, groupIndex) => {
        const groupWidth =
          childIds.reduce((groupSum, childId) => groupSum + (subtreeWidths.get(childId) || CARD_W), 0) +
          (childIds.length - 1) * SIBLING_GAP;
        familyCenterById.set(family.id, childX + groupWidth / 2);

        childIds.forEach((child, childIndex) => {
          assignPositions(child, childX);
          childX += (subtreeWidths.get(child) || CARD_W);
          if (childIndex < childIds.length - 1) childX += SIBLING_GAP;
        });
        if (groupIndex < familyChildren.length - 1) childX += FAMILY_GAP;
      });
    }
  };

  let rootStartX = 0;
  for (const root of roots) {
    assignPositions(root, rootStartX);
    rootStartX += (subtreeWidths.get(root) || CARD_W) + SIBLING_GAP * 2;
  }

  // Keep generation lanes anchored to the clan's first generation,
  // so Đời 1 always stays right below the temple header.
  const rootGeneration = Math.min(...people.map((p) => p.generation || 1));
  const nodes: TreeNodeData[] = [];
  for (const person of visiblePeople) {
    if (!xPositions.has(person.id)) continue;
    const personGeneration = person.generation || rootGeneration;
    nodes.push({
      person,
      x: xPositions.get(person.id)!,
      y: (personGeneration - rootGeneration) * LEVEL_HEIGHT + FIRST_GENERATION_TOP_OFFSET,
      isCollapsed: collapsedNodes.has(person.id),
      hasChildren: getVisibleChildrenAsFather(person.id).length > 0,
      isVisible: true,
      spouseOrder: spouseOrderById.get(person.id),
    });
  }

  // Build connections
  const connections: TreeConnectionData[] = [];
  const personPos = new Map(nodes.map((n) => [n.person.id, { x: n.x, y: n.y }]));

  for (const family of families) {
    const fatherPos = family.father_id ? personPos.get(family.father_id) : null;
    const motherPos = family.mother_id ? personPos.get(family.mother_id) : null;
    if (!fatherPos && !motherPos) continue;

    const fatherCenterX = fatherPos ? fatherPos.x + CARD_W / 2 : null;
    const motherCenterX = motherPos ? motherPos.x + CARD_W / 2 : null;
    const coupleMidX =
      fatherCenterX !== null && motherCenterX !== null
        ? (fatherCenterX + motherCenterX) / 2
        : (fatherCenterX ?? motherCenterX ?? 0);

    // Couple line (horizontal, between nodes)
    if (fatherPos && motherPos) {
      const fatherToRight = fatherPos.x < motherPos.x;
      connections.push({
        id: `couple-${family.id}`,
        x1: fatherToRight ? fatherPos.x + CARD_W : fatherPos.x,
        y1: fatherPos.y + CARD_H / 2,
        x2: fatherToRight ? motherPos.x : motherPos.x + CARD_W,
        y2: motherPos.y + CARD_H / 2,
        type: 'couple',
        isVisible: true,
      });
    }

    const parentIsCollapsed =
      (family.father_id && collapsedNodes.has(family.father_id)) ||
      (!family.father_id && family.mother_id && collapsedNodes.has(family.mother_id));
    if (parentIsCollapsed) continue;

    const parentPos = fatherPos ?? motherPos!;

    // Always use couple midpoint as the connection origin
    // This ensures straight vertical lines from parent couple down to children
    children.filter((c) => c.family_id === family.id).forEach((child) => {
      const childPos = personPos.get(child.person_id);
      if (childPos) {
        connections.push({
          id: `child-${family.id}-${child.person_id}`,
          x1: coupleMidX,
          y1: parentPos.y + CARD_H,
          x2: childPos.x + CARD_W / 2,
          y2: childPos.y,
          type: 'parent-child',
          isVisible: true,
        });
      }
    });
  }

  // Bounds
  let minX = Infinity, maxX = -Infinity, maxY = 0;
  let firstGenerationMinX = Infinity, firstGenerationMaxX = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x + CARD_W);
    maxY = Math.max(maxY, n.y + CARD_H);
    const generation = n.person.generation || rootGeneration;
    if (generation === rootGeneration) {
      firstGenerationMinX = Math.min(firstGenerationMinX, n.x);
      firstGenerationMaxX = Math.max(firstGenerationMaxX, n.x + CARD_W);
    }
  }
  if (!isFinite(minX)) { minX = 0; maxX = 0; }

  // Align the first generation lane to the horizontal center axis of the tree.
  let firstGenerationCenterOffset = 0;
  if (isFinite(firstGenerationMinX) && isFinite(firstGenerationMaxX)) {
    const firstGenerationCenterX = (firstGenerationMinX + firstGenerationMaxX) / 2;
    const treeCenterX = (minX + maxX) / 2;
    firstGenerationCenterOffset = treeCenterX - firstGenerationCenterX;
  }

  return {
    nodes,
    connections,
    width: Math.max(800, maxX - minX + 240),
    height: maxY + 120, // Bottom breathing room
    offsetX: -minX + 120 + firstGenerationCenterOffset, // Space + first-generation centering
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Branch Summary Helper
// ═══════════════════════════════════════════════════════════════════════════

function computeBranchSummary(
  personId: string,
  data: TreeData,
  fatherToFamilies: Map<string, TreeData['families']>,
  childrenData: TreeData['children'],
  peopleMap: Map<string, TreePerson>
): BranchSummary {
  let total = 0, living = 0, minGen = Infinity, maxGen = -Infinity;
  const visited = new Set<string>();

  function walk(pid: string) {
    if (visited.has(pid)) return;
    visited.add(pid);
    const person = peopleMap.get(pid);
    if (!person) return;
    total++;
    if (person.is_living !== false) living++;
    const gen = person.generation || 1;
    if (gen < minGen) minGen = gen;
    if (gen > maxGen) maxGen = gen;

    const fams = fatherToFamilies.get(pid) || [];
    for (const fam of fams) {
      childrenData
        .filter((c) => c.family_id === fam.id)
        .forEach((c) => walk(c.person_id));
    }
  }

  // Walk children (not including the person itself)
  const fams = fatherToFamilies.get(personId) || [];
  for (const fam of fams) {
    childrenData
      .filter((c) => c.family_id === fam.id)
      .forEach((c) => walk(c.person_id));
  }

  return { totalCount: total, livingCount: living, minGen: isFinite(minGen) ? minGen : 0, maxGen: isFinite(maxGen) ? maxGen : 0 };
}

function computeAutoCollapsedNodes(data: TreeData | null | undefined): Set<string> {
  if (!data || data.people.length === 0) return new Set();

  const maxGen = Math.max(...data.people.map((p) => p.generation || 1));
  if (maxGen <= AUTO_COLLAPSE_GEN) return new Set();

  const fatherToFamilies = new Map<string, TreeData['families']>();
  for (const family of data.families) {
    if (!family.father_id) continue;
    if (!fatherToFamilies.has(family.father_id)) {
      fatherToFamilies.set(family.father_id, []);
    }
    fatherToFamilies.get(family.father_id)!.push(family);
  }

  const toCollapse = new Set<string>();
  for (const person of data.people) {
    const generation = person.generation || 1;
    if (generation < AUTO_COLLAPSE_GEN) continue;
    const families = fatherToFamilies.get(person.id) || [];
    const hasChildren = families.some((family) => data.children.some((child) => child.family_id === family.id));
    if (hasChildren) toCollapse.add(person.id);
  }

  return toCollapse;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Family Tree Component
// ═══════════════════════════════════════════════════════════════════════════

export function FamilyTree() {
  const { data, isLoading, error } = useTreeData();
  const { data: clanSettings } = useClanSettings();
  const clanName = clanSettings?.clan_name?.trim() || DEFAULT_CLAN_NAME;
  const clanMotto = clanSettings?.clan_motto?.trim() || DEFAULT_CLAN_MOTTO;
  const rootAncestorName = useMemo(() => {
    if (!data?.people?.length) return undefined;

    const minGeneration = Math.min(...data.people.map((person) => person.generation || 1));
    const rootCandidates = data.people
      .filter((person) => (person.generation || 1) === minGeneration)
      .sort((left, right) => {
        const leftYear = left.birth_year ?? Number.MAX_SAFE_INTEGER;
        const rightYear = right.birth_year ?? Number.MAX_SAFE_INTEGER;
        if (leftYear !== rightYear) return leftYear - rightYear;
        return left.display_name.localeCompare(right.display_name, 'vi');
      });

    const rootPerson = rootCandidates[0];
    return rootPerson ? `Cụ: ${rootPerson.display_name}` : undefined;
  }, [data]);

  // State
  const [scale, setScale] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 0.6 : 0.9
  );
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedPerson, setSelectedPerson] = useState<TreePerson | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string> | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [hideNgoaiToc, setHideNgoaiToc] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [showDecorations, setShowDecorations] = useState(true);
  const [filterRootId, setFilterRootId] = useState<string | null>(() =>
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('root')
      : null
  );
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  const autoCollapsedNodes = useMemo(() => computeAutoCollapsedNodes(data), [data]);
  const activeCollapsedNodes = collapsedNodes ?? autoCollapsedNodes;

  const handleSetFilterRoot = useCallback((person: TreePerson | null) => {
    setFilterRootId(person?.id ?? null);
    setFilterSearch('');
    setFilterDropdownOpen(false);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (person) params.set('root', person.id);
      else params.delete('root');
      window.history.replaceState(null, '', params.toString() ? `?${params.toString()}` : window.location.pathname);
    }
  }, []);

  const filterRootPerson = filterRootId
    ? data?.people.find((p) => p.id === filterRootId) ?? null
    : null;

  // Track container size via ResizeObserver with proper cleanup
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    setContainerSize({ width: node.clientWidth, height: node.clientHeight });
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Layout — focusPersonId only matters for ancestors/descendants view modes
  const focusPersonId = viewMode !== 'all' ? selectedPerson?.id || null : null;
  const layout = useMemo(() => {
    if (!data || data.people.length === 0) return null;
    return buildTreeLayout(data, activeCollapsedNodes, viewMode, focusPersonId, filterRootId, hideNgoaiToc);
  }, [data, activeCollapsedNodes, viewMode, focusPersonId, filterRootId, hideNgoaiToc]);

  const firstGenerationCenterX = useMemo(() => {
    if (!layout || layout.nodes.length === 0) return null;
    const firstGeneration = Math.min(...layout.nodes.map((node) => node.person.generation || 1));
    const firstGenerationNodes = layout.nodes.filter(
      (node) => (node.person.generation || 1) === firstGeneration
    );
    if (firstGenerationNodes.length === 0) return null;
    const minX = Math.min(...firstGenerationNodes.map((node) => node.x));
    const maxX = Math.max(...firstGenerationNodes.map((node) => node.x + CARD_W));
    return (minX + maxX) / 2 + layout.offsetX;
  }, [layout]);

  // Keep first generation centered under the temple header.
  const autoAlignPanX = useMemo(() => {
    if (firstGenerationCenterX == null || containerSize.width <= 0) return 0;
    return containerSize.width / 2 - firstGenerationCenterX * scale;
  }, [firstGenerationCenterX, containerSize.width, scale]);

  const effectivePanX = pan.x + autoAlignPanX;

  // Zoom level
  const zoomLevel = useMemo<ZoomLevel>(() => getZoomLevel(scale), [scale]);

  // Branch summaries for collapsed nodes
  const branchSummaries = useMemo(() => {
    if (!data || activeCollapsedNodes.size === 0) return new Map<string, BranchSummary>();
    const fatherToFams = new Map<string, typeof data.families>();
    for (const fam of data.families) {
      if (fam.father_id) {
        if (!fatherToFams.has(fam.father_id)) fatherToFams.set(fam.father_id, []);
        fatherToFams.get(fam.father_id)!.push(fam);
      }
    }
    const pMap = new Map(data.people.map(p => [p.id, p]));
    const map = new Map<string, BranchSummary>();
    for (const nodeId of activeCollapsedNodes) {
      map.set(nodeId, computeBranchSummary(nodeId, data, fatherToFams, data.children, pMap));
    }
    return map;
  }, [data, activeCollapsedNodes]);

  // Handlers
  const handleZoomIn = useCallback(() => setScale((s) => Math.min(s + 0.1, 2)), []);
  const handleZoomOut = useCallback(() => setScale((s) => Math.max(s - 0.1, 0.2)), []);
  const handleReset = useCallback(() => {
    setScale(0.9);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleNodeSelect = useCallback((person: TreePerson, nodeX: number, nodeY: number) => {
    setSelectedPerson(person);
    setContextMenu({ person, x: nodeX, y: nodeY });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleCenterOnNode = useCallback((nodeX: number, nodeY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPan({
      x: rect.width / 2 - nodeX * scale - autoAlignPanX,
      y: rect.height / 2 - nodeY * scale,
    });
  }, [scale, autoAlignPanX]);

  const handleToggleCollapse = useCallback((personId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev ?? autoCollapsedNodes);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  }, [autoCollapsedNodes]);

  const expandAll = useCallback(() => setCollapsedNodes(new Set()), []);
  const collapseAll = useCallback(() => {
    if (!data) return;
    const ftf = new Map<string, typeof data.families>();
    for (const fam of data.families) {
      if (fam.father_id) {
        if (!ftf.has(fam.father_id)) ftf.set(fam.father_id, []);
        ftf.get(fam.father_id)!.push(fam);
      }
    }
    const allParents = new Set<string>();
    for (const p of data.people) {
      const fams = ftf.get(p.id) || [];
      if (fams.some(f => data.children.some(c => c.family_id === f.id))) {
        allParents.add(p.id);
      }
    }
    setCollapsedNodes(allParents);
  }, [data]);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - effectivePanX, y: e.clientY - pan.y });
      setContextMenu(null);
    }
  }, [effectivePanX, pan.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart.x, panStart.y]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      setPanStart({
        x: e.touches[0].clientX - effectivePanX,
        y: e.touches[0].clientY - pan.y,
      });
      setContextMenu(null);
    }
  }, [effectivePanX, pan.y]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isPanning && e.touches.length === 1) {
      setPan({
        x: e.touches[0].clientX - panStart.x,
        y: e.touches[0].clientY - panStart.y,
      });
    }
  }, [isPanning, panStart.x, panStart.y]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Wheel zoom — must use non-passive listener to allow preventDefault
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setScale((s) => Math.max(0.2, Math.min(2, s + delta)));
      setContextMenu(null);
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  // Minimap viewport click
  const handleMinimapClick = useCallback((x: number, y: number) => {
    if (!containerRef.current || !layout) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPan({
      x: -(x - rect.width / 2 / scale) - autoAlignPanX,
      y: -(y - rect.height / 2 / scale),
    });
  }, [layout, scale, autoAlignPanX]);

  // View mode change
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    if (mode !== 'all' && !selectedPerson && data?.people.length) {
      setSelectedPerson(data.people[0]);
    }
  }, [selectedPerson, data]);

  // Computed viewBox for minimap
  const viewBox = useMemo(() => ({
    x: -effectivePanX / scale,
    y: -pan.y / scale,
    width: containerSize.width / scale,
    height: containerSize.height / scale,
  }), [effectivePanX, pan.y, scale, containerSize.width, containerSize.height]);

  const filterSearchResults = useMemo(() => {
    if (!data?.people || filterSearch.length < 2) return [];
    const query = filterSearch.toLowerCase();
    return data.people.filter((p) => p.display_name.toLowerCase().includes(query)).slice(0, 10);
  }, [data, filterSearch]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-64 w-96" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-12 text-center">
          <p className="text-destructive">Lỗi khi tải dữ liệu: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!layout || layout.nodes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>Chưa có dữ liệu để hiển thị cây gia phả</p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/people/new">Thêm thành viên đầu tiên</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Branch filter */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/40 rounded-lg border border-dashed">
        <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium shrink-0">Xem nhánh từ:</span>

        {filterRootPerson ? (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-md px-3 py-1">
            <span className="text-sm font-medium">{filterRootPerson.display_name}</span>
            <span className="text-xs text-muted-foreground">Đời {filterRootPerson.generation}</span>
            <button
              onClick={() => handleSetFilterRoot(null)}
              className="ml-1 text-muted-foreground hover:text-foreground"
              aria-label="Xóa bộ lọc nhánh"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm thành viên..."
                value={filterSearch}
                onChange={(e) => {
                  setFilterSearch(e.target.value);
                  setFilterDropdownOpen(e.target.value.length >= 2);
                }}
                onFocus={() => filterSearch.length >= 2 && setFilterDropdownOpen(true)}
                onBlur={() => setTimeout(() => setFilterDropdownOpen(false), 200)}
                className="pl-8 pr-3 py-1 text-sm border rounded-md bg-background w-48 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {filterDropdownOpen && filterSearchResults.length > 0 && (
              <div className="absolute z-50 top-full mt-1 bg-background border rounded-md shadow-lg w-64 max-h-48 overflow-y-auto">
                {filterSearchResults.map((person) => {
                  const s = getCardStyle(person);
                  return (
                    <button
                      key={person.id}
                      onMouseDown={() => handleSetFilterRoot(person)}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${s.avatar}`}>
                        {getInitials(person.display_name).charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{person.display_name}</p>
                        <p className="text-[10px] text-muted-foreground">Đời {person.generation}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {filterRootPerson && (
          <span className="text-xs text-muted-foreground ml-auto">
            Nhánh {filterRootPerson.display_name} · Đời {filterRootPerson.generation}
          </span>
        )}
        {!filterRootPerson && (
          <span className="text-xs text-muted-foreground ml-auto">Đang xem: Toàn bộ gia phả</span>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#d97706]/25 bg-[#fff6db]/65 px-2 py-2 shadow-[0_4px_10px_rgba(120,53,15,0.05)]">
        {/* Zoom controls */}
        <div className="flex items-center gap-1 rounded-lg border border-[#d97706]/30 bg-white/55 p-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut} aria-label="Thu nhỏ">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn} aria-label="Phóng to">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset} aria-label="Đặt lại">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Expand/Collapse all */}
        <div className="flex items-center gap-1 rounded-lg border border-[#d97706]/30 bg-white/55 p-1">
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={expandAll}>
            <ChevronsUpDown className="h-3.5 w-3.5 mr-1" />
            Mở
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={collapseAll}>
            <ChevronsDownUp className="h-3.5 w-3.5 mr-1" />
            Gọn
          </Button>
        </div>

        {/* View mode buttons */}
        <div className="flex items-center gap-1 rounded-lg border border-[#d97706]/30 bg-white/55 p-1">
          <Button
            variant={viewMode === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => handleViewModeChange('all')}
          >
            <Users className="h-3.5 w-3.5 mr-1" />
            Tất cả
          </Button>
          <Button
            variant={viewMode === 'ancestors' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => handleViewModeChange('ancestors')}
          >
            <ArrowUpFromLine className="h-3.5 w-3.5 mr-1" />
            Tổ tiên
          </Button>
          <Button
            variant={viewMode === 'descendants' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => handleViewModeChange('descendants')}
          >
            <ArrowDownFromLine className="h-3.5 w-3.5 mr-1" />
            Hậu duệ
          </Button>
        </div>

        {/* Toggle minimap */}
        <Button
          variant={showMinimap ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setShowMinimap(!showMinimap)}
          className="hidden md:flex h-8"
        >
          <Maximize2 className="h-3.5 w-3.5 mr-1" />
          Minimap
        </Button>
        <Button
          variant={hideNgoaiToc ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setHideNgoaiToc(!hideNgoaiToc)}
          className="h-8"
          title={hideNgoaiToc ? 'Hiện ngoại tộc' : 'Ẩn ngoại tộc'}
        >
          {hideNgoaiToc ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <UserX className="h-3.5 w-3.5 mr-1" />}
          Ngoại tộc
        </Button>
        <Button
          variant={showDecorations ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setShowDecorations(!showDecorations)}
          className="h-8"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1" />
          Trang trí
        </Button>

        {/* Instructions */}
        <div className="ml-auto flex items-center gap-1 text-xs text-[#7c2d12]/70">
          <Move className="h-3 w-3" />
          <span className="hidden sm:inline">Cuộn để zoom · Kéo để di chuyển · Nhấn để xem chi tiết</span>
        </div>
      </div>

      {/* View mode info */}
      {viewMode !== 'all' && selectedPerson && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm">
            {viewMode === 'ancestors' ? 'Tổ tiên của' : 'Hậu duệ của'}: <strong>{selectedPerson.display_name}</strong>
          </span>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setViewMode('all')}>
            Xem tất cả
          </Button>
        </div>
      )}

      {/* Tree container */}
      <TraditionalBorder>
        <div
          className={`relative overflow-hidden rounded-[24px] bg-[#f8dc52] ${
            showDecorations ? 'h-[76vh] min-h-[680px]' : 'h-[78vh] min-h-[640px]'
          }`}
          style={{
            backgroundImage: 'url(/tree-assets/bg-pattern.png)',
            backgroundRepeat: 'repeat',
            backgroundSize: '360px 360px',
          }}
        >
          <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(180deg,rgba(255,239,131,0.96),rgba(250,222,86,0.94),rgba(252,235,128,0.96))]" />
          <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.14]" style={{ backgroundImage: 'url(/tree-assets/temple-header.png)', backgroundSize: '680px auto', backgroundPosition: 'center 140px', backgroundRepeat: 'no-repeat' }} />
          <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_top,rgba(255,249,196,0.58),transparent_38%),radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_42%)]" />

          {/* Fixed Traditional Overlays */}
          {showDecorations && (
            <>
              <div className="absolute inset-x-0 top-0 h-[170px] z-[1] pointer-events-none">
                <TraditionalHeader familyName={clanName} subtitle={clanMotto} ancestorName={rootAncestorName} />
              </div>
              <TraditionalScroll text="Phúc Đức Tổ Tiên" side="left" />
              <TraditionalScroll text="Con Cháu Thảo Hiền" side="right" />
              <div className="absolute inset-x-0 bottom-7 h-[56px] z-[1] pointer-events-none opacity-85">
                <TraditionalFooter />
              </div>
              <div className="absolute left-8 right-8 top-[170px] z-[2] border-t-2 border-[#b45309]/35 pointer-events-none" />
            </>
          )}

          <div
            className={`absolute rounded-lg overflow-hidden ${
              showDecorations
                ? 'left-2 right-2 top-[172px] bottom-6 md:left-3 md:right-3 lg:left-[92px] lg:right-[92px]'
                : 'left-2 right-2 top-2 bottom-8 md:left-3 md:right-3 md:top-3 md:bottom-9'
            }`}
          >
            <div
              ref={containerRef}
              className="relative z-[5] h-full w-full overflow-hidden rounded-xl border border-[#d97706]/35 bg-[#fff6db]/18 select-none"
              style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Generation headers */}
              <GenerationHeaders nodes={layout.nodes} offsetX={layout.offsetX} />

              {/* Transformed content */}
              <div
                style={{
                  transform: `translate(${effectivePanX}px, ${pan.y}px) scale(${scale})`,
                  transformOrigin: '0 0',
                  position: 'relative',
                  width: layout.width + layout.offsetX,
                  height: layout.height,
                }}
              >
                {/* Connections SVG layer */}
                <ConnectionsLayer connections={layout.connections} offsetX={layout.offsetX} />

                {/* Person cards */}
                <div style={{ position: 'relative', transform: `translateX(${layout.offsetX}px)` }}>
                  {layout.nodes.map((node) => (
                    <PersonCard
                      key={node.person.id}
                      node={node}
                      zoomLevel={zoomLevel}
                      isSelected={selectedPerson?.id === node.person.id}
                      onSelect={handleNodeSelect}
                      onToggleCollapse={handleToggleCollapse}
                      branchSummary={branchSummaries.get(node.person.id)}
                    />
                  ))}

                  {/* Context menu popup */}
                  <AnimatePresence>
                    {contextMenu && (
                      <NodeContextMenu
                        menu={contextMenu}
                        onClose={handleCloseContextMenu}
                        onViewAncestors={(person) => {
                          setSelectedPerson(person);
                          handleViewModeChange('ancestors');
                        }}
                        onViewDescendants={(person) => {
                          setSelectedPerson(person);
                          handleViewModeChange('descendants');
                        }}
                        onCenter={handleCenterOnNode}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Minimap */}
              {showMinimap && layout.nodes.length > 3 && (
                <Minimap
                  nodes={layout.nodes}
                  viewBox={viewBox}
                  treeWidth={layout.width}
                  treeHeight={layout.height}
                  onViewportClick={handleMinimapClick}
                />
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="absolute left-2 right-2 bottom-1 z-[6]">
            <LegendBar hideNgoaiToc={hideNgoaiToc} />
          </div>
        </div>
      </TraditionalBorder>
    </div>
  );
}
