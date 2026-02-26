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
} from 'lucide-react';
import type { TreePerson } from '@/types';
import type { TreeData } from '@/lib/supabase-data';
import Link from 'next/link';
import { GENDER } from '@/lib/constants';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const CARD_W = 180;
const CARD_H = 80;
const LEVEL_HEIGHT = 140;
const SIBLING_GAP = 24;
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
}

interface TreeConnectionData {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'parent-child' | 'couple';
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
  const style = getCardStyle(person);
  const initials = getInitials(person.display_name);
  const selectedRing = isSelected ? 'ring-2 ring-primary ring-offset-2' : '';

  // Year display
  const birthYear = person.birth_year;
  const deathYear = person.death_year;
  const yearText = birthYear
    ? deathYear
      ? `${birthYear} - ${deathYear}`
      : `${birthYear} -`
    : deathYear
      ? `? - ${deathYear}`
      : null;

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
        className={`absolute bg-gradient-to-br ${style.card} rounded-lg border-[1.5px] cursor-pointer hover:shadow-md transition-all ${selectedRing}`}
        style={{ left: x, top: y, width: CARD_W, height: 40 }}
        onClick={() => onSelect(person, x, y)}
      >
        <div className="flex items-center gap-1.5 px-2 h-full">
          <div className={`w-5 h-5 rounded-full ${style.avatar} flex items-center justify-center text-[9px] font-bold shrink-0`}>
            {initials.charAt(0)}
          </div>
          <span className="text-[10px] font-medium truncate flex-1">{person.display_name}</span>
          {person.generation && (
            <span className="text-[8px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1 shrink-0">
              Đ{person.generation}
            </span>
          )}
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
  return (
    <>
      <div
        className={`absolute bg-gradient-to-br ${style.card} rounded-xl border-[1.5px] cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all ${selectedRing}`}
        style={{ left: x, top: y, width: CARD_W, height: CARD_H }}
        onClick={() => onSelect(person, x, y)}
      >
        <div className="flex items-start gap-2.5 p-2.5 h-full">
          {/* Avatar */}
          <div className={`w-9 h-9 rounded-full ${style.avatar} flex items-center justify-center text-xs font-bold shrink-0 mt-0.5`}>
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            <div className="flex items-start gap-1">
              <span className="text-[11px] font-semibold leading-tight line-clamp-2 flex-1">
                {person.display_name}
              </span>
              {/* Living/Deceased indicator */}
              <span className={`text-[10px] shrink-0 mt-0.5 ${person.is_living !== false ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {person.is_living !== false ? '●' : '✝'}
              </span>
            </div>

            {/* Year */}
            {yearText && (
              <span className="text-[9px] text-muted-foreground leading-none">{yearText}</span>
            )}

            {/* Generation badge */}
            {person.generation && (
              <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1 py-0.5 w-fit leading-none">
                Đời {person.generation}
              </span>
            )}
          </div>
        </div>

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
        className="bg-background/95 backdrop-blur-lg border rounded-xl shadow-xl min-w-[200px] overflow-hidden"
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
  const parentChildGroups = new Map<string, { parentX: number; parentY: number; children: { x: number; y: number }[] }>();

  for (const conn of connections) {
    if (conn.type === 'couple') {
      coupleLines.push(conn);
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
      // Single child: straight vertical line
      paths.push(`M ${parentX} ${parentY} L ${kids[0].x} ${kids[0].y}`);
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

function LegendBar() {
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
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded border border-dashed border-stone-400 bg-stone-100" />
        <span>Ngoại tộc</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-6 border-t border-dashed border-slate-400" />
        <span className="text-[8px]">❤</span>
        <span>Vợ chồng</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground/60">●</span>
        <span>Còn sống</span>
      </div>
      <div className="flex items-center gap-1">
        <span>✝</span>
        <span>Đã mất</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tree Layout Builder — Hierarchical (Bottom-up subtree sizing)
// ═══════════════════════════════════════════════════════════════════════════

function buildTreeLayout(
  data: TreeData,
  collapsedNodes: Set<string>,
  viewMode: ViewMode,
  focusPersonId: string | null,
  filterRootId: string | null = null
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
  const visiblePeople = people.filter((p) => visibleIds.has(p.id));

  if (visiblePeople.length === 0) {
    return { nodes: [], connections: [], width: 0, height: 0, offsetX: 0 };
  }

  // Helpers
  const getVisibleChildrenAsFather = (personId: string): string[] => {
    const fams = fatherToFamilies.get(personId) || [];
    const result: string[] = [];
    for (const fam of fams) {
      children
        .filter((c) => c.family_id === fam.id && visibleIds.has(c.person_id))
        .sort((a, b) => a.sort_order - b.sort_order)
        .forEach((c) => { if (!result.includes(c.person_id)) result.push(c.person_id); });
    }
    return result;
  };

  const getVisibleWife = (personId: string): string | null => {
    const fams = fatherToFamilies.get(personId) || [];
    for (const fam of fams) {
      if (fam.mother_id && visibleIds.has(fam.mother_id)) return fam.mother_id;
    }
    return null;
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
    const wife = getVisibleWife(personId);
    const visChildren = collapsedNodes.has(personId) ? [] : getVisibleChildrenAsFather(personId);
    const coupleWidth = CARD_W + (wife ? COUPLE_GAP + CARD_W : 0);
    const childrenWidth = visChildren.length > 0
      ? visChildren.reduce((s, c) => s + computeSubtreeWidth(c), 0) + (visChildren.length - 1) * SIBLING_GAP
      : 0;
    const result = Math.max(coupleWidth, childrenWidth);
    subtreeWidths.set(personId, result);
    return result;
  };
  for (const root of roots) computeSubtreeWidth(root);

  // Top-down: assign X positions
  const xPositions = new Map<string, number>();
  const assignPositions = (personId: string, startX: number) => {
    const sw = subtreeWidths.get(personId) || CARD_W;
    const wife = getVisibleWife(personId);
    const visChildren = collapsedNodes.has(personId) ? [] : getVisibleChildrenAsFather(personId);
    const coupleWidth = CARD_W + (wife ? COUPLE_GAP + CARD_W : 0);
    const centerX = startX + sw / 2;

    // Center couple unit
    const fatherX = centerX - coupleWidth / 2;
    xPositions.set(personId, fatherX);
    if (wife) xPositions.set(wife, fatherX + CARD_W + COUPLE_GAP);

    // Children spread centered under couple
    if (visChildren.length > 0) {
      const totalChildW = visChildren.reduce((s, c) => s + (subtreeWidths.get(c) || CARD_W), 0)
        + (visChildren.length - 1) * SIBLING_GAP;
      let childX = centerX - totalChildW / 2;
      for (const child of visChildren) {
        assignPositions(child, childX);
        childX += (subtreeWidths.get(child) || CARD_W) + SIBLING_GAP;
      }
    }
  };

  let rootStartX = 0;
  for (const root of roots) {
    assignPositions(root, rootStartX);
    rootStartX += (subtreeWidths.get(root) || CARD_W) + SIBLING_GAP * 2;
  }

  const minGen = Math.min(...visiblePeople.map((p) => p.generation || 1));
  const nodes: TreeNodeData[] = [];
  for (const person of visiblePeople) {
    if (!xPositions.has(person.id)) continue;
    nodes.push({
      person,
      x: xPositions.get(person.id)!,
      y: (person.generation - minGen) * LEVEL_HEIGHT + 20,
      isCollapsed: collapsedNodes.has(person.id),
      hasChildren: getVisibleChildrenAsFather(person.id).length > 0,
      isVisible: true,
    });
  }

  // Build connections
  const connections: TreeConnectionData[] = [];
  const personPos = new Map(nodes.map((n) => [n.person.id, { x: n.x, y: n.y }]));

  for (const family of families) {
    const fatherPos = family.father_id ? personPos.get(family.father_id) : null;
    const motherPos = family.mother_id ? personPos.get(family.mother_id) : null;
    if (!fatherPos && !motherPos) continue;

    // Couple line (horizontal, between nodes)
    if (fatherPos && motherPos) {
      connections.push({
        id: `couple-${family.id}`,
        x1: fatherPos.x + CARD_W,
        y1: fatherPos.y + CARD_H / 2,
        x2: motherPos.x,
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
    const familyCenterX =
      fatherPos && motherPos
        ? (fatherPos.x + CARD_W + motherPos.x) / 2
        : parentPos.x + CARD_W / 2;

    children.filter((c) => c.family_id === family.id).forEach((child) => {
      const childPos = personPos.get(child.person_id);
      if (childPos) {
        connections.push({
          id: `child-${family.id}-${child.person_id}`,
          x1: familyCenterX,
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
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x + CARD_W);
    maxY = Math.max(maxY, n.y + CARD_H);
  }
  if (!isFinite(minX)) { minX = 0; maxX = 0; }

  return {
    nodes,
    connections,
    width: maxX - minX + 100,
    height: maxY + 100,
    offsetX: -minX + 70,
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

// ═══════════════════════════════════════════════════════════════════════════
// Main Family Tree Component
// ═══════════════════════════════════════════════════════════════════════════

export function FamilyTree() {
  const { data, isLoading, error } = useTreeData();

  // State
  const [scale, setScale] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 0.6 : 0.9
  );
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedPerson, setSelectedPerson] = useState<TreePerson | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [showMinimap, setShowMinimap] = useState(true);
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

  // Auto-collapse on initial load for deep trees
  const autoCollapseDone = useRef(false);
  useEffect(() => {
    if (autoCollapseDone.current || !data || data.people.length === 0) return;
    autoCollapseDone.current = true;

    const maxGen = Math.max(...data.people.map(p => p.generation || 1));
    if (maxGen > AUTO_COLLAPSE_GEN) {
      // Build fatherToFamilies for auto-collapse
      const ftf = new Map<string, typeof data.families>();
      for (const fam of data.families) {
        if (fam.father_id) {
          if (!ftf.has(fam.father_id)) ftf.set(fam.father_id, []);
          ftf.get(fam.father_id)!.push(fam);
        }
      }
      const toCollapse = new Set<string>();
      for (const p of data.people) {
        const gen = p.generation || 1;
        if (gen >= AUTO_COLLAPSE_GEN) {
          const fams = ftf.get(p.id) || [];
          const hasKids = fams.some(f => data.children.some(c => c.family_id === f.id));
          if (hasKids) toCollapse.add(p.id);
        }
      }
      if (toCollapse.size > 0) setCollapsedNodes(toCollapse);
    }
  }, [data]);

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

  // Layout
  const layout = useMemo(() => {
    if (!data || data.people.length === 0) return null;
    return buildTreeLayout(data, collapsedNodes, viewMode, selectedPerson?.id || null, filterRootId);
  }, [data, collapsedNodes, viewMode, selectedPerson?.id, filterRootId]);

  // Zoom level
  const zoomLevel = useMemo<ZoomLevel>(() => getZoomLevel(scale), [scale]);

  // Branch summaries for collapsed nodes
  const branchSummaries = useMemo(() => {
    if (!data || collapsedNodes.size === 0) return new Map<string, BranchSummary>();
    const fatherToFams = new Map<string, typeof data.families>();
    for (const fam of data.families) {
      if (fam.father_id) {
        if (!fatherToFams.has(fam.father_id)) fatherToFams.set(fam.father_id, []);
        fatherToFams.get(fam.father_id)!.push(fam);
      }
    }
    const pMap = new Map(data.people.map(p => [p.id, p]));
    const map = new Map<string, BranchSummary>();
    for (const nodeId of collapsedNodes) {
      map.set(nodeId, computeBranchSummary(nodeId, data, fatherToFams, data.children, pMap));
    }
    return map;
  }, [data, collapsedNodes]);

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
      x: rect.width / 2 - nodeX * scale,
      y: rect.height / 2 - nodeY * scale,
    });
  }, [scale]);

  const handleToggleCollapse = useCallback((personId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  }, []);

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
  }, [selectedPerson, data?.people]);

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
  }, [data?.people, filterSearch]);

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
      <div className="rounded-xl border-2 bg-gradient-to-br from-background to-muted/30 overflow-hidden">
        <div
          ref={containerRef}
          className="overflow-hidden relative select-none"
          style={{ height: '65vh', cursor: isPanning ? 'grabbing' : 'grab' }}
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
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
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

        {/* Legend */}
        <LegendBar />
      </div>
    </div>
  );
}
