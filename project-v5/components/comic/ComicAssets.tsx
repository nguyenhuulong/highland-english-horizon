"use client";

import React from "react";

export const ETHNIC_PALETTE: Record<string, { top: string; pattern: string; headwear: string }> = {
  kho: { top: "#C0392B", pattern: "#F0AD4E", headwear: "#2C3E50" },
  ma: { top: "#27AE60", pattern: "#A9DFBF", headwear: "#5D4037" },
  mnong: { top: "#8E44AD", pattern: "#D7BDE2", headwear: "#4A235A" },
  hmong: { top: "#2980B9", pattern: "#F9CA24", headwear: "#C0392B" },
  tay: { top: "#16A085", pattern: "#A2D9CE", headwear: "#3E2723" },
  nung: { top: "#5D4037", pattern: "#FFCCBC", headwear: "#1B2631" },
  default: { top: "#607D8B", pattern: "#CFD8DC", headwear: "#455A64" },
};

const SCENE_TO_BG: Record<string, string> = {
  morning_village: "village",
  costume: "village",
  harvest: "harvest",
  drum: "festival",
  dance: "festival",
  forest_entrance: "forest",
  big_tree: "forest",
  birds: "forest",
  butterfly: "forest",
  market_morning: "market",
  cloth_stall: "market",
  vegetable_stall: "market",
  bargain: "market",
  paying: "market",
};

export function resolveBackground(sceneKey: string): string {
  return SCENE_TO_BG[sceneKey] || "village";
}

type BgType = "village" | "forest" | "festival" | "market" | "harvest" | string;

