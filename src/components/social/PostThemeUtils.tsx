import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export const PRODUCT_CATEGORIES = [
  { id: 'clothing', label: 'Clothing & Fashion' },
  { id: 'electronics', label: 'Electronics & Gadgets' },
  { id: 'beauty', label: 'Health & Beauty' },
  { id: 'home', label: 'Home & Kitchen' },
  { id: 'baby', label: 'Baby & Childcare' },
  { id: 'fitness', label: 'Fitness & Sports' },
  { id: 'food', label: 'Food & Organic Grocery' },
  { id: 'bags', label: 'Bags & Shoes' },
  { id: 'accessories', label: 'Smart Accessories' },
  { id: 'other', label: 'Others / General' },
];

export const POST_BACKGROUND_THEMES = [
  { id: 'none', name: 'Normal', bgClass: '' },
  {
    id: 'sunset_fire',
    name: 'Sunset Fire',
    bgClass:
      'social-post-bg-theme social-post-theme-sunset_fire bg-gradient-to-r from-orange-500 via-pink-600 to-red-600',
  },
  {
    id: 'ocean_deep',
    name: 'Ocean Deep',
    bgClass:
      'social-post-bg-theme social-post-theme-ocean_deep bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700',
  },
  {
    id: 'royal_purple',
    name: 'Royal Purple',
    bgClass:
      'social-post-bg-theme social-post-theme-royal_purple bg-gradient-to-r from-purple-700 via-indigo-600 to-pink-600',
  },
  {
    id: 'emerald_forest',
    name: 'Emerald Forest',
    bgClass:
      'social-post-bg-theme social-post-theme-emerald_forest bg-gradient-to-r from-emerald-600 via-green-600 to-teal-800',
  },
  {
    id: 'neon_cyber',
    name: 'Neon Cyber',
    bgClass:
      'social-post-bg-theme social-post-theme-neon_cyber bg-gradient-to-r from-cyan-500 via-blue-600 to-fuchsia-600',
  },
  {
    id: 'midnight_glow',
    name: 'Midnight Glow',
    bgClass:
      'social-post-bg-theme social-post-theme-midnight_glow bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900',
  },
  {
    id: 'gold_luxury',
    name: 'Gold Luxury',
    bgClass:
      'social-post-bg-theme social-post-theme-gold_luxury bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-600',
  },
  {
    id: 'passion_rose',
    name: 'Passion Rose',
    bgClass:
      'social-post-bg-theme social-post-theme-passion_rose bg-gradient-to-r from-rose-600 via-pink-600 to-red-500',
  },
  {
    id: 'cosmic_nebula',
    name: 'Cosmic Nebula',
    bgClass:
      'social-post-bg-theme social-post-theme-cosmic_nebula bg-gradient-to-tr from-violet-900 via-purple-800 to-sky-700',
  },
  {
    id: 'hot_coral',
    name: 'Hot Coral',
    bgClass:
      'social-post-bg-theme social-post-theme-hot_coral bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500',
  },
  {
    id: 'electric_lime',
    name: 'Electric Lime',
    bgClass:
      'social-post-bg-theme social-post-theme-electric_lime bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-600',
  },
  {
    id: 'classic_black',
    name: 'Classic Black',
    bgClass:
      'social-post-bg-theme social-post-theme-classic_black bg-gradient-to-br from-slate-950 via-zinc-900 to-black',
  },
];

export const POST_TEXT_COLORS = [
  { id: '#FFFFFF', name: 'White', color: '#FFFFFF' },
  { id: '#FACC15', name: 'Yellow', color: '#FACC15' },
  { id: '#00F2FE', name: 'Cyan', color: '#00F2FE' },
  { id: '#84CC16', name: 'Lime', color: '#84CC16' },
  { id: '#F43F5E', name: 'Pink', color: '#F43F5E' },
  { id: '#FB923C', name: 'Orange', color: '#FB923C' },
  { id: '#C084FC', name: 'Purple', color: '#C084FC' },
  { id: '#000000', name: 'Black', color: '#000000' },
];

