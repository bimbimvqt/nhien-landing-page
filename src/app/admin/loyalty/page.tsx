'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Gift,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  Stamp,
  Trophy,
  UserRound,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import type { LoyaltyAccount, LoyaltyTransaction, Profile } from '@/types';

type ProfileWithLoyalty = Profile & {
  loyalty?: LoyaltyAccount | null;
};

const STAMPS_FOR_REWARD = 8;

function getTier(points: number, stamps: number) {
  const score = points + stamps * 10;

  if (score >= 500) {
    return 'Gold';
  }

  if (score >= 200) {
    return 'Silver';
  }

  return 'Member';
}

export default function LoyaltyPage() {
  const searchParams = useSearchParams();
  const urlUserId = searchParams ? searchParams.get('user_id') : null;

  const [profiles, setProfiles] = useState<ProfileWithLoyalty[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [query, setQuery] = useState('');
  const [stampInput, setStampInput] = useState(1);
  const [pointInput, setPointInput] = useState(0);
  const [note, setNote] = useState('Mua hàng tại quán');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedProfile = profiles.find((profile) => profile.user_id === selectedUserId) || null;

  const fetchMembers = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const [profilesResult, accountsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('user_id, display_name, email, phone, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(100),
      supabase.from('loyalty_accounts').select('*'),
    ]);

    if (profilesResult.error || accountsResult.error) {
      setError('Cần chạy supabase_customer_engagement.sql để quản lý thành viên.');
      setProfiles([]);
      setLoading(false);
      return;
    }

    const accountMap = new Map(
      (accountsResult.data || []).map((account) => [account.user_id, account as LoyaltyAccount]),
    );
    const nextProfiles = (profilesResult.data || []).map((profile) => ({
      ...(profile as Profile),
      loyalty: accountMap.get(profile.user_id) || null,
    }));

    setProfiles(nextProfiles);
    setSelectedUserId((current) => urlUserId || current || nextProfiles[0]?.user_id || null);
    setLoading(false);
  }, [urlUserId]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchMembers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchMembers]);

  React.useEffect(() => {
    if (urlUserId) {
      setSelectedUserId(urlUserId);
    }
  }, [urlUserId]);

  const fetchTransactions = React.useCallback(async (userId: string | null) => {
    if (!userId) {
      setTransactions([]);
      return;
    }

    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      setTransactions([]);
    } else {
      setTransactions((data || []) as LoyaltyTransaction[]);
    }
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchTransactions(selectedUserId);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchTransactions, selectedUserId]);

  const filteredProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return profiles;
    }

    return profiles.filter((profile) =>
      [profile.display_name, profile.email, profile.phone, profile.user_id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [profiles, query]);

  const updateLoyalty = async ({
    stampsDelta,
    pointsDelta,
    transactionNote,
  }: {
    stampsDelta: number;
    pointsDelta: number;
    transactionNote: string;
  }) => {
    if (!selectedProfile) {
      setMessage('Chọn khách hàng trước khi cập nhật.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    const current = selectedProfile.loyalty;
    const nextStamps = Math.max(0, (current?.stamps || 0) + stampsDelta);
    const nextPoints = Math.max(0, (current?.points || 0) + pointsDelta);
    const nextTier = getTier(nextPoints, nextStamps);

    const [accountResult, transactionResult] = await Promise.all([
      supabase
        .from('loyalty_accounts')
        .upsert(
          {
            user_id: selectedProfile.user_id,
            stamps: nextStamps,
            points: nextPoints,
            tier: nextTier,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
        .select('*')
        .single(),
      supabase.from('loyalty_transactions').insert({
        user_id: selectedProfile.user_id,
        stamps: stampsDelta,
        points: pointsDelta,
        note: transactionNote,
      }),
    ]);

    if (accountResult.error || transactionResult.error) {
      setError(accountResult.error?.message || transactionResult.error?.message || 'Không thể cập nhật điểm.');
      setSaving(false);
      return;
    }

    setProfiles((currentProfiles) =>
      currentProfiles.map((profile) =>
        profile.user_id === selectedProfile.user_id
          ? { ...profile, loyalty: accountResult.data as LoyaltyAccount }
          : profile,
      ),
    );
    await fetchTransactions(selectedProfile.user_id);
    setMessage('Đã cập nhật điểm thành viên.');
    setSaving(false);
  };

  const handleAdd = async () => {
    await updateLoyalty({
      stampsDelta: stampInput,
      pointsDelta: pointInput,
      transactionNote: note.trim() || 'Cộng điểm tại quán',
    });
  };

  const handleRedeem = async () => {
    await updateLoyalty({
      stampsDelta: -STAMPS_FOR_REWARD,
      pointsDelta: 0,
      transactionNote: 'Đổi 8 stamp lấy 1 món tặng',
    });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Thành viên & Stamp
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tìm khách đã đăng nhập, cộng stamp/điểm và ghi lịch sử tại quầy.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fetchMembers}
          disabled={loading || saving}
          className="h-10 rounded-xl border-border bg-card px-4"
        >
          <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
          Làm mới
        </Button>
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
          {error ? <Sparkles className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {error || message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="h-fit overflow-hidden rounded-[28px] border-border/50 bg-card shadow-sm">
          <CardHeader className="border-b border-border/50 p-6">
            <CardTitle className="text-lg text-foreground">Danh sách khách</CardTitle>
            <CardDescription>
              Khách xuất hiện ở đây sau lần đăng nhập profile đầu tiên.
            </CardDescription>
            <div className="relative pt-2">
              <Search className="absolute left-3.5 top-[calc(50%+4px)] h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tên, email, số điện thoại, mã..."
                className="h-11 rounded-xl border-transparent bg-muted/40 pl-10 text-foreground focus-visible:border-border focus-visible:bg-background"
              />
            </div>
          </CardHeader>
          <CardContent className="max-h-[620px] space-y-2 overflow-y-auto p-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="rounded-2xl bg-muted/40 p-5 text-center text-sm font-semibold text-muted-foreground">
                Chưa có khách phù hợp.
              </div>
            ) : (
              filteredProfiles.map((profile) => (
                <button
                  key={profile.user_id}
                  type="button"
                  onClick={() => setSelectedUserId(profile.user_id)}
                  className={cn(
                    'w-full rounded-2xl border p-4 text-left transition-all',
                    selectedUserId === profile.user_id
                      ? 'border-primary/40 bg-primary/5 shadow-sm'
                      : 'border-transparent bg-muted/25 hover:border-border hover:bg-muted/45',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-foreground">
                        {profile.display_name || profile.email || 'Khách hàng'}
                      </p>
                      <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                        {profile.email || profile.user_id}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                      {profile.loyalty?.tier || 'Member'}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-muted-foreground">
                    <span>{profile.loyalty?.stamps || 0} stamp</span>
                    <span>{profile.loyalty?.points || 0} điểm</span>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden rounded-[28px] border-border/50 bg-card shadow-sm">
            <CardHeader className="border-b border-border/50 bg-card p-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Stamp className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl font-black italic text-foreground">
                {selectedProfile?.display_name || selectedProfile?.email || 'Chọn khách hàng'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Cộng 1 stamp cho mỗi ly, đủ {STAMPS_FOR_REWARD} stamp có thể đổi 1 món.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 md:p-8">
              {selectedProfile ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <StatBox icon={<Trophy className="h-5 w-5" />} label="Hạng" value={selectedProfile.loyalty?.tier || 'Member'} />
                    <StatBox icon={<Gift className="h-5 w-5" />} label="Stamp" value={`${selectedProfile.loyalty?.stamps || 0}/${STAMPS_FOR_REWARD}`} />
                    <StatBox icon={<Sparkles className="h-5 w-5" />} label="Điểm" value={`${selectedProfile.loyalty?.points || 0}`} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <ContactTile icon={<Mail className="h-4 w-4" />} label="Email" value={selectedProfile.email || '-'} />
                    <ContactTile icon={<Phone className="h-4 w-4" />} label="Điện thoại" value={selectedProfile.phone || 'Chưa có'} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr_1fr_2fr]">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Stamp cộng
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={stampInput}
                        onChange={(event) => setStampInput(Number(event.target.value))}
                        className="h-12 rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Điểm cộng
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={pointInput}
                        onChange={(event) => setPointInput(Number(event.target.value))}
                        className="h-12 rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Ghi chú
                      </Label>
                      <Input
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        className="h-12 rounded-2xl"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      disabled={saving}
                      onClick={handleAdd}
                      className="h-12 flex-1 rounded-2xl font-black"
                    >
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Stamp className="mr-2 h-4 w-4" />}
                      Cộng stamp/điểm
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={saving || (selectedProfile.loyalty?.stamps || 0) < STAMPS_FOR_REWARD}
                      onClick={handleRedeem}
                      className="h-12 flex-1 rounded-2xl border-border bg-background font-black"
                    >
                      <Gift className="mr-2 h-4 w-4" />
                      Đổi 8 stamp
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-3xl bg-muted/40 p-10 text-center text-muted-foreground">
                  <UserRound className="mx-auto mb-4 h-8 w-8" />
                  Chọn một khách hàng để cập nhật stamp.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[28px] border-border/50 bg-card shadow-sm">
            <CardHeader className="border-b border-border/50 p-6">
              <CardTitle className="text-lg text-foreground">Lịch sử gần đây</CardTitle>
              <CardDescription>5-8 giao dịch mới nhất của khách đang chọn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-6">
              {transactions.length === 0 ? (
                <div className="rounded-2xl bg-muted/35 p-5 text-sm font-semibold text-muted-foreground">
                  Chưa có giao dịch điểm.
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                    <p className="font-bold text-foreground">{transaction.note || 'Cập nhật điểm'}</p>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">
                      {transaction.points > 0 ? '+' : ''}
                      {transaction.points} điểm · {transaction.stamps > 0 ? '+' : ''}
                      {transaction.stamps} stamp
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      {new Intl.DateTimeFormat('vi-VN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(transaction.created_at))}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-muted/35 p-5">
      <div className="mb-4 text-primary">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black text-foreground">{value}</p>
    </div>
  );
}

function ContactTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-border/50 p-4">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
      </div>
      <p className="break-words text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
