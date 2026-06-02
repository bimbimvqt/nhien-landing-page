'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Loader2,
  Search,
  Sparkles,
  TicketCheck,
  UserRound,
  XCircle,
  QrCode,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QRScannerDialog } from '@/components/admin/QRScannerDialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import type { Promotion, PromotionClaim } from '@/types';

type ClaimWithDetails = PromotionClaim & {
  promotion: Promotion | null;
  display_name?: string | null;
  email?: string | null;
};

export default function RedeemPage() {
  const [code, setCode] = useState('');
  const [note, setNote] = useState('Áp dụng tại quầy');
  const [claims, setClaims] = useState<ClaimWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const searchClaims = async (codeToSearch?: string) => {
    const normalizedCode = (codeToSearch || code).trim().toUpperCase();

    if (codeToSearch) {
      setCode(normalizedCode);
    }

    if (!normalizedCode) {
      setMessage('Nhập mã khuyến mãi trước khi tìm.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/claims/search?code=${encodeURIComponent(normalizedCode)}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Lỗi tìm kiếm' }));
        setError(errData.error || 'Không thể tìm kiếm mã.');
        setClaims([]);
        setLoading(false);
        return;
      }

      const rows = (await res.json()) as ClaimWithDetails[];
      setClaims(rows);
      setMessage(rows.length === 0 ? 'Không tìm thấy claim nào cho mã này.' : `Tìm thấy ${rows.length} lượt nhận mã.`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
      setClaims([]);
    }

    setLoading(false);
  };

  const redeemClaim = async (claim: ClaimWithDetails) => {
    if ((claim.remaining_uses ?? 0) <= 0) {
      setMessage('Mã này đã hết lượt sử dụng cho user này.');
      return;
    }

    if (
      claim.promotion?.max_total_redemptions &&
      (claim.promotion.usage_count || 0) >= claim.promotion.max_total_redemptions
    ) {
      setMessage('Mã này đã đạt tổng lượt áp dụng tối đa.');
      return;
    }

    setRedeemingId(claim.id);
    setError(null);
    setMessage(null);

    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(`/api/admin/claims/${claim.id}/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({ redeem_note: note.trim() || 'Áp dụng tại quầy' }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Lỗi không xác định' }));
      setError(errData.error || 'Không thể áp dụng mã.');
      setRedeemingId(null);
      return;
    }

    const updatedClaim = await res.json();

    setClaims((current) =>
      current.map((item) =>
        item.id === claim.id
          ? {
              ...item,
              redeemed_count: updatedClaim.redeemed_count,
              remaining_uses: updatedClaim.remaining_uses,
              redeemed_at: updatedClaim.redeemed_at,
              redeemed_by: updatedClaim.redeemed_by,
              redeem_note: updatedClaim.redeem_note,
              promotion: item.promotion
                ? {
                    ...item.promotion,
                    usage_count: (item.promotion.usage_count || 0) + 1,
                  }
                : item.promotion,
            }
          : item,
      ),
    );
    setMessage('Đã áp dụng mã và cập nhật lượt sử dụng.');
    setRedeemingId(null);
    window.alert('Áp dụng mã thành công!');
  };

  const copyUserId = async (userId: string) => {
    await navigator.clipboard.writeText(userId);
    setMessage('Đã copy user id.');
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Áp dụng mã
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Nhập code khách đưa tại quầy, chọn đúng user claim và đánh dấu đã dùng.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden rounded-[28px] border-border/50 bg-card shadow-sm">
        <CardHeader className="border-b border-border/50 bg-card p-8">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <TicketCheck className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black italic text-foreground">Tra cứu mã đã nhận</CardTitle>
          <CardDescription className="text-muted-foreground">
            Mã phải được khách nhận trước ở section Ưu đãi hôm nay.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Mã khuyến mãi
              </Label>
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void searchClaims();
                  }
                }}
                placeholder="VD: HELLO2026"
                className="h-12 rounded-2xl font-mono text-base font-black tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Ghi chú áp dụng
              </Label>
              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => searchClaims()}
                disabled={loading}
                className="h-12 flex-1 rounded-2xl px-6 font-black"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Tìm mã
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsScannerOpen(true)}
                disabled={loading}
                className="h-12 w-12 shrink-0 rounded-2xl p-0 border-primary/20 text-primary hover:bg-primary/10"
                title="Quét mã QR"
              >
                <QrCode className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {(message || error) && (
            <div
              className={cn(
                'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold',
                error
                  ? 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300'
                  : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
              )}
            >
              {error ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {error || message}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {claims.map((claim) => {
          const remainingUses = claim.remaining_uses ?? 0;
          const outOfUses = remainingUses <= 0;
          const totalLimitReached = Boolean(
            claim.promotion?.max_total_redemptions &&
              (claim.promotion.usage_count || 0) >= claim.promotion.max_total_redemptions,
          );
          const profileName = claim.display_name || claim.email || 'Khách hàng';

          return (
            <Card key={claim.id} className="overflow-hidden rounded-[24px] border-border/50 bg-card shadow-sm">
              <CardContent className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge
                      className={cn(
                        'border-none text-[10px] font-black uppercase tracking-widest',
                        outOfUses
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
                      )}
                    >
                      {outOfUses ? 'Hết lượt' : `Còn ${remainingUses} lượt`}
                    </Badge>
                    <Badge className="border-none bg-primary/10 text-[10px] font-black uppercase tracking-widest text-primary">
                      {claim.promotion?.discount || 'Ưu đãi'}
                    </Badge>
                    {totalLimitReached && (
                      <Badge className="border-none bg-amber-500/10 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-300">
                        Hết tổng lượt
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-foreground">
                    {claim.promotion?.name || claim.code_snapshot}
                  </h3>
                  <div className="mt-3 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <UserRound className="h-4 w-4 shrink-0" />
                      <span className="truncate font-semibold">{profileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyUserId(claim.user_id)}
                      className="flex min-w-0 items-center gap-2 text-left font-semibold hover:text-primary"
                    >
                      <Copy className="h-4 w-4 shrink-0" />
                      <span className="truncate">{claim.user_id}</span>
                    </button>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-muted-foreground">
                    Nhận: {new Intl.DateTimeFormat('vi-VN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(claim.claimed_at))}
                    {claim.redeemed_at
                      ? ` · Dùng: ${new Intl.DateTimeFormat('vi-VN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(claim.redeemed_at))}`
                      : ''}
                  </p>
                  <p className="mt-2 text-xs font-bold text-muted-foreground">
                    Đã áp dụng {claim.redeemed_count || 0} lần · giới hạn {claim.promotion?.max_redemptions_per_user || 1} lượt/user
                    {claim.promotion?.max_total_redemptions
                      ? ` · tổng ${claim.promotion.usage_count || 0}/${claim.promotion.max_total_redemptions}`
                      : ''}
                  </p>
                  {claim.redeem_note && (
                    <p className="mt-2 text-xs font-bold text-muted-foreground">
                      Ghi chú: {claim.redeem_note}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  disabled={outOfUses || totalLimitReached || redeemingId === claim.id}
                  onClick={() => redeemClaim(claim)}
                  className="h-12 rounded-2xl px-6 font-black"
                >
                  {redeemingId === claim.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : outOfUses ? (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {outOfUses || totalLimitReached ? 'Hết lượt' : 'Áp dụng mã'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <QRScannerDialog 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={(scannedCode) => {
          searchClaims(scannedCode);
        }} 
      />
    </div>
  );
}
