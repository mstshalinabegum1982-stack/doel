import React from 'react';

interface DoelBirdLogoProps {
  className?: string;
  size?: number | string;
  showCircleBackground?: boolean;
  accentColor?: string;
}

/**
 * Doel Bird (Oriental Magpie-Robin / দোয়েল পাখি) Vector Logo Component
 * National Bird of Bangladesh - Black and white glossy plumage with cocked tail pose
 */
export const DoelBirdLogo: React.FC<DoelBirdLogoProps> = ({
  className = "",
  size = 48,
  showCircleBackground = true,
  accentColor = "#00f2ff"
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Subtle background glow gradient */}
        <radialGradient id="doelBgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
        </radialGradient>

        {/* Feather sheen & gradients */}
        <linearGradient id="doelBlackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="40%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        <linearGradient id="doelWingWhite" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>

        <linearGradient id="doelBellyWhite" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f1f5f9" />
        </linearGradient>

        <linearGradient id="beakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        <linearGradient id="perchBranch" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#88522e" />
          <stop offset="50%" stopColor="#b4713d" />
          <stop offset="100%" stopColor="#683d20" />
        </linearGradient>

        <filter id="doelShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Optional Outer Emblem Badge */}
      {showCircleBackground && (
        <g filter="url(#doelShadow)">
          {/* Outer Ring */}
          <circle cx="256" cy="256" r="240" fill="url(#doelBgGlow)" stroke={accentColor} strokeWidth="4" strokeOpacity="0.4" />
          <circle cx="256" cy="256" r="228" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.1" />
        </g>
      )}

      {/* --- THE DOEL BIRD VECTOR (Oriental Magpie-Robin) --- */}
      <g id="doel-bird-vector">
        {/* Branch / Perch */}
        <path
          d="M 60 380 Q 200 370 450 340 L 460 355 Q 200 388 55 398 Z"
          fill="url(#perchBranch)"
          stroke="#452410"
          strokeWidth="1.5"
        />

        {/* Legs and Feet */}
        <path
          d="M 215 320 L 210 375 M 210 375 L 195 380 M 210 375 L 210 382 M 210 375 L 222 378
             M 265 315 L 270 370 M 270 370 L 255 375 M 270 370 L 270 377 M 270 370 L 282 373"
          stroke="#334155"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Upright Cocked Tail - Outer Black Feathers */}
        <path
          d="M 185 285 L 75 140 C 65 125 70 115 85 120 L 110 135 L 205 255 Z"
          fill="url(#doelBlackGradient)"
          stroke="#020617"
          strokeWidth="2"
        />

        {/* Tail Inner White Edges / Highlights */}
        <path
          d="M 80 135 L 140 220 L 132 225 L 73 140 Z"
          fill="#ffffff"
          opacity="0.9"
        />

        {/* Lower Body & Belly (White) */}
        <path
          d="M 205 260 C 210 290 230 325 285 325 C 335 325 355 285 350 240 C 330 240 260 250 205 260 Z"
          fill="url(#doelBellyWhite)"
        />

        {/* Upper Body, Hood, Head & Back (Glossy Black) */}
        <path
          d="M 195 260 C 210 200 245 160 310 140 C 350 125 385 145 395 180 C 390 225 340 255 285 260 C 235 265 205 260 195 260 Z"
          fill="url(#doelBlackGradient)"
        />

        {/* Head & Neck Black Hood */}
        <path
          d="M 285 250 C 315 250 360 235 380 200 C 395 170 380 140 330 140 C 280 140 250 170 240 210 C 255 240 270 250 285 250 Z"
          fill="url(#doelBlackGradient)"
        />

        {/* White Wing Bar (Distinctive Doel Wing Stripe) */}
        <path
          d="M 215 255 Q 260 215 325 205 Q 280 235 235 265 Z"
          fill="url(#doelWingWhite)"
          stroke="#e2e8f0"
          strokeWidth="1"
        />

        {/* Wing Feather Layer (Black with White Margin) */}
        <path
          d="M 195 260 Q 235 240 290 230 C 260 280 220 285 195 260 Z"
          fill="url(#doelBlackGradient)"
          stroke="#000000"
          strokeWidth="1.5"
        />

        {/* Sharp Slender Beak (Pointing right forward) */}
        <path
          d="M 370 156 L 435 152 C 442 151 440 158 432 161 L 368 170 Z"
          fill="url(#beakGradient)"
        />

        {/* Eye - Outer Dark Ring & Pupil */}
        <circle cx="345" cy="162" r="11" fill="#020617" stroke="#334155" strokeWidth="2" />
        <circle cx="345" cy="162" r="7" fill="#0f172a" />
        {/* Eye Catchlight Reflection */}
        <circle cx="342" cy="159" r="3" fill="#ffffff" />
        <circle cx="347" cy="164" r="1" fill="#ffffff" opacity="0.7" />

        {/* Subtle Chin/Throat Definition */}
        <path
          d="M 345 205 Q 365 195 375 180"
          fill="none"
          stroke="#1e293b"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

export default DoelBirdLogo;
