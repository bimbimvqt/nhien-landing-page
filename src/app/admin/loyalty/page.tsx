'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Gift,
  Loader2,
  Mail,
  Percent,
  Phone,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Sparkles,
  Stamp,
  Trophy,
  UserRound,
} from 'lucide-react';

import { toast } from 'sonner';

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
import { fetchAdminApi } from '@/lib/adminApi';
import { cn } from '@/lib/utils';

import type { LoyaltyAccount, LoyaltyTransaction, MemberTiersSettings, Profile } from '@/types';
import { DEFAULT_MEMBER_TIERS } from '@/types';

type ProfileWithLoyalty = Profile & {
  loyalty?: LoyaltyAccount | null;
};

const STAMPS_FOR_REWARD = 8;

function getTier(points: number, tiers: MemberTiersSettings) {
  if (points >= tiers.platinum.points_threshold) return 'Platinum';
  if (points >= tiers.gold.points_threshold) return 'Gold';
  if (points >= tiers.silver.points_threshold) return 'Silver';
  return 'Member';
}

// ──────────────────────────────────────────────
// Tier visual metadata
// ──────────────────────────────────────────────
const TIER_META = {
  silver: {
    label: 'Bạc',
    emoji: '🥈',
    gradient: 'from-slate-300 to-slate-400',
    // inline style colors (theme-aware via rgba)
    accentBg: 'rgba(148,163,184,0.08)',
    accentBorder: 'rgba(148,163,184,0.25)',
    accentGlow: 'rgba(148,163,184,0.15)',
    gradFrom: '#94a3b8',
    gradTo: '#cbd5e1',
    text: 'text-slate-400',
    badgeGrad: 'from-slate-300 to-slate-400',
  },
  gold: {
    label: 'Vàng',
    emoji: '🥇',
    gradient: 'from-yellow-400 to-amber-500',
    accentBg: 'rgba(245,158,11,0.08)',
    accentBorder: 'rgba(245,158,11,0.3)',
    accentGlow: 'rgba(245,158,11,0.12)',
    gradFrom: '#f59e0b',
    gradTo: '#fbbf24',
    text: 'text-amber-400',
    badgeGrad: 'from-yellow-300 to-amber-500',
  },
  platinum: {
    label: 'Bạch Kim',
    emoji: '💎',
    gradient: 'from-purple-400 to-pink-500',
    accentBg: 'rgba(167,139,250,0.08)',
    accentBorder: 'rgba(167,139,250,0.3)',
    accentGlow: 'rgba(167,139,250,0.12)',
    gradFrom: '#a78bfa',
    gradTo: '#ec4899',
    text: 'text-purple-400',
    badgeGrad: 'from-purple-400 to-pink-500',
  },
} as const;

type TierKey = keyof typeof TIER_META;

// ──────────────────────────────────────────────
// Tier Settings Panel
// ──────────────────────────────────────────────

interface TierSettingsPanelProps {
  tiers: MemberTiersSettings;
  onChange: (tiers: MemberTiersSettings) => void;
  onSave: () => void;
  saving: boolean;
}

