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

const CARD_W = 180;
const CARD_H = 80;
const LEVEL_HEIGHT = 140;
const FIRST_GENERATION_TOP_OFFSET = 96;
const SIBLING_GAP = 24;
const FAMILY_GAP = 72;
const ROOT_GAP = 144;
const COUPLE_GAP = 12;
const COLLAPSED_SUMMARY_GAP = 24;
const COLLAPSED_SUMMARY_H = 40;
const GENERATION_VERTICAL_PADDING = 24;
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
  1: { bg: '#cc0000', border: '#ffd700', badge: '#b30000', badgeText: '#ffd700', text: '#ffd700' },  // Đời 1: nền đỏ, chữ vàng
  2: { bg: '#cc0000', border: '#e6c200', badge: '#b30000', badgeText: '#ffe066', text: '#ffe066' },  // Đời 2: nền đỏ, chữ hơi vàng
  3: { bg: '#cc0000', border: '#ff4444', badge: '#b30000', badgeText: '#fff', text: '#ffffff' },     // Đời 3: nền đỏ, chữ trắng
  4: { bg: '#e06050', border: '#f08070', badge: '#d05040', badgeText: '#fff', text: '#ffffff' },     // Đời 4: nền đỏ nhạt, chữ trắng
  5: { bg: '#e07020', border: '#f09030', badge: '#d06010', badgeText: '#fff', text: '#ffffff' },     // Đời 5: nền cam, chữ trắng
  6: { bg: '#fff8dc', border: '#1a5276', badge: '#1a5276', badgeText: '#fff', text: '#1a3a6a' },     // Đời 6: nền trắng vàng, chữ xanh dương đậm
  7: { bg: '#1a7a3a', border: '#25a050', badge: '#15602e', badgeText: '#fff', text: '#ffffff' },     // Đời 7: nền xanh lá đậm, chữ trắng
  8: { bg: '#b0d4f1', border: '#1a5276', badge: '#1a5276', badgeText: '#fff', text: '#1a3a6a' },     // Đời 8: nền xanh dương nhạt, chữ xanh dương đậm
  9: { bg: '#2070b0', border: '#3090d0', badge: '#185a90', badgeText: '#fff', text: '#ffffff' },     // Đời 9: nền xanh dương, chữ trắng
  10: { bg: '#185a90', border: '#2070b0', badge: '#144a78', badgeText: '#fff', text: '#ffffff' },     // Đời 10: xanh dương đậm
  11: { bg: '#144a78', border: '#185a90', badge: '#103c62', badgeText: '#fff', text: '#ffffff' },     // Đời 11
  12: { bg: '#103c62', border: '#144a78', badge: '#0c2e4c', badgeText: '#fff', text: '#ffffff' },     // Đời 12
  13: { bg: '#0c2e4c', border: '#103c62', badge: '#082236', badgeText: '#fff', text: '#ffffff' },     // Đời 13
  14: { bg: '#082236', border: '#0c2e4c', badge: '#041620', badgeText: '#fff', text: '#ffffff' },     // Đời 14
};

