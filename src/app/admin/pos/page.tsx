'use client';

import React, { useState, useCallback } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Coffee,
  Gift,
  Loader2,
  QrCode,
  ScanLine,
  Sparkles,
  Stamp,
  TicketCheck,
  Trophy,
  UserRound,
  XCircle,
  Minus,
  Plus,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { QRScannerDialog } from '@/components/admin/QRScannerDialog';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import type { LoyaltyAccount, LoyaltyTransaction, PromotionClaim, Promotion } from '@/types';

const STAMPS_FOR_REWARD = 8;

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserSummary {
  user_id: string;
  display_name: string | null;
  email: string;
  loyalty_account: LoyaltyAccount | null;
  active_claims: (PromotionClaim & { promotion: Promotion | null })[];
  recent_transactions: LoyaltyTransaction[];
}

type PosAction =
  | { type: 'stamp'; count: number }
  | { type: 'redeem_promo'; claim: PromotionClaim & { promotion: Promotion | null } }
  | { type: 'exchange_reward' };

interface SuccessResult {
  message: string;
  detail: string;
  newStamps: number;
  newPoints: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTierColor(tier: string) {
  if (tier === 'Gold') return 'text-amber-500';
  if (tier === 'Silver') return 'text-slate-400';
  return 'text-primary';
}

function getTierBg(tier: string) {
  if (tier === 'Gold') return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  if (tier === 'Silver') return 'bg-slate-400/10 text-slate-500 border-slate-400/20';
  return 'bg-primary/10 text-primary border-primary/20';
}

async function getAuthHeader(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return `Bearer ${session?.access_token || ''}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PosPage() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [manualId, setManualId] = useState('');
  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessResult | null>(null);
  const [stampCount, setStampCount] = useState(1);
  const [pendingAction, setPendingAction] = useState<PosAction | null>(null);

  // ── Fetch user data ────────────────────────────────────────────────────────
  const loadUser = useCallback(async (rawQr: string) => {
    setError(null);
    setSuccess(null);
    setPendingAction(null);
    setStampCount(1);

    // Parse QR — format: "nhien-member:{uuid}"
    let userId = rawQr.trim();
    if (userId.startsWith('nhien-member:')) {
      userId = userId.replace('nhien-member:', '');
    }

    // Basic UUID validation
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(userId)) {
      setError('Mã QR không hợp lệ. Vui lòng yêu cầu khách show QR từ trang Profile.');
      return;
    }

    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`/api/admin/pos/user/${userId}`, {
        headers: { Authorization: auth },
        cache: 'no-store',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Lỗi không xác định' }));
        setError(err.error || 'Không tìm thấy thành viên.');
        setLoading(false);
        return;
      }
      const data: UserSummary = await res.json();
      setUser(data);
    } catch {
      setError('Không thể kết nối server. Vui lòng thử lại.');
    }
    setLoading(false);
  }, []);

  const handleScan = useCallback((code: string) => {
    void loadUser(code);
  }, [loadUser]);

  const handleManualSearch = () => {
    if (!manualId.trim()) return;
    void loadUser(manualId.trim());
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const executeAction = async (action: PosAction) => {
    if (!user) return;
    setProcessing(true);
    setError(null);
    setPendingAction(null);

    const auth = await getAuthHeader();

    try {
      if (action.type === 'stamp') {
        const res = await fetch(`/api/admin/pos/user/${user.user_id}/stamp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: auth },
          body: JSON.stringify({
            stamps: action.count,
            points: action.count,
            note: `Mua ${action.count} ly nước tại quán`,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Lỗi' }));
          setError(err.error || 'Không thể cộng stamp.');
          setProcessing(false);
          return;
        }
        const data = await res.json();
        const acc = data.loyalty_account as LoyaltyAccount;
        setSuccess({
          message: `✅ Đã cộng ${action.count} stamp & ${action.count} điểm`,
          detail: `Tổng: ${acc.stamps} stamp · ${acc.points} điểm · Hạng ${acc.tier}`,
          newStamps: acc.stamps,
          newPoints: acc.points,
        });
        // Refresh user data
        await loadUser(user.user_id);
      }

