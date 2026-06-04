"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { MemberTiersSettings } from "@/types";
import { DEFAULT_MEMBER_TIERS } from "@/types";
import { Lock, Gift, Check, Star } from "lucide-react";

// ──────────────────────────────────────────────
//  Tier configuration
// ──────────────────────────────────────────────
const TIER_CONFIG = {
  silver: {
    key: "silver" as const,
    label: "Bạc",
    emoji: "🥈",
    gradientFrom: "#94a3b8", // Slate 400
    gradientTo: "#cbd5e1", // Slate 300
    accentLight: "rgba(148,163,184,0.1)",
    accentBorder: "rgba(148,163,184,0.3)",
    textClass: "text-slate-300",
    bgAccent: "bg-slate-400/10",
    borderAccent: "border-slate-400/20",
    sparkColor: "#94a3b8",
  },
  gold: {
    key: "gold" as const,
    label: "Vàng",
    emoji: "🥇",
    gradientFrom: "#fbbf24", // Amber 400
    gradientTo: "#fcd34d", // Amber 300
    accentLight: "rgba(251,191,36,0.1)",
    accentBorder: "rgba(251,191,36,0.4)",
    textClass: "text-amber-400",
    bgAccent: "bg-amber-400/10",
    borderAccent: "border-amber-400/25",
    sparkColor: "#fbbf24",
  },
  platinum: {
    key: "platinum" as const,
    label: "Bạch Kim",
    emoji: "💎",
    gradientFrom: "#a78bfa", // Purple 400
    gradientTo: "#f472b6", // Pink 400
    accentLight: "rgba(167,139,250,0.1)",
    accentBorder: "rgba(167,139,250,0.4)",
    textClass: "text-purple-400",
    bgAccent: "bg-purple-400/10",
    borderAccent: "border-purple-400/25",
    sparkColor: "#a78bfa",
  },
} as const;

type TierKey = keyof typeof TIER_CONFIG;
const TIER_ORDER: TierKey[] = ["silver", "gold", "platinum"];

function getActiveTierKey(
  points: number,
  tiers: MemberTiersSettings,
): TierKey {
  if (points >= tiers.platinum.points_threshold) return "platinum";
  if (points >= tiers.gold.points_threshold) return "gold";
  return "silver";
}

