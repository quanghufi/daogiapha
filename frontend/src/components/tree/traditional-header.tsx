/**
 * @project AncestorTree
 * @file src/components/tree/traditional-header.tsx
 * @description Traditional Vietnamese family tree decorative elements
 * @version 1.0.0
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
    <div className="relative w-full flex flex-col items-center select-none pointer-events-none">
      {/* Temple roof header */}
      <div className="relative w-full max-w-[620px] mx-auto aspect-[560/250]">
        <Image
          src="/tree-assets/temple-header-trim.png"
          alt="Mái đình truyền thống"
          fill
          sizes="(max-width: 768px) 92vw, 620px"
          className="object-contain drop-shadow-[0_14px_24px_rgba(90,48,12,0.26)]"
          priority
        />
      </div>

      {/* Family name banner below temple */}
      <div className="relative -mt-2.5 z-10">
        <div className="relative px-8 sm:px-12 py-2.5 bg-gradient-to-r from-red-900/95 via-red-800/95 to-red-900/95 border-2 border-yellow-500 rounded-lg shadow-xl">
          {/* Golden corner decorations */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-400 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-400 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-400 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-400 rounded-br-lg" />

          <div className="text-center">
            <p className="text-yellow-200 text-xs tracking-[0.3em] uppercase font-medium">
              Phả Đồ Dòng Họ
            </p>
            <h2
              className="text-2xl md:text-3xl font-bold text-yellow-300 tracking-wider"
              style={{ fontFamily: '"Noto Serif", "Times New Roman", serif' }}
            >
              {familyName}
            </h2>
            <p className="text-yellow-200/80 text-sm mt-0.5">{subtitle}</p>
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
  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 z-[3] hidden lg:flex flex-col items-center ${
        side === 'left' ? 'left-0' : 'right-0'
      }`}
      style={{ width: '80px' }}
    >
      <div className="relative w-[74px] aspect-[210/535]">
        <Image
          src="/tree-assets/scroll-banner-trim.png"
          alt={`Câu đối ${side === 'left' ? 'trái' : 'phải'}`}
          fill
          sizes="74px"
          className="object-contain drop-shadow-md"
        />
        {/* Text overlay on scroll */}
        <div className="absolute inset-0 flex items-center justify-center px-3 pt-2 pb-4">
          <p
            className="text-yellow-300 text-xs font-bold leading-[2.05] tracking-[0.3em]"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              fontFamily: '"Noto Serif", "Times New Roman", serif',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TraditionalFooter() {
  return (
    <div className="relative w-full flex justify-center select-none pointer-events-none mt-2">
      <div className="relative w-full max-w-[520px] aspect-[592/205]">
        <Image
          src="/tree-assets/lotus-decoration-trim.png"
          alt="Hoa sen trang trí"
          fill
          sizes="(max-width: 768px) 85vw, 520px"
          className="object-contain opacity-85 drop-shadow-[0_8px_16px_rgba(70,40,12,0.2)]"
        />
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
      {/* Outer golden border */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none z-10"
        style={{
          border: '3px solid #c5942a',
          boxShadow:
            'inset 0 0 0 2px #8b6c1f, inset 0 0 0 4px #c5942a33, 0 0 20px rgba(197, 148, 42, 0.15)',
        }}
      />
      {/* Corner ornaments */}
      <div className="absolute top-1 left-1 w-8 h-8 border-t-3 border-l-3 border-yellow-600 rounded-tl-lg z-10 pointer-events-none" />
      <div className="absolute top-1 right-1 w-8 h-8 border-t-3 border-r-3 border-yellow-600 rounded-tr-lg z-10 pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-8 h-8 border-b-3 border-l-3 border-yellow-600 rounded-bl-lg z-10 pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-8 h-8 border-b-3 border-r-3 border-yellow-600 rounded-br-lg z-10 pointer-events-none" />

      {children}
    </div>
  );
}
