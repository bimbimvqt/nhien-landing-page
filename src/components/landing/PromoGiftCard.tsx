'use client';

import React, { useState } from 'react';
import { Copy, Gift, Loader2, Lock, Sparkles, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Promotion } from '@/types';
import { isPromotionExpired } from '@/lib/customerEngagement';

type ClaimRow = {
  id: string;
  promotion_id: string;
  code_snapshot: string;
  claimed_at: string;
  redeemed_count?: number;
  remaining_uses?: number;
  redeemed_at?: string | null;
};

interface PromoGiftCardProps {
  promotion: Promotion;
  claim?: ClaimRow;
  isClaimed: boolean;
  canClaim: boolean;
  canUsePromotion: boolean;
  isBusy: boolean;
  onClaim: () => void;
  onCopy: () => void;
}

// Chevron pattern for the premium scratch card cover
const ChevronPattern = () => (
  <svg
    width="100%"
    height="100%"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 z-0"
    aria-hidden="true"
  >
    <defs>
      <pattern
        id="chevron"
        patternUnits="userSpaceOnUse"
        width="20"
        height="20"
        patternTransform="scale(1) rotate(45)"
      >
        <rect
          x="0"
          y="0"
          width="10"
          height="20"
          fill="rgba(255, 255, 255, 0.04)"
          className="fill-white/[0.04]"
        />
        <rect
          x="10"
          y="0"
          width="10"
          height="20"
          fill="rgba(255, 255, 255, 0.08)"
          className="fill-white/[0.08]"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#chevron)" />
  </svg>
);

const formatDiscount = (val: string) => {
  if (!val) return '';
  const trimmed = val.trim();
  
  // If it already has % or currency symbols or BOGO, B1G1 etc.
  if (
    trimmed.includes('%') || 
    trimmed.toLowerCase().includes('k') || 
    trimmed.toLowerCase().includes('đ') || 
    trimmed.toLowerCase().includes('vnd') ||
    trimmed.toLowerCase().includes('bogo') ||
    trimmed.toLowerCase().includes('free')
  ) {
    return trimmed;
  }
  
  // If it is just a pure number
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    if (num <= 100) {
      return `${num}% OFF`;
    } else {
      if (num >= 1000) {
        return `-${num / 1000}k`;
      }
      return `-${num}đ`;
    }
  }
  
  return trimmed;
};

