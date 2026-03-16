/**
 * @project AncestorTree
 * @file src/components/tree/traditional-header.tsx
 * @description Traditional Vietnamese family tree decorative elements
 * @version 4.0.0
 */

'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';

interface TraditionalHeaderProps {
  familyName?: string;
  subtitle?: string;
  ancestorName?: string;
}

export function TraditionalHeader({
  familyName = 'Họ Đào',
  subtitle = 'Ninh Thôn',
  ancestorName,
}: TraditionalHeaderProps) {
  return (
    <div className="relative h-full w-full select-none pointer-events-none overflow-hidden">
      <div className="absolute left-[8%] top-[52%] z-[1] hidden -translate-y-1/2 xl:block">
        <div className="relative h-[132px] w-[280px]">
          <Image
            src="/tree-assets/dragon-left.png"
            alt="Rồng trái"
            fill
            priority
            sizes="280px"
            className="object-contain opacity-95 drop-shadow-[0_10px_14px_rgba(124,45,18,0.28)]"
          />
        </div>
      </div>

      <div className="absolute right-[8%] top-[52%] z-[1] hidden -translate-y-1/2 xl:block">
        <div className="relative h-[132px] w-[280px]">
          <Image
            src="/tree-assets/dragon-right.png"
            alt="Rồng phải"
            fill
            priority
            sizes="280px"
            className="object-contain opacity-95 drop-shadow-[0_10px_14px_rgba(124,45,18,0.28)]"
          />
        </div>
      </div>

      <div className="absolute inset-x-0 top-3 z-[2] flex justify-center">
        <div className="relative h-[120px] w-[min(96vw,760px)]">
          <Image
            src="/tree-assets/temple-header-trim.png"
            alt="Hoành phi phả hệ"
            fill
            priority
            sizes="760px"
            className="object-contain drop-shadow-[0_12px_18px_rgba(120,53,15,0.25)]"
          />

          <div className="absolute inset-x-[23%] top-[8%] text-center">
            <div
              className="text-[13px] font-bold uppercase tracking-[0.45em] text-[#ffe28a] md:text-[15px]"
              style={{ textShadow: '0 2px 3px rgba(101, 29, 7, 0.55)' }}
            >
              Phả Hệ
            </div>
            <div
              className="mt-1 text-[28px] font-black uppercase leading-none text-[#ffe28a] md:text-[36px]"
              style={{
                fontFamily: '"Noto Serif", "Times New Roman", serif',
                textShadow: '0 2px 0 #7f1d1d, 0 6px 12px rgba(127, 29, 29, 0.35)',
              }}
            >
              {familyName}
            </div>
            <div
              className="mt-1 text-[15px] font-extrabold uppercase tracking-[0.22em] text-[#1e3a8a] md:text-[20px]"
              style={{ textShadow: '0 1px 0 rgba(255,255,255,0.35)' }}
            >
              {subtitle}
            </div>
          </div>
        </div>
      </div>

      {ancestorName && (
        <div className="absolute inset-x-0 top-[108px] z-[3] flex justify-center px-4">
          <div
            className="rounded-2xl border-[3px] border-[#fbbf24] bg-gradient-to-b from-[#ef4444] via-[#dc2626] to-[#b91c1c] px-7 py-2 text-center shadow-[0_8px_18px_rgba(153,27,27,0.25)]"
            style={{ minWidth: 340 }}
          >
            <div
              className="text-lg font-black uppercase tracking-[0.08em] text-[#ffefad] md:text-[28px]"
              style={{ textShadow: '0 2px 0 rgba(120, 30, 10, 0.65)' }}
            >
              {ancestorName}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TraditionalScrollProps {
  text: string;
  side: 'left' | 'right';
}

export function TraditionalScroll({ text, side }: TraditionalScrollProps) {
  const lines = text
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <div
      className={`absolute top-1/2 z-[3] hidden -translate-y-1/2 2xl:flex ${side === 'left' ? 'left-4' : 'right-4'}`}
    >
      <div className="relative h-[392px] w-[84px]">
        <Image
          src="/tree-assets/scroll-banner-trim.png"
          alt={side === 'left' ? 'Trướng đối trái' : 'Trướng đối phải'}
          fill
          sizes="84px"
          className="object-contain drop-shadow-[0_10px_16px_rgba(120,53,15,0.25)]"
        />
        <div className="absolute inset-x-[18px] top-[30px] bottom-[36px] flex flex-col items-center justify-evenly overflow-hidden">
          {lines.map((line, index) => (
            <span
              key={`${line}-${index}`}
              className="block text-center text-[12px] font-bold leading-none tracking-[0.01em] text-[#ffe08a]"
              style={{
                fontFamily: '"Noto Serif", "Times New Roman", serif',
                textShadow: '0 1px 2px rgba(68, 10, 0, 0.85)',
              }}
            >
              {line}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TraditionalFooter() {
  return (
    <div className="relative h-full w-full select-none pointer-events-none">
      <div className="absolute bottom-0 left-1">
        <div className="relative aspect-[296/205] w-[150px] overflow-hidden">
          <Image
            src="/tree-assets/lotus-decoration-trim.png"
            alt="Hoa sen trái"
            fill
            sizes="150px"
            className="object-cover object-left opacity-80"
          />
        </div>
      </div>
      <div className="absolute bottom-0 right-1">
        <div className="relative aspect-[296/205] w-[150px] overflow-hidden">
          <Image
            src="/tree-assets/lotus-decoration-trim.png"
            alt="Hoa sen phải"
            fill
            sizes="150px"
            className="object-cover object-right opacity-80"
          />
        </div>
      </div>
      <div className="absolute inset-x-[18%] bottom-2 h-px bg-gradient-to-r from-transparent via-[#d97706]/50 to-transparent" />
    </div>
  );
}

interface TraditionalBorderProps {
  children: ReactNode;
}

export function TraditionalBorder({ children }: TraditionalBorderProps) {
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-[#f8dc52] shadow-[0_28px_60px_rgba(146,64,14,0.18)]">
      <div className="pointer-events-none absolute inset-0 z-10 rounded-[28px] border-[6px] border-[#facc15]" />
      <div className="pointer-events-none absolute inset-[10px] z-10 rounded-[22px] border-[5px] border-[#b91c1c]" />
      <div className="pointer-events-none absolute inset-[18px] z-10 rounded-[16px] border-[3px] border-[#facc15]" />
      <div
        className="pointer-events-none absolute inset-[24px] z-10 rounded-[12px]"
        style={{
          border: '3px solid #b45309',
          backgroundImage: [
            'linear-gradient(90deg, #b45309 0 8px, transparent 8px 16px)',
            'linear-gradient(90deg, #b45309 0 8px, transparent 8px 16px)',
            'linear-gradient(0deg, #b45309 0 8px, transparent 8px 16px)',
            'linear-gradient(0deg, #b45309 0 8px, transparent 8px 16px)',
          ].join(','),
          backgroundSize: '16px 3px, 16px 3px, 3px 16px, 3px 16px',
          backgroundPosition: 'top left, bottom left, top left, top right',
          backgroundRepeat: 'repeat-x, repeat-x, repeat-y, repeat-y',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.26),transparent_42%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.18),transparent_38%)]" />

      {children}
    </div>
  );
}
