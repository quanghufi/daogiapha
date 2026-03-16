/**
 * @project AncestorTree
 * @file src/components/tree/traditional-header.tsx
 * @description Traditional Vietnamese family tree decorative elements
 * Stitch Design Phase 2 — Banner with dragons, scrolls, footer, border
 * @version 3.0.0
 */

'use client';

import Image from 'next/image';

// ═══════════════════════════════════════════════════════════════════════════
// Traditional Header (Hoành Phi style with dragons)
// ═══════════════════════════════════════════════════════════════════════════

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
    <div className="relative h-full w-full select-none pointer-events-none">
      {/* Dragon Left */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-[2]" style={{ width: '140px', height: '120px' }}>
        <Image
          src="/tree-assets/dragon-left.png"
          alt="Rồng trái"
          fill
          sizes="140px"
          className="object-contain drop-shadow-[0_4px_12px_rgba(197,148,42,0.35)]"
          style={{ filter: 'drop-shadow(0 2px 8px rgba(139,108,31,0.4))' }}
          priority
        />
      </div>

      {/* Dragon Right */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-[2]" style={{ width: '140px', height: '120px' }}>
        <Image
          src="/tree-assets/dragon-right.png"
          alt="Rồng phải"
          fill
          sizes="140px"
          className="object-contain drop-shadow-[0_4px_12px_rgba(197,148,42,0.35)]"
          style={{ filter: 'drop-shadow(0 2px 8px rgba(139,108,31,0.4))' }}
          priority
        />
      </div>

      {/* Center Banner — Hoành Phi */}
      <div className="absolute inset-x-0 top-0 flex justify-center z-[3]">
        <div className="relative" style={{ width: 'min(420px, 60vw)' }}>
          {/* Banner shape */}
          <div
            className="relative rounded-b-xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #5a1a1a 0%, #8b1a1a 15%, #6d1515 50%, #8b1a1a 85%, #5a1a1a 100%)',
              border: '3px solid #c5942a',
              borderTop: 'none',
              boxShadow: '0 8px 32px rgba(90,26,26,0.55), inset 0 2px 20px rgba(0,0,0,0.25), 0 0 0 1px #8b6c1f',
              padding: '10px 24px 14px',
            }}
          >
            {/* Inner gold border */}
            <div
              className="absolute inset-[3px] rounded-b-lg pointer-events-none"
              style={{ border: '1px solid rgba(197,148,42,0.45)' }}
            />

            {/* Corner ornaments */}
            <div className="absolute top-0 left-2 w-4 h-4 border-l-2 border-b-2 border-yellow-600/60 rounded-bl-md" />
            <div className="absolute top-0 right-2 w-4 h-4 border-r-2 border-b-2 border-yellow-600/60 rounded-br-md" />

            {/* Text content */}
            <div className="text-center leading-tight">
              {/* Top label */}
              <p
                className="text-[9px] font-medium uppercase tracking-[0.35em] text-yellow-300/70 mb-1"
                style={{ fontFamily: '"Noto Serif", "Times New Roman", serif' }}
              >
                Phả Hệ
              </p>

              {/* Main title */}
              <h2
                className="text-xl sm:text-2xl font-bold tracking-wider text-yellow-300"
                style={{
                  fontFamily: '"Noto Serif", "Times New Roman", serif',
                  textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 0 30px rgba(197,148,42,0.25)',
                  letterSpacing: '0.12em',
                }}
              >
                {familyName.toUpperCase()}
              </h2>

              {/* Ancestor name in calligraphy style */}
              {ancestorName && (
                <p
                  className="text-sm sm:text-base text-yellow-200/90 mt-0.5 italic"
                  style={{
                    fontFamily: '"Noto Serif", "Times New Roman", serif',
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  {ancestorName}
                </p>
              )}

              {/* Subtitle */}
              {subtitle && (
                <p className="text-[10px] text-yellow-200/60 mt-0.5 tracking-[0.15em]">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Bottom decorative tip */}
          <div className="flex justify-center -mt-[1px]">
            <div
              style={{
                width: '28px',
                height: '12px',
                background: 'linear-gradient(180deg, #8b1a1a, #5a1a1a)',
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                border: '1px solid #c5942a',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Traditional Scroll (Câu đối)
// ═══════════════════════════════════════════════════════════════════════════

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
        <div className="absolute inset-x-[12px] top-[22px] bottom-[28px] flex flex-col items-center justify-evenly overflow-hidden">
          {lines.map((line, index) => (
            <span
              key={`${line}-${index}`}
              className="block whitespace-nowrap text-center text-[11px] font-semibold leading-none tracking-[0.01em] text-[#f7d86f]"
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

// ═══════════════════════════════════════════════════════════════════════════
// Traditional Footer (Lotus decoration)
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// Traditional Border (Gold triple-layer frame)
// ═══════════════════════════════════════════════════════════════════════════

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


