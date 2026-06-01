"use client";

import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Gift,
  Heart,
  History,
  LayoutDashboard,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  Star,
  TicketPercent,
  Trophy,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { SeraGoogleLoginForm } from "@/components/auth/SeraGoogleLoginForm";
import Navbar from "@/components/landing/Navbar";
import { SeraButton, SeraLinkButton } from "@/components/sera/button";
import { getAuthRedirectUrl, getUserAvatarUrl, getUserDisplayName, isAdminUser } from "@/lib/auth";
import { REWARD_TASKS, type RewardTaskKey } from "@/lib/customerEngagement";
import { getProxiedImageUrl } from "@/lib/image-proxy";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/images";
import { supabase } from "@/lib/supabaseClient";
import type {
  Favorite,
  LoyaltyAccount,
  LoyaltyTransaction,
  Product,
  Promotion,
  PromotionClaim,
} from "@/types";

type FavoriteWithProduct = Favorite & {
  product: Product | null;
};

type ClaimWithPromotion = PromotionClaim & {
  promotion: Promotion | null;
};

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteWithProduct[]>([]);
  const [claims, setClaims] = useState<ClaimWithPromotion[]>([]);
  const [completedTaskKeys, setCompletedTaskKeys] = useState<RewardTaskKey[]>([]);
  const [loyaltyAccount, setLoyaltyAccount] = useState<LoyaltyAccount | null>(null);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const userName = getUserDisplayName(user);
  const avatarUrl = getUserAvatarUrl(user);
  const isAdmin = isAdminUser(user);
  const memberCode = user?.id.slice(0, 8).toUpperCase() || '--------';
  const memberQrUrl = user
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`nhien-member:${user.id}`)}`
    : '';

  const loadCustomerData = React.useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setFavorites([]);
      setClaims([]);
      setCompletedTaskKeys([]);
      setLoyaltyAccount(null);
      setLoyaltyTransactions([]);
      return;
    }

    setProfileLoading(true);
    setProfileError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Update profile first
      const profileRes = await fetch('/api/me/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          display_name: getUserDisplayName(currentUser),
          email: currentUser.email || ''
        })
      });

      if (!profileRes.ok) {
        console.error('Failed to update profile');
      }

      // Fetch engagement
      const res = await fetch('/api/me/engagement', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch engagement data');

      const data = await res.json();
      
      setFavorites(data.favorites || []);
      setClaims(data.claims || []);
      setCompletedTaskKeys((data.completed_tasks || []).filter((key: any): key is RewardTaskKey =>
        REWARD_TASKS.some((task) => task.key === key)
      ));
      setLoyaltyAccount(data.loyalty_account || null);
      setLoyaltyTransactions(data.loyalty_transactions || []);
    } catch (e: any) {
      console.error(e);
      setProfileError('Có lỗi xảy ra khi tải dữ liệu thành viên.');
    }
    
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCheckingSession(false);
      void loadCustomerData(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setAuthLoading(false);
      void loadCustomerData(currentUser);
    });

    return () => subscription.unsubscribe();
  }, [loadCustomerData]);

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectUrl("/profile"),
      },
    });

    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
    }
  };

  const handlePasswordLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (checkingSession) {
    return (
      <main className="landing-theme flex min-h-screen items-center justify-center bg-sera-cream">
        <Loader2 className="h-6 w-6 animate-spin text-sera-ember" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="landing-theme min-h-screen bg-black text-white">
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="relative w-full max-w-[460px]">
            <SeraGoogleLoginForm
              loading={authLoading}
              error={authError}
              onPasswordLogin={handlePasswordLogin}
              onGoogleLogin={handleGoogleLogin}
            />
            <Link
              href="/"
              className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-zinc-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="landing-theme min-h-screen bg-sera-cream text-sera-ink">
      <Navbar />
      <section className="px-6 pb-20 pt-28 md:pt-32">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-sera-muted transition-colors hover:text-sera-ember"
          >
            <ArrowLeft className="h-4 w-4" />
            Về trang chủ
          </Link>

          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <aside className="overflow-hidden rounded-[2rem] border border-sera-ink/10 bg-sera-surface shadow-[0_30px_90px_-65px_rgba(39,32,28,0.9)]">
              <div className="relative bg-sera-deep p-7 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(184,67,43,0.35),transparent_38%)]" />
                <div className="relative">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                      {isAdmin ? "Admin" : "Member"}
                    </span>
                    <SeraButton
                      type="button"
                      variant="light"
                      size="sm"
                      onClick={handleLogout}
                    >
                      Đăng xuất
                    </SeraButton>
                  </div>

                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[2rem] bg-sera-ember text-4xl font-black text-white ring-4 ring-white/10">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt={userName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      userName.charAt(0).toUpperCase()
                    )}
                  </div>

                  <h1 className="mt-6 text-3xl font-black leading-tight">
                    {userName}
                  </h1>
                  <p className="mt-2 break-words text-sm font-medium text-white/62">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="space-y-3 p-6">
                <div className="rounded-3xl bg-sera-cream p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-sera-muted">
                    Trạng thái
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-sm font-bold text-sera-ink">
                    <span className="h-2.5 w-2.5 rounded-full bg-sera-sage" />
                    Đã đăng nhập bằng Google
                  </div>
                </div>

                <div className="rounded-3xl border border-sera-ink/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-sera-muted">
                    Vai trò
                  </p>
                  <p className="mt-2 text-lg font-black text-sera-ink">
                    {isAdmin ? "Admin" : "User"}
                  </p>
                </div>

                <div className="rounded-3xl border border-sera-ink/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-sera-muted">
                    Mã thành viên
                  </p>
                  <div className="mt-4 overflow-hidden rounded-3xl bg-white p-3">
                    {memberQrUrl && (
                      <Image
                        src={memberQrUrl}
                        alt={`QR thành viên ${memberCode}`}
                        width={180}
                        height={180}
                        className="mx-auto h-auto w-full max-w-[180px]"
                      />
                    )}
                  </div>
                  <code className="mt-3 block rounded-2xl bg-sera-cream px-3 py-2 text-center text-sm font-black tracking-widest text-sera-ink">
                    {memberCode}
                  </code>
                </div>
              </div>
            </aside>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-sera-ink/10 bg-sera-surface p-6 shadow-[0_30px_90px_-70px_rgba(39,32,28,0.9)] md:p-8">
                <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-sera-muted">
                      Tài khoản
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-sera-ink">
                      Thông tin cá nhân
                    </h2>
                  </div>
                  {isAdmin && (
                    <SeraLinkButton
                      href="/admin/dashboard"
                      variant="accent"
                      size="md"
                      className="w-full md:w-auto"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Trang admin
                    </SeraLinkButton>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoTile
                    icon={<Mail className="h-5 w-5" />}
                    label="Email"
                    value={user.email || "-"}
                  />
                  <InfoTile
                    icon={<ShieldCheck className="h-5 w-5" />}
                    label="Quyền truy cập"
                    value={isAdmin ? "Admin" : "User"}
                  />
                  <InfoTile
                    icon={<UserRound className="h-5 w-5" />}
                    label="User ID"
                    value={user.id}
                    compact
                  />
                  <InfoTile
                    icon={<CalendarDays className="h-5 w-5" />}
                    label="Đăng nhập gần nhất"
                    value={formatDate(user.last_sign_in_at)}
                  />
                </div>
              </div>

              {profileError && (
                <div className="rounded-[2rem] border border-rose-500/20 bg-rose-500/10 p-6 text-sm font-bold text-rose-600">
                  {profileError}
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-3">
                <MemberStat
                  icon={<Trophy className="h-5 w-5" />}
                  label="Hạng thành viên"
                  value={loyaltyAccount?.tier || "Member"}
                />
                <MemberStat
                  icon={<Star className="h-5 w-5" />}
                  label="Stamp hiện có"
                  value={`${loyaltyAccount?.stamps || 0}/8`}
                />
                <MemberStat
                  icon={<Gift className="h-5 w-5" />}
                  label="Điểm tích lũy"
                  value={`${loyaltyAccount?.points || 0}`}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <ProfilePanel
                  icon={<Heart className="h-6 w-6" />}
                  title="Món yêu thích"
                  description="Các món bạn đã bấm trái tim ở thực đơn."
                  loading={profileLoading}
                  empty={favorites.length === 0}
                  emptyText="Chưa lưu món nào"
                >
                  <div className="space-y-3">
                    {favorites.slice(0, 5).map((favorite) => (
                      <div
                        key={favorite.id}
                        className="group flex items-center gap-4 rounded-3xl bg-sera-cream p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-sera-surface">
                          <Image
                            src={getProxiedImageUrl(favorite.product?.image_url || DEFAULT_PRODUCT_IMAGE)}
                            alt={favorite.product?.name || "Món yêu thích"}
                            fill
                            sizes="64px"
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-black text-sera-ink transition-colors">
                            {favorite.product?.name || "Món đã lưu"}
                          </h4>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="truncate text-xs font-bold uppercase tracking-wider text-sera-muted">
                              {favorite.product?.category || "Thực đơn"}
                            </span>
                            {favorite.product?.price_s ? (
                              <>
                                <span className="text-sera-muted/50">·</span>
                                <span className="text-sm font-bold text-sera-ember">
                                  {new Intl.NumberFormat('vi-VN').format(favorite.product.price_s)}đ
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ProfilePanel>

                <ProfilePanel
                  icon={<TicketPercent className="h-6 w-6" />}
                  title="Mã đã nhận"
                  description="Mỗi chương trình chỉ nhận một lần cho tài khoản này."
                  loading={profileLoading}
                  empty={claims.length === 0}
                  emptyText="Chưa nhận mã nào"
                >
                  <div className="space-y-3">
                    {claims.map((claim) => (
                      <div key={claim.id} className="rounded-3xl bg-sera-cream p-4 text-sm">
                        <span className="block font-black text-sera-ink">
                          {claim.promotion?.name || "Ưu đãi"}
                        </span>
                        <code className="mt-2 inline-flex rounded-xl bg-sera-deep px-3 py-2 text-xs font-black tracking-widest text-white">
                          {claim.code_snapshot}
                        </code>
                        <span className="mt-2 block text-sera-muted">
                          Nhận lúc {formatDate(claim.claimed_at)}
                        </span>
                        <span className="mt-1 block font-bold text-sera-muted">
                          Đã dùng {claim.redeemed_count || 0} lần · còn {claim.remaining_uses ?? 1} lượt
                        </span>
                        {claim.redeemed_at && (
                          <span className="mt-1 block font-bold text-sera-sage">
                            Đã dùng lúc {formatDate(claim.redeemed_at)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </ProfilePanel>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <ProfilePanel
                  icon={<CheckCircle2 className="h-6 w-6" />}
                  title="Nhiệm vụ đã hoàn thành"
                  description="Tiến trình dùng để mở khóa ưu đãi trên trang chủ."
                  loading={profileLoading}
                  empty={completedTaskKeys.length === 0}
                  emptyText="Chưa hoàn thành nhiệm vụ nào"
                >
                  <div className="space-y-3">
                    {REWARD_TASKS.filter((task) => completedTaskKeys.includes(task.key)).map((task) => (
                      <div key={task.key} className="rounded-3xl bg-sera-cream p-4 text-sm">
                        <span className="block font-black text-sera-ink">{task.title}</span>
                        <span className="mt-1 block text-sera-muted">{task.reward}</span>
                      </div>
                    ))}
                  </div>
                </ProfilePanel>

                <ProfilePanel
                  icon={<History className="h-6 w-6" />}
                  title="Hoạt động gần đây"
                  description="Lịch sử cộng/đổi điểm sẽ xuất hiện tại đây."
                  loading={profileLoading}
                  empty={loyaltyTransactions.length === 0}
                  emptyText="Chưa có giao dịch điểm"
                >
                  <div className="space-y-3">
                    {loyaltyTransactions.map((transaction) => (
                      <div key={transaction.id} className="rounded-3xl bg-sera-cream p-4 text-sm">
                        <span className="block font-black text-sera-ink">
                          {transaction.note || "Cập nhật điểm"}
                        </span>
                        <span className="mt-1 block text-sera-muted">
                          {transaction.points > 0 ? "+" : ""}
                          {transaction.points} điểm · {transaction.stamps > 0 ? "+" : ""}
                          {transaction.stamps} stamp
                        </span>
                        <span className="mt-1 block text-sera-muted">
                          {formatDate(transaction.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </ProfilePanel>
              </div>

              <div className="rounded-[2rem] border border-sera-ember/20 bg-sera-ember/10 p-6">
                <div className="flex gap-4">
                  <Sparkles className="mt-1 h-5 w-5 shrink-0 text-sera-ember" />
                  <div>
                    <h3 className="font-black text-sera-ink">
                      Stamp card đơn giản
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-sera-muted">
                      Mô hình hiện tại đã sẵn sàng cho quán cộng stamp/điểm theo user. Bước tiếp theo là thêm màn hình cashier để quét QR hoặc nhập email/số điện thoại.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function MemberStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[2rem] border border-sera-ink/10 bg-sera-surface p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-sera-cream text-sera-ember">
        {icon}
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-sera-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-sera-ink">{value}</p>
    </div>
  );
}

function ProfilePanel({
  icon,
  title,
  description,
  loading,
  empty,
  emptyText,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  loading: boolean;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-sera-ink/10 bg-sera-surface p-6">
      <div className="mb-5 text-sera-ember">{icon}</div>
      <h3 className="text-xl font-black text-sera-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-sera-muted">{description}</p>
      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center rounded-3xl bg-sera-cream p-6">
            <Loader2 className="h-5 w-5 animate-spin text-sera-ember" />
          </div>
        ) : empty ? (
          <div className="rounded-3xl bg-sera-cream p-4 text-sm font-bold text-sera-muted">
            {emptyText}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
  compact = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-sera-cream p-5">
      <div className="mb-4 text-sera-ember">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-widest text-sera-muted">
        {label}
      </p>
      <p
        className={`mt-2 font-bold text-sera-ink ${
          compact ? "break-all text-sm leading-6" : "break-words text-base"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