export function PostThemeVectorOverlay({ themeId }: { themeId: string }) {
  if (!themeId || themeId === 'none') return null;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0">
      {themeId === 'sunset_fire' && (
        <svg className="w-full h-full opacity-45" viewBox="0 0 400 240" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="240" r="140" fill="url(#sun_glow)" opacity="0.45" />
          <path d="M-50 180 Q100 120 200 180 T450 160" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.65" strokeDasharray="6 4" />
          <path d="M-20 200 Q120 150 240 210 T480 170" stroke="#FFE4E6" strokeWidth="2" opacity="0.55" />
          <circle cx="80" cy="60" r="3" fill="#FFFFFF" opacity="0.9" />
          <circle cx="320" cy="80" r="4" fill="#FFFFFF" opacity="0.85" />
          <path d="M0 0 L400 240 M400 0 L0 240" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <defs>
            <radialGradient id="sun_glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(200 240) rotate(90) scale(140)">
              <stop stopColor="#FDE047" stopOpacity="0.85" />
              <stop offset="1" stopColor="#F97316" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      )}

      {themeId === 'ocean_deep' && (
        <svg className="w-full h-full opacity-40" viewBox="0 0 400 240" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 40 Q100 80 200 40 T400 40 V240 H0 Z" fill="rgba(0, 242, 254, 0.12)" />
          <path d="M-40 120 Q100 180 240 120 T520 140" stroke="#00F2FE" strokeWidth="2.5" opacity="0.7" strokeDasharray="8 6" />
          <circle cx="300" cy="70" r="35" stroke="rgba(0,242,254,0.4)" strokeWidth="1.5" />
          <circle cx="300" cy="70" r="60" stroke="rgba(0,242,254,0.2)" strokeWidth="1" />
          <path d="M20 20 H380 V220 H20 Z" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
      )}

      {themeId === 'royal_purple' && (
        <svg className="w-full h-full opacity-40" viewBox="0 0 400 240" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g opacity="0.6" stroke="#E9D5FF" strokeWidth="1.2">
            <path d="M200 20 L240 120 L200 220 L160 120 Z" />
            <path d="M100 60 L140 120 L100 180 L60 120 Z" />
            <path d="M300 60 L340 120 L300 180 L260 120 Z" />
          </g>
          <circle cx="200" cy="120" r="70" stroke="rgba(233,213,255,0.3)" strokeWidth="1.5" strokeDasharray="6 4" />
          <path d="M0 0 L400 240 M0 240 L400 0" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        </svg>
      )}

      {themeId === 'emerald_forest' && (
        <svg className="w-full h-full opacity-40" viewBox="0 0 400 240" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-20 220 Q180 40 420 220" stroke="#6EE7B7" strokeWidth="2.5" opacity="0.7" />
          <polygon points="200,30 230,70 200,110 170,70" stroke="#A7F3D0" strokeWidth="1.5" opacity="0.6" fill="rgba(110,231,183,0.12)" />
          <polygon points="80,110 105,140 80,170 55,140" stroke="#6EE7B7" strokeWidth="1.5" opacity="0.5" fill="rgba(110,231,183,0.08)" />
          <polygon points="320,110 345,140 320,170 295,140" stroke="#6EE7B7" strokeWidth="1.5" opacity="0.5" fill="rgba(110,231,183,0.08)" />
          <circle cx="200" cy="70" r="3" fill="#A7F3D0" />
        </svg>
      )}

      {themeId === 'neon_cyber' && (
        <svg className="w-full h-full opacity-45" viewBox="0 0 400 240" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 30 H120 L150 60 H400" stroke="#00F2FE" strokeWidth="2" opacity="0.8" />
          <path d="M400 210 H280 L250 180 H0" stroke="#F0ABFC" strokeWidth="2" opacity="0.8" />
          <circle cx="120" cy="30" r="4" fill="#00F2FE" />
          <circle cx="150" cy="60" r="3" fill="#00F2FE" />
          <circle cx="280" cy="210" r="4" fill="#F0ABFC" />
          <circle cx="250" cy="180" r="3" fill="#F0ABFC" />
          <rect x="175" y="95" width="50" height="50" rx="6" stroke="rgba(0,242,254,0.5)" strokeWidth="1.5" fill="rgba(0,242,254,0.08)" />
        </svg>
      )}

      {themeId === 'midnight_glow' && (
        <svg className="w-full h-full opacity-45" viewBox="0 0 400 240" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g opacity="0.75" fill="#FFFFFF">
            <circle cx="50" cy="40" r="2" />
            <circle cx="180" cy="30" r="2.5" />
            <circle cx="340" cy="50" r="2" />
            <circle cx="90" cy="190" r="3" />
            <circle cx="310" cy="180" r="2.5" />
          </g>
          <path d="M200 50 V70 M190 60 H210" stroke="#C084FC" strokeWidth="1.5" opacity="0.85" />
          <path d="M100 120 V136 M92 128 H108" stroke="#E9D5FF" strokeWidth="1.5" opacity="0.7" />
          <path d="M300 110 V126 M292 118 H308" stroke="#E9D5FF" strokeWidth="1.5" opacity="0.7" />
          <ellipse cx="200" cy="120" rx="140" ry="50" stroke="rgba(192,132,252,0.3)" strokeWidth="1.5" strokeDasharray="6 4" />
        </svg>
      )}

      {themeId === 'gold_luxury' && (
        <svg className="w-full h-full opacity-40" viewBox="0 0 400 240" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g stroke="#FDE047" strokeWidth="1.5" opacity="0.7">
            <path d="M0 0 L40 40 L80 0 L120 40 L160 0 L200 40 L240 0 L280 40 L320 0 L360 40 L400 0" />
            <path d="M0 240 L40 200 L80 240 L120 200 L160 240 L200 200 L240 240 L280 200 L320 240 L360 200 L400 240" />
          </g>
          <rect x="25" y="25" width="350" height="190" rx="12" stroke="rgba(254,240,138,0.3)" strokeWidth="1.5" strokeDasharray="8 6" fill="none" />
        </svg>
      )}

      {themeId === 'passion_rose' && (
        <svg className="w-full h-full opacity-40" viewBox="0 0 400 240" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="120" r="40" stroke="#FFE4E6" strokeWidth="1.5" opacity="0.7" />
          <circle cx="200" cy="120" r="75" stroke="#FFE4E6" strokeWidth="1.5" opacity="0.5" strokeDasharray="6 4" />
          <circle cx="200" cy="120" r="110" stroke="#FFE4E6" strokeWidth="1" opacity="0.3" />
          <path d="M60 40 Q200 -20 340 40 T60 200" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
        </svg>
      )}

      {themeId === 'cosmic_nebula' && (
        <svg className="w-full h-full opacity-45" viewBox="0 0 400 240" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="200" cy="120" rx="160" ry="45" stroke="#7DD3FC" strokeWidth="2" opacity="0.6" transform="rotate(-15 200 120)" />
          <ellipse cx="200" cy="120" rx="100" ry="30" stroke="#C084FC" strokeWidth="1.5" opacity="0.7" transform="rotate(-15 200 120)" />
          <circle cx="200" cy="120" r="18" fill="url(#nebula_core)" opacity="0.8" />
          <path d="M40 30 L80 45 M320 200 L350 215" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
          <defs>
            <radialGradient id="nebula_core" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(200 120) scale(18)">
              <stop stopColor="#E0F2FE" />
              <stop offset="1" stopColor="#38BDF8" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      )}

      {themeId === 'hot_coral' && (
        <svg className="w-full h-full opacity-40" viewBox="0 0 400 240" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="50,40 70,75 30,75" stroke="#FFFFFF" strokeWidth="2" opacity="0.7" />
          <polygon points="340,160 360,195 320,195" stroke="#FFFFFF" strokeWidth="2" opacity="0.7" />
          <path d="M100 190 Q120 170 140 190 T180 190" stroke="#FDE047" strokeWidth="2.5" opacity="0.8" />
          <path d="M220 50 Q240 30 260 50 T300 50" stroke="#FDE047" strokeWidth="2.5" opacity="0.8" />
          <circle cx="330" cy="50" r="6" stroke="#FFFFFF" strokeWidth="2" opacity="0.7" />
          <circle cx="60" cy="180" r="6" stroke="#FFFFFF" strokeWidth="2" opacity="0.7" />
        </svg>
      )}

      {themeId === 'electric_lime' && (
        <svg className="w-full h-full opacity-40" viewBox="0 0 400 240" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <pattern id="dot_matrix" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.5" fill="#BEF264" opacity="0.7" />
          </pattern>
          <rect width="400" height="240" fill="url(#dot_matrix)" />
          <path d="M0 200 L120 140 L280 180 L400 120" stroke="#84CC16" strokeWidth="2" opacity="0.8" />
        </svg>
      )}

      {themeId === 'classic_black' && (
        <svg className="w-full h-full opacity-45" viewBox="0 0 400 240" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <pattern id="hex_carbon" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M12 0 L24 7 L24 21 L12 28 L0 21 L0 7 Z" stroke="rgba(255, 255, 255, 0.16)" strokeWidth="1" fill="none" />
          </pattern>
          <rect width="400" height="240" fill="url(#hex_carbon)" />
          <path d="M-50 0 L450 250" stroke="rgba(255,255,255,0.08)" strokeWidth="30" />
        </svg>
      )}
    </div>
  );
}

