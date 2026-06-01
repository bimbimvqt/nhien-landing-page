'use client';

import type { User } from '@supabase/supabase-js';
import {
  CheckCircle2,
  Copy,
  Gift,
  Loader2,
  Lock,
  Share2,
  Sparkles,
  TicketPercent,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { SeraBadge } from '@/components/sera/badge';
import { SeraButton, SeraLinkButton } from '@/components/sera/button';
import { SeraSectionHeading } from '@/components/sera/section-heading';
import { fetchActivePromotions } from '@/lib/backendApi';
import {
  REWARD_TASKS,
  getPromotionStatus,
  isPromotionClaimable,
  type RewardTask,
  type RewardTaskKey,
} from '@/lib/customerEngagement';
import { getUserDisplayName } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import type { Promotion, StoreSettings } from '@/types';

type ClaimRow = {
  id: string;
  promotion_id: string;
  code_snapshot: string;
  claimed_at: string;
  redeemed_count?: number;
  remaining_uses?: number;
  redeemed_at?: string | null;
};

type PromotionsProps = {
  settings: StoreSettings;
};

function openLoginDialog() {
  window.dispatchEvent(new Event('nhien:open-login'));
}

export default function Promotions({ settings }: PromotionsProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [completedTaskKeys, setCompletedTaskKeys] = useState<RewardTaskKey[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    fetchActivePromotions(3)
      .then((data) => {
        if (!mounted) {
          return;
        }

        setPromotions(data || []);
        setLoading(false);
      })
      .catch((error: Error) => {
        if (!mounted) {
          return;
        }

        setError(error.message);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const loadUserEngagement = React.useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setClaims([]);
      setCompletedTaskKeys([]);
      setFavoriteCount(0);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch('/api/me/engagement', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to load engagement');
      }
      
      const data = await res.json();
      setFavoriteCount(data.favorites?.length || 0);
      setCompletedTaskKeys((data.completed_tasks || []).filter((key: any): key is RewardTaskKey =>
        REWARD_TASKS.some((task) => task.key === key)
      ));
      setClaims(data.claims || []);
    } catch (e) {
      console.error(e);
      setError('Cần chạy migration customer engagement để bật nhận mã.');
    }
  }, []);

  const userRef = React.useRef<User | null>(null);

  React.useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }
      userRef.current = data.session?.user ?? null;
      setUser(data.session?.user ?? null);
      void loadUserEngagement(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }
      const currentUser = session?.user ?? null;
      userRef.current = currentUser;
      setUser(currentUser);
      void loadUserEngagement(currentUser);
    });

    const handleFavoritesChanged = () => {
      void loadUserEngagement(userRef.current);
    };

    window.addEventListener('nhien:favorites-changed', handleFavoritesChanged);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('nhien:favorites-changed', handleFavoritesChanged);
    };
  }, [loadUserEngagement]);

  const completedKeys = useMemo(() => {
    const keys = new Set<RewardTaskKey>(completedTaskKeys);

    if (favoriteCount >= 3) {
      keys.add('save_3_favorites');
    }

    if (user?.email && getUserDisplayName(user) !== 'Khách hàng') {
      keys.add('complete_profile');
    }

    return keys;
  }, [completedTaskKeys, favoriteCount, user]);

  const onlineCompletedCount = Array.from(completedKeys).filter((key) => key !== 'qr_checkin').length;
  const canClaim = onlineCompletedCount >= 2;
  const firstClaimablePromotion = promotions.find(isPromotionClaimable);
  const claimedPromotionIds = new Set(claims.map((claim) => claim.promotion_id));

  const completeTask = async (task: RewardTask) => {
    if (!user) {
      openLoginDialog();
      return;
    }

    if (task.kind === 'auto') {
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (task.kind === 'profile') {
      router.push('/profile');
      return;
    }

    if (task.kind === 'counter') {
      setMessage('Nhiệm vụ QR sẽ được xác nhận tại quầy khi bạn ghé quán.');
      return;
    }

    setBusyKey(task.key);
    setError(null);
    setMessage(null);

    if (task.kind === 'share') {
      const shareUrl = window.location.origin;
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Nhiên CàFe',
            text: 'Ghé Nhiên CàFe cùng mình nhé.',
            url: shareUrl,
          });
        } else {
          await navigator.clipboard.writeText(shareUrl);
          setMessage('Đã copy link quán.');
        }
      } catch {
        setBusyKey(null);
        return;
      }
    }

    if (task.kind === 'confirm' && settings.facebook_url) {
      window.open(settings.facebook_url, '_blank', 'noopener,noreferrer');
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/me/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ task_key: task.key })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to complete task');
      }
      
      setCompletedTaskKeys((current) =>
        current.includes(task.key) ? current : [...current, task.key],
      );
      setMessage('Đã ghi nhận nhiệm vụ.');
    } catch (e: any) {
      setError(e.message);
    }

    setBusyKey(null);
  };

  const claimPromotion = async (promotion: Promotion) => {
    if (!user) {
      openLoginDialog();
      return;
    }

    if (!canClaim) {
      setMessage('Hoàn thành ít nhất 2 nhiệm vụ để nhận mã.');
      return;
    }

    setBusyKey(promotion.id);
    setError(null);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/me/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ promotion_id: promotion.id })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to claim promotion');
      }
      
      // refresh engagement
      void loadUserEngagement(user);
      setMessage(`Đã nhận mã ${promotion.code}.`);
    } catch (e: any) {
      setError(e.message);
    }

    setBusyKey(null);
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setMessage(`Đã copy mã ${code}.`);
  };

  return (
    <section id="promotions" className="bg-sera-surface py-24">
      <div className="container mx-auto px-6">
        <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <SeraSectionHeading
              eyebrow="Ưu đãi hôm nay"
              title="Làm nhiệm vụ nhỏ, nhận mã thật"
              description="Đăng nhập để lưu tiến trình, hoàn thành nhiệm vụ và nhận mã khuyến mãi một lần cho mỗi chương trình."
            />

            <div className="mt-8 rounded-[2rem] border border-sera-ink/10 bg-sera-cream p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-sera-muted">
                    Tiến độ
                  </p>
                  <p className="mt-1 text-2xl font-black text-sera-ink">
                    {onlineCompletedCount}/2 nhiệm vụ
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sera-ember text-white">
                  <Gift className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-sera-ink/10">
                <div
                  className="h-full rounded-full bg-sera-ember transition-all"
                  style={{ width: `${Math.min(100, (onlineCompletedCount / 2) * 100)}%` }}
                />
              </div>
              {!user && (
                <SeraButton
                  type="button"
                  variant="accent"
                  size="lg"
                  onClick={openLoginDialog}
                  className="mt-6 w-full"
                >
                  Đăng nhập để nhận mã
                </SeraButton>
              )}
            </div>

            {(message || error) && (
              <div
                className={cn(
                  'mt-5 rounded-3xl border px-5 py-4 text-sm font-bold',
                  error
                    ? 'border-rose-500/20 bg-rose-500/10 text-rose-600'
                    : 'border-sera-sage/20 bg-sera-sage/10 text-sera-sage',
                )}
              >
                {error || message}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {REWARD_TASKS.map((task) => {
                const isDone = completedKeys.has(task.key);
                const isCounterTask = task.kind === 'counter';

                return (
                  <div
                    key={task.key}
                    className={cn(
                      'rounded-[1.75rem] border bg-sera-surface p-5 shadow-[0_24px_70px_-55px_rgba(39,32,28,0.8)]',
                      isDone ? 'border-sera-sage/30' : 'border-sera-ink/10',
                      isCounterTask && 'bg-sera-cream/70',
                    )}
                  >
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div
                        className={cn(
                          'flex h-11 w-11 items-center justify-center rounded-2xl',
                          isDone ? 'bg-sera-sage text-white' : 'bg-sera-cream text-sera-ember',
                        )}
                      >
                        {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                      </div>
                      <SeraBadge tone={isDone ? 'dark' : 'warm'} className="tracking-wide">
                        {isDone ? 'Xong' : task.reward}
                      </SeraBadge>
                    </div>
                    <h3 className="text-lg font-black leading-tight text-sera-ink">{task.title}</h3>
                    <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-sera-muted">
                      {task.description}
                    </p>
                    {task.key === 'save_3_favorites' && (
                      <p className="mb-3 text-xs font-black uppercase tracking-widest text-sera-ember">
                        Đã lưu {favoriteCount}/3 món
                      </p>
                    )}
                    <SeraButton
                      type="button"
                      variant={isDone ? 'outline' : 'accent'}
                      size="sm"
                      onClick={() => completeTask(task)}
                      disabled={busyKey === task.key || isDone}
                      className="w-full"
                    >
                      {busyKey === task.key ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isDone ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : task.kind === 'share' ? (
                        <Share2 className="h-4 w-4" />
                      ) : null}
                      {isDone ? 'Đã hoàn thành' : task.actionLabel}
                    </SeraButton>
                  </div>
                );
              })}
            </div>

            <div className="rounded-[2rem] border border-sera-ink/10 bg-sera-cream p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-sera-muted">
                    Mã đang chạy
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-sera-ink">
                    Nhận mã khuyến mãi
                  </h3>
                </div>
                <TicketPercent className="h-7 w-7 text-sera-ember" />
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-7 w-7 animate-spin text-sera-ember" />
                </div>
              ) : promotions.length === 0 ? (
                <div className="rounded-3xl bg-sera-surface p-5 text-sm font-bold text-sera-muted">
                  Hiện chưa có mã khuyến mãi đang chạy.
                </div>
              ) : (
                <div className="space-y-3">
                  {promotions.map((promotion) => {
                    const claim = claims.find((item) => item.promotion_id === promotion.id);
                    const claimed = claimedPromotionIds.has(promotion.id);
                    const canUsePromotion = isPromotionClaimable(promotion);

                    return (
                      <div
                        key={promotion.id}
                        className="grid gap-4 rounded-3xl border border-sera-ink/10 bg-sera-surface p-4 md:grid-cols-[1fr_auto] md:items-center"
                      >
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h4 className="font-black text-sera-ink">{promotion.name}</h4>
                            <span className="rounded-full bg-sera-ember/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-sera-ember">
                              {getPromotionStatus(promotion)}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-sera-muted">
                            {promotion.discount}
                            {promotion.end_date ? ` · Hết hạn: ${promotion.end_date}` : ''}
                          </p>
                          {claim && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <code className="inline-flex rounded-xl bg-sera-deep px-3 py-2 text-sm font-black tracking-widest text-white">
                                {claim.code_snapshot}
                              </code>
                              {claim.redeemed_at && (
                                <span className="rounded-full bg-sera-sage/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sera-sage">
                                  Đã dùng
                                </span>
                              )}
                              <span className="rounded-full bg-sera-cream px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sera-muted">
                                Còn {claim.remaining_uses ?? promotion.max_redemptions_per_user ?? 1} lượt
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 md:min-w-40">
                          {claimed ? (
                            <SeraButton
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => copyCode(claim?.code_snapshot || promotion.code)}
                            >
                              <Copy className="h-4 w-4" />
                              Copy mã
                            </SeraButton>
                          ) : (
                            <SeraButton
                              type="button"
                              variant={canClaim && canUsePromotion ? 'accent' : 'outline'}
                              size="sm"
                              onClick={() => claimPromotion(promotion)}
                              disabled={busyKey === promotion.id || !canUsePromotion}
                            >
                              {busyKey === promotion.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : canClaim ? (
                                <Gift className="h-4 w-4" />
                              ) : (
                                <Lock className="h-4 w-4" />
                              )}
                              Nhận mã
                            </SeraButton>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!firstClaimablePromotion && promotions.length > 0 && (
                <p className="mt-4 text-sm font-bold text-sera-muted">
                  Các mã hiện tại chưa khả dụng. Vui lòng quay lại sau.
                </p>
              )}

              <SeraLinkButton href="/profile" variant="ghost" size="md" className="mt-5 w-full">
                Xem mã đã nhận trong hồ sơ
              </SeraLinkButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