function TierSettingsPanel({ tiers, onChange, onSave, saving }: TierSettingsPanelProps) {

  const handleChange = (key: TierKey, field: keyof MemberTiersSettings['silver'], value: string | number) => {
    onChange({
      ...tiers,
      [key]: {
        ...tiers[key],
        [field]: typeof value === 'string' ? value : Number(value),
      },
    });
  };

  return (
    <Card className="overflow-hidden rounded-[28px] border-border/50 bg-card shadow-sm">
      <CardHeader className="border-b border-border/50 p-6 md:p-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Settings2 className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl font-black text-foreground">
          Cấu hình hạng thành viên
        </CardTitle>
        <CardDescription>
          Đặt ngưỡng điểm để đạt hạng và tỉ lệ giảm giá trên tổng bill cho từng hạng.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 p-6 md:p-8">
        {(['silver', 'gold', 'platinum'] as TierKey[]).map((key) => {
          const meta = TIER_META[key];
          const config = tiers[key];

          return (
            <div
              key={key}
              className="relative overflow-hidden rounded-3xl border p-5 transition-all"
              style={{
                background: meta.accentBg,
                borderColor: meta.accentBorder,
                boxShadow: `0 4px 20px -4px ${meta.accentGlow}`,
              }}
            >
              {/* Header row */}
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-2xl text-lg font-black shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${meta.gradFrom}, ${meta.gradTo})`,
                  }}
                >
                  {key === 'silver' ? '🥈' : key === 'gold' ? '🥇' : '💎'}
                </div>
                <div>
                  <h3
                    className="text-sm font-black"
                    style={{
                      background: `linear-gradient(135deg, ${meta.gradFrom}, ${meta.gradTo})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Hạng {meta.label}
                  </h3>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {key === 'silver'
                      ? 'Hạng cơ bản — không có quyền lợi đặc biệt'
                      : 'Có quyền lợi giảm giá trên tổng bill'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Threshold */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Ngưỡng điểm tích lũy
                  </Label>
                  <div className="relative">
                    <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="number"
                      min={0}
                      value={config.points_threshold}
                      onChange={(e) => handleChange(key, 'points_threshold', e.target.value)}
                      className="h-11 rounded-2xl pl-9"
                    />
                  </div>
                </div>

                {/* Discount % */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Giảm giá (%)
                  </Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={config.discount_percent}
                      onChange={(e) => handleChange(key, 'discount_percent', e.target.value)}
                      disabled={key === 'silver'}
                      className="h-11 rounded-2xl pl-9"
                    />
                  </div>
                  {key === 'silver' && (
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Hạng bạc không có giảm giá
                    </p>
                  )}
                </div>

                {/* Discount label */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Mô tả quyền lợi
                  </Label>
                  <Input
                    value={config.discount_label}
                    onChange={(e) => handleChange(key, 'discount_label', e.target.value)}
                    placeholder={
                      key === 'silver'
                        ? 'Ví dụ: Tích điểm cơ bản'
                        : `Ví dụ: Giảm ${config.discount_percent}% tổng bill`
                    }
                    disabled={key === 'silver'}
                    className="h-11 rounded-2xl"
                  />
                </div>
              </div>

              {/* Preview badge */}
              {key !== 'silver' && config.discount_percent > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground">Preview:</span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black text-white shadow',
                      `bg-gradient-to-r ${meta.gradient}`,
                    )}
                  >
                    <Percent className="h-2.5 w-2.5" />
                    {config.discount_label || `Giảm ${config.discount_percent}%`}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Save button */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="h-11 flex-1 rounded-2xl font-black"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Lưu cấu hình hạng
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────

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

  // Tier settings state
  const [memberTiers, setMemberTiers] = useState<MemberTiersSettings>(DEFAULT_MEMBER_TIERS);
  const [tierSaving, setTierSaving] = useState(false);

  const selectedProfile = profiles.find((profile) => profile.user_id === selectedUserId) || null;

  const fetchMembers = React.useCallback(async () => {
    setLoading(true);

    const [profilesResult, accountsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('user_id, display_name, email, phone, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(100),
      supabase.from('loyalty_accounts').select('*'),
    ]);

    if (profilesResult.error || accountsResult.error) {
      toast.error('Cần chạy supabase_customer_engagement.sql để quản lý thành viên.');
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

  // Load store settings (for member tiers)
  const fetchSettings = React.useCallback(async () => {
    try {
      const res = await fetchAdminApi('/api/admin/store-settings');
      if (!res.ok) return;

      const data = await res.json();
      if (data?.member_tiers) {
        setMemberTiers(data.member_tiers);
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchMembers();
      void fetchSettings();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchMembers, fetchSettings]);

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
      toast.warning('Chọn khách hàng trước khi cập nhật.');
      return;
    }

    setSaving(true);

    const current = selectedProfile.loyalty;
    const nextStamps = Math.max(0, (current?.stamps || 0) + stampsDelta);
    const nextPoints = Math.max(0, (current?.points || 0) + pointsDelta);
    const nextTier = getTier(nextPoints, memberTiers);

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
      toast.error(accountResult.error?.message || transactionResult.error?.message || 'Không thể cập nhật điểm.');
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
    toast.success('Đã cập nhật điểm thành viên.');
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

  const handleSaveTierSettings = async () => {
    setTierSaving(true);

    try {
      // 1. Fetch current settings
      const currentRes = await fetchAdminApi('/api/admin/store-settings');
      if (!currentRes.ok) {
        throw new Error('Không thể tải cấu hình cửa hàng hiện tại để cập nhật');
      }
      const currentSettings = await currentRes.json();

      // 2. Merge with new member tiers
      const payload = {
        ...currentSettings,
        member_tiers: memberTiers,
      };

      // 3. Save full settings back
      const res = await fetchAdminApi('/api/admin/store-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });



      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Không thể lưu cài đặt');
      }

      toast.success('Đã lưu cấu hình hạng thành viên!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi lưu cấu hình');
    } finally {
      setTierSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Thành viên & Stamp
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tìm khách đã đăng nhập, cộng stamp/điểm và cấu hình hạng thành viên.
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



      {/* ── Main layout ────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        {/* Left: member list */}
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
              filteredProfiles.map((profile) => {
                const tierKey = (profile.loyalty?.tier?.toLowerCase() as TierKey) || 'silver';
                const meta = TIER_META[tierKey in TIER_META ? tierKey : 'silver'];
                return (
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
                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white"
                        style={{
                          background: `linear-gradient(135deg, ${meta.gradFrom}, ${meta.gradTo})`,
                        }}
                      >
                        {profile.loyalty?.tier || 'Member'}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-muted-foreground">
                      <span>{profile.loyalty?.stamps || 0} stamp</span>
                      <span>{profile.loyalty?.points || 0} điểm</span>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Right: update + history + tier settings */}
        <div className="space-y-6">
          {/* Update card */}
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

          {/* Transaction history */}
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

          {/* ── Tier settings panel ────────────────────── */}
          <TierSettingsPanel
            tiers={memberTiers}
            onChange={setMemberTiers}
            onSave={handleSaveTierSettings}
            saving={tierSaving}
          />

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
