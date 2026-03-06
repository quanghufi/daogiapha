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
      <div className="relative w-full max-w-[600px] mx-auto">
        <Image
          src="/tree-assets/temple-header.png"
          alt="Mái đình truyền thống"
          width={600}
          height={320}
          className="w-full h-auto object-contain drop-shadow-lg"
          priority
        />
      </div>

      {/* Family name banner below temple */}
      <div className="relative -mt-4 z-10">
        <div className="relative px-12 py-3 bg-gradient-to-r from-red-800 via-red-700 to-red-800 border-2 border-yellow-500 rounded-lg shadow-xl">
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
      className={`absolute top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col items-center ${
        side === 'left' ? 'left-0' : 'right-0'
      }`}
      style={{ width: '80px' }}
    >
      <div className="relative w-[70px]">
        <Image
          src="/tree-assets/scroll-banner.png"
          alt={`Câu đối ${side === 'left' ? 'trái' : 'phải'}`}
          width={70}
          height={240}
          className="w-full h-auto object-contain drop-shadow-md"
        />
        {/* Text overlay on scroll */}
        <div className="absolute inset-0 flex items-center justify-center px-3 pt-4 pb-8">
          <p
            className="text-yellow-300 text-sm font-bold leading-[2.2] tracking-widest"
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
      <div className="w-full max-w-[500px]">
        <Image
          src="/tree-assets/lotus-decoration.png"
          alt="Hoa sen trang trí"
          width={500}
          height={150}
          className="w-full h-auto object-contain opacity-80"
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