      if (action.type === 'exchange_reward') {
        const res = await fetch(`/api/admin/pos/user/${user.user_id}/stamp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: auth },
          body: JSON.stringify({
            stamps: -STAMPS_FOR_REWARD,
            points: 0,
            note: `Đổi ${STAMPS_FOR_REWARD} stamp lấy 1 phần tặng`,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Lỗi' }));
          setError(err.error || 'Không thể đổi stamp.');
          setProcessing(false);
          return;
        }
        const data = await res.json();
        const acc = data.loyalty_account as LoyaltyAccount;
        setSuccess({
          message: `🎁 Đã đổi ${STAMPS_FOR_REWARD} stamp lấy phần tặng!`,
          detail: `Còn lại: ${acc.stamps} stamp · ${acc.points} điểm`,
          newStamps: acc.stamps,
          newPoints: acc.points,
        });
        await loadUser(user.user_id);
      }

      if (action.type === 'redeem_promo') {
        const res = await fetch(`/api/admin/claims/${action.claim.id}/redeem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: auth },
          body: JSON.stringify({ redeem_note: 'Áp dụng tại quầy' }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Lỗi' }));
          setError(err.error || 'Không thể áp dụng mã KM.');
          setProcessing(false);
          return;
        }

        // Also add 1 stamp for the purchase
        await fetch(`/api/admin/pos/user/${user.user_id}/stamp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: auth },
          body: JSON.stringify({
            stamps: 1,
            points: 1,
            note: `Áp mã ${action.claim.code_snapshot} + tích 1 stamp`,
          }),
        });

        setSuccess({
          message: `✅ Đã áp dụng mã ${action.claim.code_snapshot}`,
          detail: `Ưu đãi: ${action.claim.promotion?.discount || 'xem mã'} · Đã tích thêm 1 stamp`,
          newStamps: (user.loyalty_account?.stamps || 0) + 1,
          newPoints: (user.loyalty_account?.points || 0) + 1,
        });
        await loadUser(user.user_id);
      }
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    }

    setProcessing(false);
  };

  const resetSession = () => {
    setUser(null);
    setError(null);
    setSuccess(null);
    setPendingAction(null);
    setManualId('');
    setStampCount(1);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-4rem)] pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl flex items-center gap-2">
          <ScanLine className="h-7 w-7 text-primary" />
          POS Tại Quầy
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quét QR khách → tích stamp mua nước hoặc áp mã khuyến mãi.
        </p>
      </div>

      {/* ── Success banner ── */}
      {success && (
        <div className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-black text-emerald-700 dark:text-emerald-300 text-lg">{success.message}</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{success.detail}</p>
          </div>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div className="mb-6 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="h-6 w-6 text-rose-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-black text-rose-700 dark:text-rose-300">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* ── Confirm dialog overlay ── */}
      {pendingAction && user && (
        <ConfirmActionDialog
          action={pendingAction}
          userName={user.display_name || user.email || 'Khách hàng'}
          processing={processing}
          onConfirm={() => void executeAction(pendingAction)}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground font-semibold">Đang tải thông tin thành viên...</p>
        </div>
      ) : !user ? (
        /* ── IDLE STATE ── */
        <IdleScreen
          manualId={manualId}
          onManualIdChange={setManualId}
          onManualSearch={handleManualSearch}
          onOpenScanner={() => setIsScannerOpen(true)}
        />
      ) : (
        /* ── USER FOUND STATE ── */
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left column: actions */}
          <div className="space-y-5">
            {/* Stamp section */}
            <StampSection
              stamps={user.loyalty_account?.stamps || 0}
              stampCount={stampCount}
              onStampCountChange={setStampCount}
              onConfirm={() => setPendingAction({ type: 'stamp', count: stampCount })}
              processing={processing}
            />

            {/* Exchange reward */}
            {(user.loyalty_account?.stamps || 0) >= STAMPS_FOR_REWARD && (
              <ExchangeRewardCard
                stamps={user.loyalty_account?.stamps || 0}
                onExchange={() => setPendingAction({ type: 'exchange_reward' })}
                processing={processing}
              />
            )}

            {/* Promo codes */}
            {user.active_claims.length > 0 && (
              <PromoClaimsSection
                claims={user.active_claims}
                onRedeem={(claim) => setPendingAction({ type: 'redeem_promo', claim })}
                processing={processing}
              />
            )}

            {user.active_claims.length === 0 && (
              <Card className="rounded-3xl border-border/50 bg-card/50">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <TicketCheck className="mx-auto mb-3 h-8 w-8 opacity-30" />
                  <p className="text-sm font-semibold">Khách không có mã KM nào còn lượt dùng</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column: user info */}
          <div className="space-y-5">
            <UserCard user={user} onReset={resetSession} onRescan={() => setIsScannerOpen(true)} />
            <RecentTransactions transactions={user.recent_transactions} />
          </div>
        </div>
      )}

      <QRScannerDialog
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function IdleScreen({
  manualId,
  onManualIdChange,
  onManualSearch,
  onOpenScanner,
}: {
  manualId: string;
  onManualIdChange: (v: string) => void;
  onManualSearch: () => void;
  onOpenScanner: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-8 py-10">
      {/* Big scan button */}
      <button
        onClick={onOpenScanner}
        className="group relative flex h-52 w-full max-w-md flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-primary/30 bg-primary/5 transition-all duration-300 hover:border-primary/60 hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/10 active:scale-[0.98]"
      >
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[20px] bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
          <QrCode className="h-10 w-10 text-primary" />
        </div>
        <span className="text-xl font-black text-foreground">Quét QR Thành Viên</span>
        <span className="mt-2 text-sm font-medium text-muted-foreground">
          Yêu cầu khách show mã QR từ trang Profile
        </span>
        <div className="absolute inset-0 rounded-[32px] ring-0 ring-primary/20 transition-all duration-300 group-hover:ring-4" />
      </button>

      {/* Divider */}
      <div className="flex w-full max-w-md items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">hoặc</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Manual input */}
      <div className="w-full max-w-md space-y-3">
        <p className="text-center text-sm font-semibold text-muted-foreground">Nhập User ID thủ công</p>
        <div className="flex gap-2">
          <Input
            value={manualId}
            onChange={(e) => onManualIdChange(e.target.value)}
            placeholder="nhien-member:xxxxxxxx-xxxx-xxxx hoặc UUID"
            className="h-12 rounded-2xl font-mono text-sm"
            onKeyDown={(e) => e.key === 'Enter' && onManualSearch()}
          />
          <Button
            onClick={onManualSearch}
            disabled={!manualId.trim()}
            className="h-12 rounded-2xl px-5 font-bold"
          >
            Tìm
          </Button>
        </div>
      </div>
    </div>
  );
}

function UserCard({
  user,
  onReset,
  onRescan,
}: {
  user: UserSummary;
  onReset: () => void;
  onRescan: () => void;
}) {
  const tier = user.loyalty_account?.tier || 'Member';
  const stamps = user.loyalty_account?.stamps || 0;
  const points = user.loyalty_account?.points || 0;
  const stampsProgress = Math.min(stamps / STAMPS_FOR_REWARD, 1);

  return (
    <Card className="overflow-hidden rounded-[28px] border-border/50 bg-card shadow-sm">
      <CardHeader className="border-b border-border/50 bg-gradient-to-br from-primary/5 to-transparent p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <UserRound className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-black text-lg text-foreground leading-tight">
                {user.display_name || 'Khách hàng'}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[160px]">{user.email}</p>
            </div>
          </div>
          <Badge className={cn('rounded-xl border text-xs font-black uppercase tracking-widest', getTierBg(tier))}>
            <Trophy className="mr-1 h-3 w-3" />
            {tier}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-muted/40 p-4 text-center">
            <Stamp className={cn('mx-auto mb-1 h-5 w-5', getTierColor(tier))} />
            <p className="text-2xl font-black text-foreground">{stamps}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stamps</p>
          </div>
          <div className="rounded-2xl bg-muted/40 p-4 text-center">
            <Sparkles className="mx-auto mb-1 h-5 w-5 text-amber-500" />
            <p className="text-2xl font-black text-foreground">{points}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Điểm</p>
          </div>
        </div>

        {/* Stamp progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-muted-foreground">
            <span>Tiến độ tích stamp</span>
            <span>{stamps}/{STAMPS_FOR_REWARD}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${stampsProgress * 100}%` }}
            />
          </div>
          {stamps >= STAMPS_FOR_REWARD && (
            <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 text-center animate-pulse">
              🎉 Đủ stamp để đổi phần tặng!
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRescan} className="flex-1 rounded-xl">
            <QrCode className="mr-1.5 h-4 w-4" />
            Quét khác
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset} className="flex-1 rounded-xl text-muted-foreground">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Khách mới
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StampSection({
  stamps,
  stampCount,
  onStampCountChange,
  onConfirm,
  processing,
}: {
  stamps: number;
  stampCount: number;
  onStampCountChange: (n: number) => void;
  onConfirm: () => void;
  processing: boolean;
}) {
  return (
    <Card className="overflow-hidden rounded-[28px] border-border/50 bg-card shadow-sm">
      <CardHeader className="border-b border-border/50 p-6 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Coffee className="h-5 w-5 text-primary" />
          Tích Stamp Mua Nước
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Mỗi ly = 1 stamp + 1 điểm. Chọn số ly khách đã mua.
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        {/* Cup counter */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => onStampCountChange(Math.max(1, stampCount - 1))}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-95"
          >
            <Minus className="h-5 w-5" />
          </button>
          <div className="text-center">
            <span className="text-5xl font-black text-foreground tabular-nums">{stampCount}</span>
            <p className="text-xs font-bold text-muted-foreground mt-1">
              {stampCount === 1 ? 'ly nước' : 'ly nước'}
            </p>
          </div>
          <button
            onClick={() => onStampCountChange(Math.min(10, stampCount + 1))}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-95"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Quick select */}
        <div className="flex gap-2 justify-center flex-wrap">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onStampCountChange(n)}
              className={cn(
                'h-9 w-12 rounded-xl text-sm font-black transition-all',
                stampCount === n
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted/70',
              )}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="rounded-2xl bg-muted/30 p-4 text-center">
          <p className="text-sm font-semibold text-muted-foreground">
            Sau khi tích: <span className="font-black text-foreground">{stamps + stampCount} stamp</span>
            {' '}·{' '}
            <span className="font-black text-foreground">+{stampCount} điểm</span>
          </p>
          {stamps + stampCount >= STAMPS_FOR_REWARD && stamps < STAMPS_FOR_REWARD && (
            <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1">
              🎉 Sẽ đủ {STAMPS_FOR_REWARD} stamp để đổi phần tặng!
            </p>
          )}
        </div>

        <Button
          onClick={onConfirm}
          disabled={processing}
          className="w-full h-14 rounded-2xl text-base font-black shadow-sm"
        >
          {processing ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Stamp className="mr-2 h-5 w-5" />
          )}
          Tích {stampCount} stamp
          <ChevronRight className="ml-auto h-5 w-5 opacity-50" />
        </Button>
      </CardContent>
    </Card>
  );
}