export default function PromoGiftCard({
  promotion,
  claim,
  isClaimed,
  canClaim,
  canUsePromotion,
  isBusy,
  onClaim,
  onCopy,
}: PromoGiftCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expired = isPromotionExpired(promotion);

  const statusLabel = isClaimed
    ? 'Đã nhận'
    : expired
    ? 'Đã hết hạn'
    : canClaim && canUsePromotion
    ? 'Sẵn sàng nhận'
    : !canUsePromotion
    ? 'Chưa bắt đầu'
    : 'Chưa đủ điều kiện';

  return (
    <div className="font-sans antialiased text-sera-ink w-full flex items-center justify-center p-1.5">
      <div className={cn(
        "bg-sera-deep rounded-[2rem] p-5 sm:p-6 shadow-[0_16px_40px_rgba(39,32,28,0.45)] relative max-w-[320px] w-full border border-sera-ink/20 overflow-hidden group transition-all duration-300",
        expired && "opacity-60 grayscale-[30%] hover:grayscale-0 hover:opacity-80"
      )}>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-sera-ember/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-sera-sage/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Notch slot styling - smaller */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 z-10">
          <div
            className="w-full h-full bg-sera-surface rounded-b-xl border-x border-b border-sera-ink/10"
            style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }}
          />
        </div>

        {/* Header Section - more compact */}
        <div className="text-center mb-4 pt-2">
          <div className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border mb-2.5 text-[9px] font-black uppercase tracking-widest",
            isClaimed && "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
            expired && "bg-rose-500/10 border-rose-500/20 text-rose-500",
            !isClaimed && !expired && canClaim && canUsePromotion && "bg-sera-ember/10 border-sera-ember/20 text-sera-ember animate-pulse",
            !isClaimed && !expired && (!canClaim || !canUsePromotion) && "bg-white/5 border-white/10 text-white/45"
          )}>
            {expired ? <Clock className="h-2.5 w-2.5" /> : <Sparkles className="h-2.5 w-2.5 animate-pulse" />}
            {statusLabel}
          </div>
          <h3 className="text-white text-base font-black tracking-tight leading-snug min-h-[2.5rem] flex items-center justify-center px-2">
            {promotion.name}
          </h3>
          <p className="text-white/50 text-[10px] mt-0.5 font-semibold">
            {promotion.end_date ? `Hết hạn: ${promotion.end_date}` : 'Không thời hạn'}
          </p>
        </div>

        {/* Gift Card Glass Container - sleeker */}
        <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-3 border border-white/10 shadow-inner relative z-10">
          <div className="flex justify-between items-center text-white mb-2.5">
            <span className="font-black text-[10px] uppercase tracking-wider text-white/40">Nhiên CàFe</span>
            <span className={cn("font-black text-base transition-colors", expired ? "text-white/30" : "text-sera-ember")}>
              {formatDiscount(promotion.discount)}
            </span>
          </div>

          {/* Interactive Code Container - smaller min-height */}
          <div className="bg-black/25 rounded-lg relative flex items-center justify-between overflow-hidden transition-all duration-300 ring-1 ring-transparent focus-within:ring-sera-ember/50 min-h-[44px]">
            {/* The actual revealed code or masked placeholders for security */}
            <div className={cn(
              "p-2.5 pl-3 font-mono text-base font-black tracking-[0.2em] w-full z-10 select-all transition-colors",
              isClaimed && claim ? "text-white" : "text-white/20",
              expired && "text-white/10"
            )}>
              {isClaimed && claim ? claim.code_snapshot : expired ? 'EXPIRED' : '••••••••'}
            </div>

            {/* The "Scratch Cover" Overlay styling */}
            {!isClaimed && (
              <div
                className="absolute inset-y-0 right-0 w-3/5 pointer-events-none transition-transform duration-700 ease-out origin-right z-20 flex items-center justify-end pr-3"
              >
                {/* Pattern Background */}
                <ChevronPattern />
                
                {/* Gradient Mask Cover overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to left, #2b231f 0%, rgba(43, 35, 31, 0.95) 60%, transparent 100%)',
                    clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)',
                  }}
                />
                
                {/* Skew Shadow separator line */}
                <div
                  className="absolute inset-y-0 right-[calc(60%-1px)] w-6 h-full bg-transparent"
                  style={{
                    boxShadow: '-4px 0 10px -2px rgba(0,0,0,0.6)',
                    transform: 'skewX(-15deg)',
                    transformOrigin: 'right',
                  }}
                />
                
                {/* Gift icon floating over the overlay cover */}
                <div className="relative z-30 text-white/50">
                  {expired ? <Clock className="h-4 w-4 text-rose-500/70" /> : <Gift className="h-4 w-4 text-sera-ember animate-bounce" />}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Claim/Copy Action Button - tighter spacing */}
        <div className="mt-4">
          {isClaimed ? (
            <button
              onClick={handleCopy}
              className="bg-white/10 hover:bg-white/15 text-white font-black py-2.5 px-3 rounded-lg w-full flex items-center justify-center gap-1.5 border border-white/10 text-xs transition-all duration-300"
            >
              {copied ? 'Đã copy!' : 'Copy mã ưu đãi'}
              <Copy className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={onClaim}
              disabled={isBusy || !canUsePromotion || expired}
              className={cn(
                'font-black py-2.5 px-3 rounded-lg w-full flex items-center justify-center gap-1.5 text-xs transition-all duration-300',
                canClaim && canUsePromotion && !expired
                  ? 'bg-sera-ember hover:bg-sera-ember/90 text-white shadow-[0_0_15px_rgba(235,94,40,0.25)]'
                  : 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed shadow-none'
              )}
            >
              {isBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
              ) : expired ? (
                <Clock className="h-3.5 w-3.5" />
              ) : canClaim ? (
                <Gift className="h-3.5 w-3.5" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              {expired ? 'Mã đã hết hạn' : canClaim ? 'Nhận mã ngay' : 'Mở khoá mã'}
            </button>
          )}
        </div>

        {/* Bottom Helper Info text */}
        <p className="text-white/35 text-[9px] font-semibold text-center mt-3 leading-normal">
          {isClaimed && claim
            ? `Bạn còn ${claim.remaining_uses ?? promotion.max_redemptions_per_user ?? 1} lượt sử dụng`
            : expired
            ? 'Mã khuyến mãi đã kết thúc sử dụng.'
            : 'Làm nhiệm vụ phía trên để nhận mã!'}
        </p>
      </div>
    </div>
  );
}
