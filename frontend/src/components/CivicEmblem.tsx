import React from 'react';

interface CivicEmblemProps {
  className?: string;
  size?: number;
}

export const CivicEmblem: React.FC<CivicEmblemProps> = ({ className = '', size = 44 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="የንፋስ ስልክ ላፍቶ ክፍለ ከተማ አርማ / Sub-City Seal"
    >
      {/* Outer Golden Ring */}
      <circle cx="50" cy="50" r="47" stroke="#EAB308" strokeWidth="4" fill="#1E3A8A" />
      <circle cx="50" cy="50" r="43" stroke="#F8FAFC" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Internal Sunburst Rays */}
      <path
        d="M50 14 L50 22 M50 78 L50 86 M14 50 L22 50 M78 50 L86 50 M25 25 L31 31 M69 69 L75 75 M75 25 L69 31 M25 75 L31 69"
        stroke="#FACC15"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Inner Central Shield */}
      <path
        d="M50 25 C68 25 74 34 74 52 C74 68 50 78 50 78 C50 78 26 68 26 52 C26 34 32 25 50 25 Z"
        fill="#0284C7"
        stroke="#EAB308"
        strokeWidth="2"
      />

      {/* Ethiopian Tricolor Bands inside Shield */}
      <path d="M30 42 C36 40 44 39 50 39 C56 39 64 40 70 42 L68 47 C62 45 56 44 50 44 C44 44 38 45 32 47 Z" fill="#16A34A" />
      <path d="M32 47 C38 45 44 44 50 44 C56 44 62 45 68 47 L66 52 C61 50 55 49 50 49 C45 49 39 50 34 52 Z" fill="#EAB308" />
      <path d="M34 52 C39 50 45 49 50 49 C55 49 61 50 66 52 L64 57 C59 55 54 54 50 54 C46 54 41 55 36 57 Z" fill="#DC2626" />

      {/* Central Star of Unity */}
      <polygon
        points="50,42 52.5,48 58.5,48.5 54,52.5 55.5,58.5 50,55 44.5,58.5 46,52.5 41.5,48.5 47.5,48"
        fill="#FACC15"
        stroke="#1E3A8A"
        strokeWidth="0.8"
      />

      {/* Base Laurel Leaves */}
      <path
        d="M32 64 C38 71 44 74 50 75 C56 74 62 71 68 64"
        stroke="#FACC15"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