function ExchangeRewardCard({
  stamps,
  onExchange,
  processing,
}: {
  stamps: number;
  onExchange: () => void;
  processing: boolean;
}) {
  return (
    <Card className="overflow-hidden rounded-[28px] border-emerald-500/20 bg-emerald-500/5 shadow-sm">
      <CardContent className="p-6 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15">
          <Gift className="h-7 w-7 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="font-black text-foreground">Đổi {STAMPS_FOR_REWARD} stamp</p>
          <p className="text-sm text-muted-foreground">
            Khách có {stamps} stamp — đủ để lấy 1 phần tặng!
          </p>
        </div>
        <Button
          onClick={onExchange}
          disabled={processing}
          variant="outline"
          className="shrink-0 h-10 rounded-xl border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 font-black"
        >
          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Đổi'}
        </Button>
      </CardContent>
    </Card>
  );
}

function PromoClaimsSection({
  claims,
  onRedeem,
  processing,
}: {
  claims: (PromotionClaim & { promotion: Promotion | null })[];
  onRedeem: (claim: PromotionClaim & { promotion: Promotion | null }) => void;
  processing: boolean;
}) {
  return (
    <Card className="overflow-hidden rounded-[28px] border-border/50 bg-card shadow-sm">
      <CardHeader className="border-b border-border/50 p-6 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TicketCheck className="h-5 w-5 text-primary" />
          Mã Khuyến Mãi
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Áp dụng mã khuyến mãi của khách (tự động tích thêm 1 stamp).
        </p>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {claims.map((claim) => (
          <div
            key={claim.id}
            className="flex items-center gap-4 rounded-2xl border border-border/50 bg-muted/20 p-4"
          >
            <div className="flex-1 min-w-0">
              <p className="font-black text-foreground truncate">
                {claim.promotion?.name || 'Ưu đãi'}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <code className="rounded-lg bg-primary/10 px-2.5 py-0.5 text-xs font-black tracking-widest text-primary">
                  {claim.code_snapshot}
                </code>
                <span className="text-xs font-semibold text-muted-foreground">
                  {claim.promotion?.discount || ''}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Còn {claim.remaining_uses} lượt dùng
              </p>
            </div>
            <Button
              onClick={() => onRedeem(claim)}
              disabled={processing}
              size="sm"
              className="shrink-0 h-9 rounded-xl font-black"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Áp dụng'}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RecentTransactions({ transactions }: { transactions: LoyaltyTransaction[] }) {
  if (transactions.length === 0) return null;

  return (
    <Card className="overflow-hidden rounded-[28px] border-border/50 bg-card shadow-sm">
      <CardHeader className="border-b border-border/50 p-5 pb-3">
        <CardTitle className="text-sm text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Giao dịch gần đây
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-3">
            <p className="text-sm font-semibold text-foreground truncate flex-1 mr-2">
              {tx.note || 'Cập nhật điểm'}
            </p>
            <div className="text-right text-xs font-black text-muted-foreground whitespace-nowrap">
              {tx.stamps > 0 ? `+${tx.stamps}` : tx.stamps} stamp
              {' · '}
              {tx.points > 0 ? `+${tx.points}` : tx.points} đ
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ConfirmActionDialog({
  action,
  userName,
  processing,
  onConfirm,
  onCancel,
}: {
  action: PosAction;
  userName: string;
  processing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const title =
    action.type === 'stamp'
      ? `Tích ${action.count} stamp cho ${userName}?`
      : action.type === 'exchange_reward'
      ? `Đổi ${STAMPS_FOR_REWARD} stamp lấy phần tặng?`
      : `Áp mã ${action.type === 'redeem_promo' ? action.claim.code_snapshot : ''} cho ${userName}?`;

  const detail =
    action.type === 'stamp'
      ? `+${action.count} stamp · +${action.count} điểm · Mua ${action.count} ly nước`
      : action.type === 'exchange_reward'
      ? `Trừ ${STAMPS_FOR_REWARD} stamp · khách nhận 1 phần tặng`
      : action.type === 'redeem_promo'
      ? `Ưu đãi: ${action.claim.promotion?.discount || 'xem mã'} · Tự động tích thêm 1 stamp`
      : '';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-[28px] border border-border bg-card shadow-2xl p-6 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
          {action.type === 'stamp' && <Stamp className="h-7 w-7 text-primary" />}
          {action.type === 'exchange_reward' && <Gift className="h-7 w-7 text-emerald-600" />}
          {action.type === 'redeem_promo' && <TicketCheck className="h-7 w-7 text-primary" />}
        </div>
        <h3 className="text-lg font-black text-center text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground text-center mt-2">{detail}</p>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={processing}
            className="flex-1 h-12 rounded-2xl font-bold"
          >
            Hủy
          </Button>
          <Button
            onClick={onConfirm}
            disabled={processing}
            className="flex-1 h-12 rounded-2xl font-black"
          >
            {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Xác nhận'}
          </Button>
        </div>
      </div>
    </div>
  );
}