// ──────────────────────────────────────────────
//  Tier Icon SVG
// ──────────────────────────────────────────────
function TierIconSvg({
  tierKey,
  size = 28,
  isActive = false,
}: {
  tierKey: TierKey;
  size?: number;
  isActive?: boolean;
}) {
  const isPlatinum = tierKey === "platinum";
  const isGold = tierKey === "gold";

  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {isPlatinum && (
        <defs>
          <linearGradient id={`plat-g-${isActive}`} x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a78bfa" />
            <stop offset="0.5" stopColor="#ec4899" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      )}
      {isGold && (
        <defs>
          <linearGradient id={`gold-g-${isActive}`} x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fbbf24" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M14 2.5L10.5 9.5H3.5L9.5 14l-2.5 8L14 18l7 4-2.5-8 6-4.5h-7L14 2.5z"
        fill={isPlatinum ? `url(#plat-g-${isActive})` : isGold ? `url(#gold-g-${isActive})` : "currentColor"}
        fillOpacity={isActive ? (isPlatinum ? "0.6" : isGold ? "0.6" : "0.4") : "0.1"}
        stroke={isPlatinum ? `url(#plat-g-${isActive})` : isGold ? `url(#gold-g-${isActive})` : "currentColor"}
        strokeWidth="1.5"
        strokeLinejoin="round"
        className={!isPlatinum && !isGold ? "text-slate-400" : ""}
      />
      {isPlatinum && <circle cx="14" cy="13" r="2.5" fill={`url(#plat-g-${isActive})`} fillOpacity={isActive ? "1" : "0.5"} />}
    </svg>
  );
}

// ──────────────────────────────────────────────
//  Main component
// ──────────────────────────────────────────────
interface MemberTierCardProps {
  points: number;
  stamps: number;
  tier: string;
  memberTiers?: MemberTiersSettings | null;
}

export function MemberTierCard({
  points,
  stamps,
  memberTiers,
}: MemberTierCardProps) {
  const tiers = memberTiers ?? DEFAULT_MEMBER_TIERS;
  const currentKey = getActiveTierKey(points, tiers);
  const cfg = TIER_CONFIG[currentKey];

  // Progress to next tier calculations
  let nextKey: TierKey | null = null;
  let progressPct = 100;
  let pointsLeft = 0;

  if (currentKey === "silver") {
    nextKey = "gold";
    const to = tiers.gold.points_threshold;
    progressPct = Math.min(100, Math.max(0, (points / to) * 100));
    pointsLeft = Math.max(0, to - points);
  } else if (currentKey === "gold") {
    nextKey = "platinum";
    const from = tiers.gold.points_threshold;
    const to = tiers.platinum.points_threshold;
    const range = to - from;
    progressPct = Math.min(100, Math.max(0, ((points - from) / range) * 100));
    pointsLeft = Math.max(0, to - points);
  }

  return (
    <div className="relative w-full overflow-hidden rounded-[24px] bg-[#1A1614] border border-white/5 shadow-2xl">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-[80px] opacity-40 transition-colors duration-700"
        style={{ backgroundColor: cfg.gradientFrom }}
      />

      {/* ── Header ─────────────────────── */}
      <div className="relative p-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-white/40" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
                Thành viên Nhien
              </p>
            </div>
            <h2 className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-medium text-white/80">Hạng</span>
              <span
                className="text-3xl font-black tracking-tight drop-shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {cfg.label}
              </span>
            </h2>
          </div>

          <div className="text-right flex flex-col items-end">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-1">
              Điểm tích lũy
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-white tabular-nums">
                {points.toLocaleString("vi-VN")}
              </span>
              <span className="text-sm font-medium text-white/50">pt</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Unified Progress Bar ─────────────────────── */}
      <div className="relative px-6 py-4">
        <div className="relative">
          {/* Background track */}
          <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full bg-white/10" />
          
          {/* Active progress track */}
          <div
            className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${currentKey === "silver" ? progressPct / 2 : currentKey === "gold" ? 50 + progressPct / 2 : 100}%`,
              background: `linear-gradient(90deg, ${TIER_CONFIG.silver.gradientFrom}, ${cfg.gradientTo})`,
              boxShadow: `0 0 10px ${cfg.sparkColor}80`,
            }}
          />

          {/* Tier nodes */}
          <div className="relative flex justify-between items-center z-10">
            {TIER_ORDER.map((key, idx) => {
              const c = TIER_CONFIG[key];
              const threshold = key === "silver" ? tiers.silver.points_threshold : key === "gold" ? tiers.gold.points_threshold : tiers.platinum.points_threshold;
              const isUnlocked = points >= threshold;
              const isCurrent = key === currentKey;
              
              return (
                <div key={key} className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500 bg-[#1A1614]",
                      isCurrent ? "scale-125 z-20 shadow-lg" : isUnlocked ? "scale-100" : "scale-90 opacity-50 border-white/10"
                    )}
                    style={{
                      borderColor: isCurrent || isUnlocked ? c.gradientFrom : undefined,
                      boxShadow: isCurrent ? `0 0 20px -2px ${c.sparkColor}60` : undefined,
                    }}
                  >
                    <TierIconSvg tierKey={key} size={20} isActive={isUnlocked} />
                    
                    {/* Current ping */}
                    {isCurrent && (
                      <div
                        className="absolute inset-0 rounded-full animate-ping opacity-20"
                        style={{ backgroundColor: c.gradientFrom }}
                      />
                    )}
                  </div>
                  
                  <div className={cn("mt-3 text-center transition-all", isCurrent ? "scale-110" : "")}>
                    <p className={cn("text-[11px] font-bold uppercase tracking-wider", isUnlocked ? c.textClass : "text-white/40")}>
                      {c.label}
                    </p>
                    <p className={cn("text-[10px] mt-0.5", isUnlocked ? "text-white/70" : "text-white/30")}>
                      {threshold}đ
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Progress text */}
        <div className="mt-6 flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
          {nextKey ? (
            <>
              <p className="text-sm font-medium text-white/70">
                Còn <span className="font-bold text-white">{pointsLeft} điểm</span> nữa để lên hạng <span className={cn("font-bold", TIER_CONFIG[nextKey].textClass)}>{TIER_CONFIG[nextKey].label}</span>
              </p>
              <span className="text-xs font-bold px-2 py-1 rounded-md bg-white/10 text-white/90">
                {Math.round(progressPct)}%
              </span>
            </>
          ) : (
            <p className="text-sm font-medium text-white/90 flex items-center gap-2">
              <span className="text-xl">👑</span> Bạn đã đạt hạng cao nhất!
            </p>
          )}
        </div>
      </div>

      {/* ── Benefits & Stamps ─────────────────── */}
      <div className="relative px-6 py-6 bg-gradient-to-b from-white/5 to-transparent border-t border-white/5">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white/50">
          Quyền lợi của bạn
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {TIER_ORDER.map((key) => {
            const c = TIER_CONFIG[key];
            const config = key === "silver" ? tiers.silver : key === "gold" ? tiers.gold : tiers.platinum;
            const threshold = key === "silver" ? tiers.silver.points_threshold : key === "gold" ? tiers.gold.points_threshold : tiers.platinum.points_threshold;
            const isUnlocked = points >= threshold;
            const isCurrent = key === currentKey;
            
            const benefitText = config.discount_percent > 0 && config.discount_label
              ? config.discount_label
              : key === "silver" ? "Tích điểm cơ bản" : "Chưa cấu hình";

            return (
              <div
                key={key}
                className={cn(
                  "relative flex flex-row md:flex-col items-center md:items-start gap-3 p-3.5 rounded-2xl border transition-all duration-300",
                  isUnlocked ? "bg-white/5 border-white/10" : "bg-white/5 border-transparent opacity-40 grayscale"
                )}
              >
                {isCurrent && (
                  <div
                    className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
                    style={{ background: `linear-gradient(135deg, ${c.gradientFrom}, transparent)` }}
                  />
                )}
                
                <div className={cn("flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl", isUnlocked ? "bg-white/10" : "bg-white/5")}>
                   {isUnlocked ? <Check className={cn("w-5 h-5", c.textClass)} /> : <Lock className="w-4 h-4 text-white/40" />}
                </div>
                
                <div>
                  <p className={cn("text-[11px] font-bold uppercase tracking-wider mb-0.5", isUnlocked ? c.textClass : "text-white/60")}>
                    {c.label}
                  </p>
                  <p className="text-sm font-medium text-white/90">
                    {benefitText}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Stamp Tracker ─────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#fbbf24]" />
              <h3 className="text-sm font-bold text-white">Thẻ tích điểm (Stamp)</h3>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-white">{stamps}</span>
              <span className="text-white/50 text-xs">/8</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center gap-1.5 sm:gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="relative flex items-center justify-center flex-1 aspect-square max-w-[40px]"
              >
                {/* Background circle */}
                <div className={cn(
                  "absolute inset-0 rounded-full border-2 transition-all duration-500",
                  i < stamps ? "border-transparent bg-white/10" : "border-white/10 border-dashed"
                )} />
                
                {/* Filled indicator */}
                {i < stamps && (
                  <div 
                    className="absolute inset-1 rounded-full animate-in zoom-in duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
                      boxShadow: `0 2px 10px ${cfg.sparkColor}50`
                    }}
                  />
                )}
                
                {/* Icon inside */}
                {i < stamps && (
                  <Star className="w-3.5 h-3.5 text-[#1A1614] relative z-10 fill-current" />
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[11px] font-medium text-white/50">
            Tích đủ 8 stamp để đổi 1 món đồ uống miễn phí nhé!
          </p>
        </div>
      </div>
    </div>
  );
}