// Branch view colors: distinct per relative generation (Đỏ → Cam → Vàng → Xanh lá → Xanh dương)
const BRANCH_GENERATION_COLORS: Record<number, { bg: string; border: string; badge: string; badgeText: string; text: string }> = {
  1: { bg: '#cc0000', border: '#a00000', badge: '#b30000', badgeText: '#ffd700', text: '#ffd700' },  // Đời gốc: Đỏ đậm, chữ vàng
  2: { bg: '#e87020', border: '#c85a10', badge: '#d06010', badgeText: '#fff', text: '#ffffff' },     // Đời 2: Cam
  3: { bg: '#d4a800', border: '#b89000', badge: '#c09000', badgeText: '#fff', text: '#1a1a00' },     // Đời 3: Vàng đậm, chữ tối
  4: { bg: '#1a8a3a', border: '#15702e', badge: '#15602e', badgeText: '#fff', text: '#ffffff' },     // Đời 4: Xanh lá
  5: { bg: '#2070b0', border: '#185a90', badge: '#185a90', badgeText: '#fff', text: '#ffffff' },     // Đời 5: Xanh dương
  6: { bg: '#6a5acd', border: '#5a4abd', badge: '#4a3aad', badgeText: '#fff', text: '#ffffff' },     // Đời 6: Tím
  7: { bg: '#cc0000', border: '#a00000', badge: '#b30000', badgeText: '#ffd700', text: '#ffd700' },  // Đời 7: Đỏ (lặp lại)
  8: { bg: '#e87020', border: '#c85a10', badge: '#d06010', badgeText: '#fff', text: '#ffffff' },     // Đời 8: Cam
  9: { bg: '#d4a800', border: '#b89000', badge: '#c09000', badgeText: '#fff', text: '#1a1a00' },     // Đời 9: Vàng
  10: { bg: '#1a8a3a', border: '#15702e', badge: '#15602e', badgeText: '#fff', text: '#ffffff' },     // Đời 10: Xanh lá
  11: { bg: '#2070b0', border: '#185a90', badge: '#185a90', badgeText: '#fff', text: '#ffffff' },     // Đời 11: Xanh dương
  12: { bg: '#6a5acd', border: '#5a4abd', badge: '#4a3aad', badgeText: '#fff', text: '#ffffff' },     // Đời 12: Tím
  13: { bg: '#cc0000', border: '#a00000', badge: '#b30000', badgeText: '#ffd700', text: '#ffd700' },  // Đời 13: Đỏ
  14: { bg: '#e87020', border: '#c85a10', badge: '#d06010', badgeText: '#fff', text: '#ffffff' },     // Đời 14: Cam
};

function getGenerationColor(generation: number | null | undefined, isBranch: boolean = false) {
  const gen = generation ?? 1;
  const idx = ((gen - 1) % 14) + 1;
  if (isBranch) {
    return BRANCH_GENERATION_COLORS[idx] ?? BRANCH_GENERATION_COLORS[1];
  }
  return GENERATION_COLORS[idx] ?? GENERATION_COLORS[1];
}

// Helper: Get card scale based on generation (gen 1-3 are larger)
function getGenScale(generation: number | null | undefined): number {
  const gen = generation ?? 1;
  if (gen === 1) return 1.4;
  if (gen === 2) return 1.25;
  if (gen === 3) return 1.1;
  return 1;
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
  customSize?: { w: number; h: number };
  onResize?: (personId: string, w: number, h: number) => void;
  treeScale?: number;
  /** Offset to compute relative generation for color/scale (rootPerson.generation - 1 when viewing branch, 0 otherwise) */
  generationOffset?: number;
}

