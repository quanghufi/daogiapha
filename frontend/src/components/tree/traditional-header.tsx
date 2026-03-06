/**
 * @project AncestorTree
 * @file src/components/tree/traditional-header.tsx
 * @description Traditional Vietnamese family tree decorative elements
 * @version 2.0.0
 */

'use client';

import Image from 'next/image';

interface TraditionalHeaderProps {
  familyName?: string;
  subtitle?: string;
}

export function TraditionalHeader({
  familyName = 'Đào Tộc',
  subtitle = 'Ninh Thôn - Gia Phả',
}: TraditionalHeaderProps) {
  return (
    <div className="relative h-full w-full select-none pointer-events-none">
      <div className="absolute inset-x-0 top-0 flex justify-center">
        <div className="relative w-full max-w-[360px] sm:max-w-[420px] aspect-[560/250]">
          <Image
            src="/tree-assets/temple-header-trim.png"
            alt="Mái đình truyền thống"
            fill
            sizes="(max-width: 768px) 78vw, 420px"
            className="object-contain drop-shadow-[0_10px_18px_rgba(90,48,12,0.22)]"
            priority
          />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div className="rounded-md border border-yellow-500 bg-gradient-to-r from-red-900/90 via-red-800/90 to-red-900/90 px-4 py-1.5 shadow-lg">
          <div className="text-center leading-tight">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-yellow-200">Phả đồ dòng họ</p>
            <h2
              className="text-lg font-bold tracking-wide text-yellow-300 sm:text-xl"
              style={{ fontFamily: '"Noto Serif", "Times New Roman", serif' }}
            >
              {familyName}
            </h2>
            {subtitle && <p className="text-[11px] text-yellow-200/80">{subtitle}</p>}
          </div>
        </div>
      </div>
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
      className={`absolute top-1/2 -translate-y-1/2 z-[3] hidden xl:flex flex-col items-center ${
        side === 'left' ? 'left-1' : 'right-1'
      }`}
      style={{ width: '72px' }}
    >
      <div className="relative w-[66px] aspect-[210/535]">
        <Image
          src="/tree-assets/scroll-banner-trim.png"
          alt={`Câu đối ${side === 'left' ? 'trái' : 'phải'}`}
          fill
          sizes="66px"
          className="object-contain drop-shadow-md"
        />
        <div className="absolute inset-x-[11px] top-[78px] bottom-[78px] flex flex-col items-center justify-evenly overflow-hidden">
          {lines.map((line, index) => (
            <span
              key={`${line}-${index}`}
              className="block whitespace-nowrap text-center text-[13px] font-semibold leading-none tracking-[0.02em] text-[#f7d86f]"
              style={{
                fontFamily: '"Noto Serif", "Times New Roman", serif',
                textShadow: '0 1px 2px rgba(44, 10, 0, 0.78)',
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
      <div className="absolute bottom-0 left-2">
        <div className="relative w-[130px] aspect-[296/205] overflow-hidden">
          <Image
            src="/tree-assets/lotus-decoration-trim.png"
            alt="Hoa sen góc trái"
            fill
            sizes="130px"
            className="object-cover object-left opacity-80"
          />
        </div>
      </div>
      <div className="absolute bottom-0 right-2">
        <div className="relative w-[130px] aspect-[296/205] overflow-hidden">
          <Image
            src="/tree-assets/lotus-decoration-trim.png"
            alt="Hoa sen góc phải"
            fill
            sizes="130px"
            className="object-cover object-right opacity-80"
          />
        </div>
      </div>
    </div>
  );
}

interface TraditionalBorderProps {
  children: React.ReactNode;
}

export function TraditionalBorder({ children }: TraditionalBorderProps) {
  return (
    <div className="relative">
      <div
        className="absolute inset-0 rounded-xl pointer-events-none z-10"
        style={{
          border: '3px solid #c5942a',
          boxShadow:
            'inset 0 0 0 2px #8b6c1f, inset 0 0 0 4px #c5942a33, 0 0 20px rgba(197, 148, 42, 0.15)',
        }}
      />
      <div className="absolute inset-[7px] rounded-[10px] border border-amber-600/35 pointer-events-none z-10" />
      <div className="absolute inset-[12px] rounded-[8px] border border-amber-400/25 pointer-events-none z-10" />
      <div className="absolute top-1 left-1 h-8 w-8 rounded-tl-lg border-l-3 border-t-3 border-yellow-600 z-10 pointer-events-none" />
      <div className="absolute top-1 right-1 h-8 w-8 rounded-tr-lg border-r-3 border-t-3 border-yellow-600 z-10 pointer-events-none" />
      <div className="absolute bottom-1 left-1 h-8 w-8 rounded-bl-lg border-b-3 border-l-3 border-yellow-600 z-10 pointer-events-none" />
      <div className="absolute bottom-1 right-1 h-8 w-8 rounded-br-lg border-b-3 border-r-3 border-yellow-600 z-10 pointer-events-none" />

      {children}
    </div>
  );
}