export function Background({ type }: { type: BgType }) {
  const bg = SCENE_TO_BG[type] || type;

  if (bg === "forest") {
    return (
      <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
        <defs>
          <linearGradient id="skyF" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a3a2a" />
            <stop offset="100%" stopColor="#2d6a4f" />
          </linearGradient>
        </defs>
        <rect width="400" height="280" fill="url(#skyF)" />
        <rect y="200" width="400" height="80" fill="#1b4332" />
        <polygon points="60,200 100,100 140,200" fill="#2d6a4f" />
        <polygon points="80,200 120,80 160,200" fill="#40916c" />
        <polygon points="180,200 220,90 260,200" fill="#2d6a4f" />
        <polygon points="200,200 240,70 280,200" fill="#52b788" />
        <polygon points="280,200 320,100 360,200" fill="#40916c" />
        <ellipse cx="200" cy="245" rx="180" ry="12" fill="#081c15" opacity="0.4" />
      </svg>
    );
  }

  if (bg === "festival") {
    return (
      <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
        <defs>
          <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d0d2b" />
            <stop offset="100%" stopColor="#1a1a4e" />
          </linearGradient>
        </defs>
        <rect width="400" height="280" fill="url(#nightSky)" />
        <circle cx="60" cy="40" r="2" fill="white" opacity="0.8" />
        <circle cx="150" cy="20" r="1.5" fill="white" opacity="0.6" />
        <circle cx="300" cy="35" r="2" fill="white" opacity="0.7" />
        <circle cx="350" cy="15" r="1.5" fill="white" opacity="0.5" />
        <ellipse cx="200" cy="260" rx="60" ry="25" fill="#e9c46a" opacity="0.9" />
        <polygon points="180,240 200,180 220,240" fill="#f4a261" />
        <polygon points="195,240 200,200 205,240" fill="#e76f51" />
        <line x1="50" y1="60" x2="350" y2="60" stroke="#adb5bd" strokeWidth="1.5" />
        {[60, 100, 140, 180, 220, 260, 300, 340].map((x, i) => (
          <polygon key={i} points={`${x},55 ${x + 12},65 ${x + 6},55`}
            fill={["#e63946", "#457b9d", "#2a9d8f", "#e9c46a", "#f4a261", "#e63946", "#457b9d", "#2a9d8f"][i]} />
        ))}
        <rect y="240" width="400" height="40" fill="#3d405b" />
      </svg>
    );
  }

  if (bg === "market") {
    return (
      <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
        <defs>
          <linearGradient id="skyM" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffd166" />
            <stop offset="100%" stopColor="#ffb347" />
          </linearGradient>
        </defs>
        <rect width="400" height="280" fill="url(#skyM)" />
        <rect y="220" width="400" height="60" fill="#c8a96e" />
        <polygon points="20,180 130,120 130,180" fill="#e63946" />
        <rect x="20" y="180" width="110" height="50" fill="#f1faee" />
        <polygon points="200,170 310,110 310,170" fill="#457b9d" />
        <rect x="200" y="170" width="110" height="50" fill="#f1faee" />
        <rect x="35" y="185" width="25" height="20" fill="#2a9d8f" />
        <rect x="70" y="185" width="25" height="20" fill="#e9c46a" />
        <rect x="215" y="175" width="25" height="20" fill="#f4a261" />
        <rect x="255" y="175" width="25" height="20" fill="#e63946" />
        <ellipse cx="200" cy="268" rx="190" ry="5" fill="rgba(0,0,0,0.1)" />
      </svg>
    );
  }

  if (bg === "harvest") {
    return (
      <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
        <defs>
          <linearGradient id="skyH" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffb347" />
            <stop offset="100%" stopColor="#ffd700" />
          </linearGradient>
        </defs>
        <rect width="400" height="280" fill="url(#skyH)" />
        <ellipse cx="70" cy="60" rx="35" ry="35" fill="#fffde7" opacity="0.9" />
        <rect y="200" width="400" height="80" fill="#a0522d" />
        {[10, 30, 50, 70, 90, 110, 130, 150, 170, 190, 210, 230, 250, 270, 290, 310, 330, 350, 370].map((x, i) => (
          <g key={i}>
            <line x1={x + 10} y1="200" x2={x + 10} y2="160" stroke="#c8a000" strokeWidth="2" />
            <ellipse cx={x + 10} cy="155" rx="5" ry="10" fill="#f0c040" />
          </g>
        ))}
        <ellipse cx="200" cy="210" rx="190" ry="6" fill="rgba(0,0,0,0.08)" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id="skyV" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#87ceeb" />
          <stop offset="60%" stopColor="#e0f4ff" />
          <stop offset="100%" stopColor="#c8e6c9" />
        </linearGradient>
      </defs>
      <rect width="400" height="280" fill="url(#skyV)" />
      <ellipse cx="80" cy="70" rx="40" ry="22" fill="white" opacity="0.75" />
      <ellipse cx="110" cy="62" rx="30" ry="18" fill="white" opacity="0.75" />
      <ellipse cx="300" cy="55" rx="45" ry="24" fill="white" opacity="0.6" />
      <ellipse cx="330" cy="48" rx="30" ry="18" fill="white" opacity="0.6" />
      <polygon points="50,220 100,140 150,220" fill="#795548" />
      <polygon points="80,220 100,160 120,220" fill="#6d4c41" />
      <rect x="85" y="185" width="30" height="35" fill="#a1887f" />
      <rect x="96" y="196" width="8" height="24" fill="#6d4c41" />
      <polygon points="55,145 100,120 145,145" fill="#e8643a" />
      <rect y="220" width="400" height="60" fill="#66bb6a" />
      <polygon points="240,220 290,150 340,220" fill="#795548" />
      <polygon points="265,220 290,170 315,220" fill="#6d4c41" />
      <rect x="275" y="190" width="30" height="30" fill="#a1887f" />
      <polygon points="245,155 290,132 335,155" fill="#e8643a" />
      <ellipse cx="200" cy="230" rx="190" ry="7" fill="rgba(0,0,0,0.08)" />
    </svg>
  );
}

interface CharacterProps {
  ethnicGroup?: string;
  role?: "child" | "adult" | "elder";
  position?: "left" | "center" | "right";
  speaking?: boolean;
  gender?: "male" | "female";
}

export function Character({ ethnicGroup, role = "child", position = "center", speaking = false, gender = "female" }: CharacterProps) {
  const pal = ETHNIC_PALETTE[ethnicGroup?.toLowerCase().replace(/[^a-z]/g, "") ?? ""] ?? ETHNIC_PALETTE.default;
  const scale = role === "child" ? 0.75 : role === "elder" ? 0.88 : 1;
  const x = position === "left" ? 80 : position === "right" ? 280 : 180;
  const y = 280;
  const h = 120 * scale;
  const headR = 22 * scale;
  const bodyW = 36 * scale;
  const bodyH = 55 * scale;
  const legH = 30 * scale;
  const baseY = y - legH - bodyH - headR * 2;
  const headY = baseY;
  const bodyY = headY + headR * 2 + 2;

  const skinColor = "#c68642";
  const hairColor = role === "elder" ? "#b0bec5" : "#1a1a1a";

  return (
    <svg
      viewBox={`0 0 400 280`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      {speaking && (
        <ellipse cx={x + headR + 10} cy={headY - 15} rx="12" ry="8" fill="white" stroke="#ccc" strokeWidth="1.5" opacity="0.85" />
      )}
      <ellipse cx={x} cy={headY + headR} rx={headR} ry={headR} fill={skinColor} />
      <rect x={x - 8 * scale} y={headY} width={16 * scale} height={8 * scale} fill={hairColor} rx={3} />
      {gender === "female" && (
        <>
          <line x1={x - headR + 4} y1={headY + headR * 0.5} x2={x - headR - 2} y2={headY + headR * 2} stroke={hairColor} strokeWidth={3 * scale} strokeLinecap="round" />
          <line x1={x + headR - 4} y1={headY + headR * 0.5} x2={x + headR + 2} y2={headY + headR * 2} stroke={hairColor} strokeWidth={3 * scale} strokeLinecap="round" />
        </>
      )}
      {role === "elder" && (
        <ellipse cx={x} cy={headY + headR * 1.7} rx={8 * scale} ry={4 * scale} fill="#e0e0e0" opacity={0.7} />
      )}
      <rect x={x - bodyW / 2} y={bodyY} width={bodyW} height={bodyH} fill={pal.top} rx={6} />
      <rect x={x - bodyW / 2 + 4} y={bodyY + 6} width={bodyW - 8} height={4} fill={pal.pattern} rx={2} />
      <rect x={x - bodyW / 2 + 4} y={bodyY + 14} width={bodyW - 8} height={4} fill={pal.pattern} rx={2} />
      {role === "child" ? (
        <>
          <rect x={x - 14 * scale} y={bodyY + bodyH - 2} width={12 * scale} height={legH} fill={pal.top} rx={4} />
          <rect x={x + 2 * scale} y={bodyY + bodyH - 2} width={12 * scale} height={legH} fill={pal.top} rx={4} />
        </>
      ) : (
        <>
          <rect x={x - 16 * scale} y={bodyY + bodyH - 2} width={14 * scale} height={legH} fill={pal.headwear} rx={4} />
          <rect x={x + 2 * scale} y={bodyY + bodyH - 2} width={14 * scale} height={legH} fill={pal.headwear} rx={4} />
        </>
      )}
    </svg>
  );
}