export function renderTextWithHashtags(text: string, onHashtagClick?: (tag: string) => void) {
  if (!text) return null;
  const hashtagRegex = /(#[^\s#.,!?:;()"'`\[\]{}<>]+)/g;
  const parts = text.split(hashtagRegex);

  return parts.map((part, index) => {
    if (part.match(/^#[^\s#.,!?:;()"'`\[\]{}<>]+/)) {
      return (
        <span
          key={`hashtag-${index}-${part}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onHashtagClick) {
              onHashtagClick(part);
            }
          }}
          className="font-black text-dragon-cyan hover:text-white hover:underline cursor-pointer transition-colors bg-dragon-cyan/15 hover:bg-dragon-cyan/30 px-1.5 py-0.5 rounded-md mx-0.5 inline-block border border-dragon-cyan/30 shadow-xs select-none"
          title={`Click to filter by ${part}`}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export function ExpandablePostText({
  text,
  hasImage = false,
  onHashtagClick,
  className = 'text-xs text-gray-200 leading-relaxed font-sans',
  textStyle,
  centerText = false,
}: {
  text: string;
  hasImage?: boolean;
  onHashtagClick?: (tag: string) => void;
  className?: string;
  textStyle?: React.CSSProperties;
  centerText?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const maxLines = hasImage ? 3 : 6;
  const maxChars = hasImage ? 180 : 420;

  const lines = text.split('\n');
  const needsTruncationByLines = lines.length > maxLines;
  const needsTruncationByChars = text.length > maxChars;

  const needsTruncation = needsTruncationByLines || needsTruncationByChars;

  if (!needsTruncation || isExpanded) {
    return (
      <div className={className}>
        <p
          className={cn('whitespace-pre-wrap selection:bg-dragon-cyan selection:text-black', centerText && 'text-center')}
          style={textStyle}
        >
          {renderTextWithHashtags(text, onHashtagClick)}
          {needsTruncation && isExpanded && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="text-dragon-cyan hover:text-white font-black hover:underline cursor-pointer ml-2 inline-block text-[11px] select-none"
            >
              See less
            </button>
          )}
        </p>
      </div>
    );
  }

  let displayText = text;
  if (needsTruncationByLines) {
    displayText = lines.slice(0, maxLines).join('\n');
  }
  if (displayText.length > maxChars) {
    displayText = displayText.slice(0, maxChars);
    const lastSpace = displayText.lastIndexOf(' ');
    if (lastSpace > maxChars * 0.6) {
      displayText = displayText.slice(0, lastSpace);
    }
  }

  return (
    <div className={className}>
      <p
        className={cn('whitespace-pre-wrap selection:bg-dragon-cyan selection:text-black', centerText && 'text-center')}
        style={textStyle}
      >
        {renderTextWithHashtags(displayText, onHashtagClick)}
        <span className="text-gray-400">... </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(true);
          }}
          className="text-dragon-cyan hover:text-white font-black hover:underline cursor-pointer ml-1 inline-block bg-dragon-cyan/15 hover:bg-dragon-cyan/30 px-2 py-0.5 rounded text-[11px] border border-dragon-cyan/30 transition-all select-none"
        >
          See more
        </button>
      </p>
    </div>
  );
}