const PersonCard = memo(function PersonCard({
  node,
  zoomLevel,
  isSelected,
  onSelect,
  onToggleCollapse,
  branchSummary,
  customSize,
  onResize,
  treeScale = 1,
  generationOffset = 0,
}: PersonCardProps) {
  const { person, x, y, isCollapsed, hasChildren } = node;
  const style = getCardStyle(person);
  // Use relative generation for color/scale when viewing a branch
  const isBranch = generationOffset > 0;
  const relativeGeneration = Math.max(1, (person.generation ?? 1) - generationOffset);
  const genColor = getGenerationColor(relativeGeneration, isBranch);
  const initials = getInitials(person.display_name);
  const selectedRing = isSelected ? 'ring-2 ring-primary ring-offset-2' : '';
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
        className={`absolute rounded-lg border-[1.5px] cursor-pointer hover:shadow-md transition-all ${selectedRing} ${person.is_patrilineal === false ? 'border-dashed' : ''}`}
        style={{ left: x, top: y, width: CARD_W, height: 40, background: genColor.bg, borderColor: genColor.border, opacity: person.is_living === false ? 0.7 : 1, overflow: 'visible', transform: `scale(${getGenScale(relativeGeneration)})`, transformOrigin: 'center top', zIndex: relativeGeneration <= 3 ? 10 - relativeGeneration : 0 }}
        onClick={() => onSelect(person, x, y)}
      >
        {spouseBadge && (
          <div className="absolute right-1.5 top-1 z-10 rounded-full border border-rose-200 bg-white/90 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-rose-700 shadow-sm">
            {spouseBadge}
          </div>
        )}
        <div className="flex items-center justify-center px-1.5 h-full overflow-visible">
          <span className="text-[10px] font-bold text-center" style={{ color: genColor.text, lineHeight: 1.5, overflow: 'visible' }}>{person.display_name}</span>
        </div>
        {/* Collapse button */}
        {hasChildren && (
          <button
            className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 z-10"
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
  const cardW = customSize?.w ?? CARD_W;
  const cardH = customSize?.h ?? CARD_H;
  const fontScale = Math.min(cardW / CARD_W, cardH / CARD_H);
  const fontSize = Math.max(9, Math.min(18, 11 * fontScale));
  const genFontSize = Math.max(7, Math.min(14, 8 * fontScale));

  // Resize handler
  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!onResize) return;
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startW = cardW;
    const startH = cardH;

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const curX = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
      const curY = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
      const newW = Math.max(100, startW + (curX - startX) / treeScale);
      const newH = Math.max(40, startH + (curY - startY) / treeScale);
      onResize(person.id, Math.round(newW), Math.round(newH));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  }, [onResize, cardW, cardH, person.id, treeScale]);

  return (
    <>
      <div
        className={`absolute rounded-xl border-[2px] cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all ${selectedRing} ${person.is_patrilineal === false ? 'border-dashed' : ''} group`}
        style={{ left: x, top: y, width: cardW, height: cardH, background: genColor.bg, borderColor: genColor.border, opacity: person.is_living === false ? 0.7 : 1, overflow: 'visible', transformOrigin: 'center top', zIndex: relativeGeneration <= 3 ? 10 - relativeGeneration : 0 }}
        onClick={() => onSelect(person, x, y)}
      >
        {spouseBadge && (
          <div className="absolute right-2 top-2 z-10 rounded-full border border-rose-200 bg-white/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-rose-700 shadow-sm">
            {spouseBadge}
          </div>
        )}
        <div className="flex flex-col items-center justify-center p-1.5 h-full gap-0.5 overflow-visible">
          <span className="font-bold text-center" style={{ fontSize: `${fontSize}px`, color: genColor.text, lineHeight: 1.4, overflow: 'visible', display: '-webkit-box', WebkitLineClamp: cardH > 100 ? 4 : 2, WebkitBoxOrient: 'vertical' as const }}>
            {person.display_name}
          </span>
        </div>

        {/* Resize handle - bottom right corner */}
        {onResize && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity z-20"
            style={{ borderRight: `3px solid ${genColor.text}`, borderBottom: `3px solid ${genColor.text}`, borderRadius: '0 0 6px 0', opacity: undefined }}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            title="Kéo để thay đổi kích thước"
          />
        )}

        {/* Collapse/Expand button */}
        {hasChildren && (
          <button
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-10"
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
            top: y + CARD_H + COLLAPSED_SUMMARY_GAP,
            width: 120,
            height: COLLAPSED_SUMMARY_H,
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
              stroke="#94a3b8"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Parent-child bus lines */}
        {paths.map((d, i) => (
          <path key={`pc-${i}`} d={d} fill="none" stroke="#94a3b8" strokeWidth={1.5} />
        ))}

        {/* Couple lines (dashed) */}
        {coupleLines.map((conn) => (
          <g key={conn.id}>
            <line
              x1={conn.x1}
              y1={conn.y1}
              x2={conn.x2}
              y2={conn.y2}
              stroke="#cbd5e1"
              strokeWidth={1.5}
              strokeDasharray="4,3"
            />
            {/* Heart icon in the middle */}
            <text
              x={(conn.x1 + conn.x2) / 2}
              y={conn.y1 - 4}
              textAnchor="middle"
              fontSize={8}
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
    <div className="absolute left-0 top-0 bottom-0 pointer-events-none z-10" style={{ width: 56 }}>
      {generations.map(({ gen, y, count }) => (
        <div
          key={gen}
          className="absolute flex flex-col items-center justify-center"
          style={{ left: 4, top: y, width: 48, height: CARD_H }}
        >
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg px-2 py-1 text-center shadow-sm">
            <span className="text-[10px] font-semibold text-slate-600 block leading-none">Đời {gen}</span>
            <span className="text-[8px] text-slate-400 block leading-none mt-0.5">{count} người</span>
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
    <div className="absolute bottom-4 right-4 bg-white/90 border rounded-lg p-2 shadow-lg">
      <svg
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        className="cursor-pointer"
        onClick={handleClick}
      >
        <g transform={`scale(${scale})`}>
          {visibleNodes.map((node) => (
            <circle
              key={node.person.id}
              cx={node.x + CARD_W / 2}
              cy={node.y + CARD_H / 2}
              r={4 / scale}
              className={
                node.person.gender === GENDER.MALE
                  ? (node.person.is_patrilineal !== false ? 'fill-indigo-400' : 'fill-stone-400')
                  : (node.person.is_patrilineal !== false ? 'fill-rose-400' : 'fill-stone-400')
              }
            />
          ))}
          <rect
            x={viewBox.x}
            y={viewBox.y}
            width={viewBox.width}
            height={viewBox.height}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2 / scale}
            className="opacity-50"
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
    <div className="flex flex-wrap items-center gap-3 px-3 py-1.5 text-[10px] text-muted-foreground border-t bg-muted/20">
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-indigo-400" />
        <span>Nam</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-rose-400" />
        <span>Nữ</span>
      </div>
      {!hideNgoaiToc && (
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border border-dashed border-stone-400 bg-stone-100" />
          <span>Ngoại tộc</span>
        </div>
      )}
      {!hideNgoaiToc && (
        <div className="flex items-center gap-1">
          <div className="w-6 border-t border-dashed border-slate-400" />
          <span className="text-[8px]">❤</span>
          <span>Vợ chồng</span>
        </div>
      )}
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground/60">●</span>
        <span>Còn sống</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-amber-600">☸</span>
        <span>Đã mất</span>
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
  hideNgoaiToc: boolean = false,
  resizedNodes?: Map<string, { w: number; h: number }>
) {
  // Helpers: get custom or default card dimensions per person
  const getW = (personId: string) => resizedNodes?.get(personId)?.w ?? CARD_W;
  const getH = (personId: string) => resizedNodes?.get(personId)?.h ?? CARD_H;
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
  // Use effective width that accounts for CSS genScale transform (gen 1-3 look bigger visually)
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const getScale = (personId: string): number => {
    const gen = peopleById.get(personId)?.generation ?? 99;
    return gen === 1 ? 1.4 : gen === 2 ? 1.25 : gen === 3 ? 1.1 : 1;
  };
  const getEffectiveW = (personId: string): number => getW(personId) * getScale(personId);
  const getVisualLeft = (personId: string, x: number): number => {
    const baseW = getW(personId);
    const effectiveW = getEffectiveW(personId);
    return x - (effectiveW - baseW) / 2;
  };
  const getVisualRight = (personId: string, x: number): number => {
    const baseW = getW(personId);
    const effectiveW = getEffectiveW(personId);
    return x + baseW + (effectiveW - baseW) / 2;
  };
  const getSpouseRowStep = (personId: string, spouseIds: string[]): number => {
    const widths = [getEffectiveW(personId), ...spouseIds.map((spouseId) => getEffectiveW(spouseId))];
    return Math.max(...widths) + COUPLE_GAP;
  };
  const getAdaptiveRootGap = (leftRootId: string, rightRootId: string): number => {
    const leftWidth = subtreeWidths.get(leftRootId) || getEffectiveW(leftRootId);
    const rightWidth = subtreeWidths.get(rightRootId) || getEffectiveW(rightRootId);
    const breadthBuffer = Math.min(240, Math.round(Math.max(leftWidth, rightWidth) * 0.12));
    return ROOT_GAP + breadthBuffer;
  };
  const subtreeWidths = new Map<string, number>();
  const computeSubtreeWidth = (personId: string): number => {
    if (subtreeWidths.has(personId)) return subtreeWidths.get(personId)!;
    const personW = getEffectiveW(personId);
    const familyGroupsWithSlots = getPositionedFamilyGroupsAsFather(personId);
    const wives = familyGroupsWithSlots.filter(({ spouseId }) => spouseId !== null);
    const wifeIds = wives.flatMap(({ spouseId }) => spouseId ? [spouseId] : []);
    const familyGroups = collapsedNodes.has(personId)
      ? []
      : familyGroupsWithSlots.filter(({ childIds }) => childIds.length > 0);
    const spouseRowWidth = (() => {
      if (wifeIds.length === 0) return personW;
      if (wifeIds.length === 1) {
        return personW + COUPLE_GAP + getEffectiveW(wifeIds[0]);
      }

      const rowStep = getSpouseRowStep(personId, wifeIds);
      let minLeft = -personW / 2;
      let maxRight = personW / 2;

      wives.forEach(({ spouseId, slot }) => {
        if (!spouseId) return;
        const spouseW = getEffectiveW(spouseId);
        const spouseCenter = slot * rowStep;
        minLeft = Math.min(minLeft, spouseCenter - spouseW / 2);
        maxRight = Math.max(maxRight, spouseCenter + spouseW / 2);
      });

      return maxRight - minLeft;
    })();
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
    const sw = subtreeWidths.get(personId) || getEffectiveW(personId);
    const personW = getW(personId);
    const familyGroupsWithSlots = getPositionedFamilyGroupsAsFather(personId);
    const wives = familyGroupsWithSlots.filter(({ spouseId }) => spouseId !== null);
    const wifeIds = wives.flatMap(({ spouseId }) => spouseId ? [spouseId] : []);
    const familyChildren = collapsedNodes.has(personId)
      ? []
      : familyGroupsWithSlots.filter(({ childIds }) => childIds.length > 0);
    const hasMultipleSpouses = wives.length > 1;
    const centerX = startX + sw / 2;

    // Father always centered — wives placed to the right (patrilineal alignment)
    const fatherX = centerX - personW / 2;
    xPositions.set(personId, fatherX);
    wives.forEach(({ spouseId, slot }) => {
      if (!spouseId) return;
      const spouseW = getW(spouseId);
      if (hasMultipleSpouses) {
        const spouseCenter = centerX + slot * getSpouseRowStep(personId, wifeIds);
        xPositions.set(spouseId, spouseCenter - spouseW / 2);
      } else {
        const spouseVisualLeft = getVisualRight(personId, fatherX) + COUPLE_GAP;
        const spouseX = spouseVisualLeft + (getEffectiveW(spouseId) - spouseW) / 2;
        xPositions.set(spouseId, spouseX);
      }
    });

    // Children stay grouped by the visual spouse order so each branch reads as one family unit.
    if (familyChildren.length > 0) {
      const totalChildW = familyChildren.reduce((sum, group, index) => {
        const groupWidth =
          group.childIds.reduce((groupSum, childId) => groupSum + (subtreeWidths.get(childId) || getEffectiveW(childId)), 0) +
          (group.childIds.length - 1) * SIBLING_GAP;
        return sum + groupWidth + (index > 0 ? FAMILY_GAP : 0);
      }, 0);
      let childX = centerX - totalChildW / 2;
      familyChildren.forEach(({ family, childIds }, groupIndex) => {
        const groupWidth =
          childIds.reduce((groupSum, childId) => groupSum + (subtreeWidths.get(childId) || getEffectiveW(childId)), 0) +
          (childIds.length - 1) * SIBLING_GAP;
        familyCenterById.set(family.id, childX + groupWidth / 2);

        childIds.forEach((child, childIndex) => {
          assignPositions(child, childX);
          childX += (subtreeWidths.get(child) || getEffectiveW(child));
          if (childIndex < childIds.length - 1) childX += SIBLING_GAP;
        });
        if (groupIndex < familyChildren.length - 1) childX += FAMILY_GAP;
      });
    }
  };

  let rootStartX = 0;
  for (let rootIndex = 0; rootIndex < roots.length; rootIndex++) {
    const root = roots[rootIndex];
    assignPositions(root, rootStartX);

    if (rootIndex < roots.length - 1) {
      const nextRoot = roots[rootIndex + 1];
      rootStartX += (subtreeWidths.get(root) || getEffectiveW(root)) + getAdaptiveRootGap(root, nextRoot);
    }
  }

  // Keep generation lanes anchored to the clan's first generation,
  // so Đời 1 always stays right below the temple header.
  const rootGeneration = Math.min(...visiblePeople.map((p) => p.generation || 1));
  const maxGeneration = Math.max(...visiblePeople.map((p) => p.generation || rootGeneration));
  const generationTopByGen = new Map<number, number>();
  let currentGenerationTop = FIRST_GENERATION_TOP_OFFSET;

  for (let generation = rootGeneration; generation <= maxGeneration; generation++) {
    generationTopByGen.set(generation, currentGenerationTop);

    const peopleInGeneration = visiblePeople.filter((person) => (person.generation || rootGeneration) === generation);
    const maxLaneContentHeight = peopleInGeneration.reduce((maxHeight, person) => {
      const cardHeight = getH(person.id);
      const summaryHeight = collapsedNodes.has(person.id) && getVisibleChildrenAsFather(person.id).length > 0
        ? COLLAPSED_SUMMARY_GAP + COLLAPSED_SUMMARY_H
        : 0;
      return Math.max(maxHeight, cardHeight + summaryHeight);
    }, CARD_H);

    currentGenerationTop += Math.max(LEVEL_HEIGHT, maxLaneContentHeight + GENERATION_VERTICAL_PADDING);
  }
  const nodes: TreeNodeData[] = [];
  for (const person of visiblePeople) {
    if (!xPositions.has(person.id)) continue;
    const personGeneration = person.generation || rootGeneration;
    nodes.push({
      person,
      x: xPositions.get(person.id)!,
      y: generationTopByGen.get(personGeneration) ?? FIRST_GENERATION_TOP_OFFSET,
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

    const fatherW = family.father_id ? getW(family.father_id) : CARD_W;
    const fatherH = family.father_id ? getH(family.father_id) : CARD_H;
    const motherW = family.mother_id ? getW(family.mother_id) : CARD_W;
    const motherH = family.mother_id ? getH(family.mother_id) : CARD_H;

    const fatherCenterX = fatherPos ? fatherPos.x + fatherW / 2 : null;
    const motherCenterX = motherPos ? motherPos.x + motherW / 2 : null;
    // Always originate branches from the father (patrilineal tree)
    const coupleMidX = fatherCenterX ?? motherCenterX ?? 0;

    // Couple line (horizontal, between nodes)
    if (fatherPos && motherPos) {
      const fatherToRight = fatherPos.x < motherPos.x;
      connections.push({
        id: `couple-${family.id}`,
        x1: fatherToRight ? getVisualRight(family.father_id!, fatherPos.x) : getVisualLeft(family.father_id!, fatherPos.x),
        y1: fatherPos.y + fatherH / 2,
        x2: fatherToRight ? getVisualLeft(family.mother_id!, motherPos.x) : getVisualRight(family.mother_id!, motherPos.x),
        y2: motherPos.y + motherH / 2,
        type: 'couple',
        isVisible: true,
      });
    }

    const parentIsCollapsed =
      (family.father_id && collapsedNodes.has(family.father_id)) ||
      (!family.father_id && family.mother_id && collapsedNodes.has(family.mother_id));
    if (parentIsCollapsed) continue;

    const parentPos = fatherPos ?? motherPos!;
    const parentH = family.father_id ? fatherH : motherH;

    // Always use couple midpoint as the connection origin
    // This ensures straight vertical lines from parent couple down to children
    children.filter((c) => c.family_id === family.id).forEach((child) => {
      const childPos = personPos.get(child.person_id);
      if (childPos) {
        const childW = getW(child.person_id);
        connections.push({
          id: `child-${family.id}-${child.person_id}`,
          x1: coupleMidX,
          y1: parentPos.y + parentH,
          x2: childPos.x + childW / 2,
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
    const nW = getW(n.person.id);
    const nH = getH(n.person.id);
    const summaryBottom = n.isCollapsed && n.hasChildren
      ? COLLAPSED_SUMMARY_GAP + COLLAPSED_SUMMARY_H
      : 0;
    minX = Math.min(minX, getVisualLeft(n.person.id, n.x));
    maxX = Math.max(maxX, getVisualRight(n.person.id, n.x));
    maxY = Math.max(maxY, n.y + nH + summaryBottom);
    const generation = n.person.generation || rootGeneration;
    if (generation === rootGeneration) {
      firstGenerationMinX = Math.min(firstGenerationMinX, getVisualLeft(n.person.id, n.x));
      firstGenerationMaxX = Math.max(firstGenerationMaxX, getVisualRight(n.person.id, n.x));
    }
  }
  if (!isFinite(minX)) { minX = 0; maxX = 0; }

  // Center first generation at x=0 so CSS left:50% naturally centers the tree
  const firstGenCenterRaw = isFinite(firstGenerationMinX)
    ? (firstGenerationMinX + firstGenerationMaxX) / 2
    : (minX + maxX) / 2;
  const offsetX = -firstGenCenterRaw;

  return {
    nodes,
    connections,
    width: Math.max(800, maxX - minX + 240),
    height: maxY + 120,
    offsetX,
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
  const [hideNgoaiToc, setHideNgoaiToc] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showDecorations, setShowDecorations] = useState(false);
  const [filterRootId, setFilterRootId] = useState<string | null>(() =>
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('root')
      : null
  );
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);

  // Resizable card sizes - persisted to localStorage
  const [resizedNodes, setResizedNodes] = useState<Map<string, { w: number; h: number }>>(() => {
    if (typeof window === 'undefined') return new Map();
    try {
      const saved = localStorage.getItem('tree-card-sizes');
      if (saved) return new Map(JSON.parse(saved));
    } catch { /* ignore */ }
    return new Map();
  });

  const handleCardResize = useCallback((personId: string, w: number, h: number) => {
    setResizedNodes(prev => {
      const next = new Map(prev);
      next.set(personId, { w, h });
      try { localStorage.setItem('tree-card-sizes', JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  const autoCollapsedNodes = useMemo(() => computeAutoCollapsedNodes(data), [data]);
  const activeCollapsedNodes = collapsedNodes ?? autoCollapsedNodes;

  const handleSetFilterRoot = useCallback((person: TreePerson | null) => {
    setFilterRootId(person?.id ?? null);
    setFilterSearch('');
    setFilterDropdownOpen(false);
    setPan({ x: 0, y: 0 });
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

  // Generation offset for relative coloring when viewing a branch
  const generationOffset = filterRootPerson ? (filterRootPerson.generation ?? 1) - 1 : 0;

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
    return buildTreeLayout(data, activeCollapsedNodes, viewMode, focusPersonId, filterRootId, hideNgoaiToc, resizedNodes);
  }, [data, activeCollapsedNodes, viewMode, focusPersonId, filterRootId, hideNgoaiToc, resizedNodes]);

  // No autoAlignPanX needed — layout.offsetX already centers first gen at x=0.
  // CSS left:50% on the content div centers it in the container.
  // pan.x is purely user drag offset.

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

  const handleResetCardSizes = useCallback(() => {
    setResizedNodes(new Map());
    try { localStorage.removeItem('tree-card-sizes'); } catch { /* ignore */ }
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
      x: rect.width / 2 - nodeX * scale,
      y: rect.height / 2 - nodeY * scale,
    });
  }, [scale]);

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

  // Pan handlers — panStart captures clientX - pan.x, move sets pan.x directly.
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setContextMenu(null);
    }
  }, [pan.x, pan.y]);

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
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
      setContextMenu(null);
    }
  }, [pan.x, pan.y]);

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
      x: -(x - rect.width / 2 / scale),
      y: -(y - rect.height / 2 / scale),
    });
  }, [layout, scale]);

  // View mode change
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    if (mode !== 'all' && !selectedPerson && data?.people.length) {
      setSelectedPerson(data.people[0]);
    }
  }, [selectedPerson, data]);

  // Computed viewBox for minimap
  const viewBox = useMemo(() => ({
    x: -pan.x / scale,
    y: -pan.y / scale,
    width: containerSize.width / scale,
    height: containerSize.height / scale,
  }), [pan.x, pan.y, scale, containerSize.width, containerSize.height]);

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
      <div className="flex flex-wrap items-center gap-2">
        {/* Zoom controls */}
        <div className="flex items-center gap-1 border rounded-lg p-1">
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
        <div className="flex items-center gap-1 border rounded-lg p-1">
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
        <div className="flex items-center gap-1 border rounded-lg p-1">
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
        {resizedNodes.size > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetCardSizes}
            className="h-8 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            title="Đưa tất cả ô về kích thước mặc định"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset ô
          </Button>
        )}

        {/* Instructions */}
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Move className="h-3 w-3" />
          <span className="hidden sm:inline">Cuộn để zoom · Kéo để di chuyển · Nhấn để xem</span>
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
      <>
        <div
          className={`relative overflow-hidden bg-amber-50 rounded-xl ${showDecorations ? 'h-[74vh] min-h-[640px]' : 'h-[76vh] min-h-[620px]'
            }`}
          style={{
            backgroundImage: 'url(/tree-assets/bg-pattern.png)',
            backgroundRepeat: 'repeat',
            backgroundSize: '320px 320px',
          }}
        >
          {/* Subtle overlay */}
          <div className="absolute inset-0 pointer-events-none z-0" style={{ background: "linear-gradient(to bottom, #f5e6d3, #f0dcc8, #f5e6d3)" }} />
          <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_top,rgba(255,240,200,0.35),transparent_55%)]" />

          {/* Fixed Traditional Overlays */}
          {showDecorations && (
            <>
              <div className="absolute inset-x-0 top-2 h-[108px] z-[1] pointer-events-none">
                <TraditionalHeader familyName={clanName} subtitle={clanMotto} />
              </div>
              <TraditionalScroll text="Phúc Đức Tổ Tiên" side="left" />
              <TraditionalScroll text="Con Cháu Thảo Hiền" side="right" />
              <div className="absolute inset-x-0 bottom-7 h-[56px] z-[1] pointer-events-none opacity-80">
                <TraditionalFooter />
              </div>
              <div className="absolute left-3 right-3 top-[122px] border-t border-amber-700/30 z-[2] pointer-events-none" />
            </>
          )}

          <div
            className={`absolute rounded-lg overflow-hidden ${showDecorations
                ? 'left-2 right-2 top-[120px] bottom-6 md:left-3 md:right-3 lg:left-[76px] lg:right-[76px]'
                : 'left-2 right-2 top-2 bottom-8 md:left-3 md:right-3 md:top-3 md:bottom-9'
              }`}
          >
            <div
              ref={containerRef}
              className="overflow-hidden relative select-none z-[5] h-full w-full"
              style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >

              {/* Transformed content */}
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                  transformOrigin: '0 0',
                  position: 'absolute',
                  left: '50%',
                  width: layout.width,
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
                      customSize={resizedNodes.get(node.person.id)}
                      onResize={handleCardResize}
                      treeScale={scale}
                      generationOffset={generationOffset}
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
      </>
    </div>
  );
}
