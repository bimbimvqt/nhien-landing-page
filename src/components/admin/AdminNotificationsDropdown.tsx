'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell, UserPlus, Sparkles, Gift, Check, ShoppingBag, Loader2, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface NotificationItem {
  id: string;
  type: 'loyalty' | 'signup' | 'claim';
  title: string;
  description: string;
  timestamp: Date;
  metaId?: string; // used for redirection if needed
}

interface AdminNotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminNotificationsDropdown({ isOpen, onClose }: AdminNotificationsDropdownProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const fetchRecentEvents = async () => {
    setLoading(true);
    try {
      // 1. Fetch recent loyalty transactions
      const { data: txs } = await supabase
        .from('loyalty_transactions')
        .select('id, user_id, points, stamps, note, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // 2. Fetch recent new user profiles
      const { data: newUsers } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, phone, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // 3. Fetch recent promotion claims
      const { data: claims } = await supabase
        .from('promotion_claims')
        .select('id, user_id, claimed_at, promotion_id')
        .order('claimed_at', { ascending: false })
        .limit(5);

      // Gather profile info to map names
      const allUserIds = Array.from(
        new Set([
          ...(txs || []).map((t) => t.user_id),
          ...(claims || []).map((c) => c.user_id),
        ])
      );

      let userMap: Record<string, { display_name: string; email: string }> = {};
      if (allUserIds.length > 0) {
        const { data: fetchedUsers } = await supabase
          .from('profiles')
          .select('user_id, display_name, email')
          .in('user_id', allUserIds);

        userMap = (fetchedUsers || []).reduce((acc, curr) => {
          acc[curr.user_id] = {
            display_name: curr.display_name || 'Khách hàng',
            email: curr.email || '',
          };
          return acc;
        }, {} as Record<string, { display_name: string; email: string }>);
      }

      // Gather promotions info to map codes
      const allPromoIds = Array.from(new Set((claims || []).map((c) => c.promotion_id)));
      let promoMap: Record<string, { name: string; code: string }> = {};
      if (allPromoIds.length > 0) {
        const { data: fetchedPromos } = await supabase
          .from('promotions')
          .select('id, name, code')
          .in('id', allPromoIds);

        promoMap = (fetchedPromos || []).reduce((acc, curr) => {
          acc[curr.id] = { name: curr.name, code: curr.code };
          return acc;
        }, {} as Record<string, { name: string; code: string }>);
      }

      // Format events into notification items
      const list: NotificationItem[] = [];

      // Add Loyalty Transactions
      (txs || []).forEach((t) => {
        const user = userMap[t.user_id] || { display_name: 'Khách hàng' };
        let desc = '';
        if (t.stamps > 0 && t.points > 0) {
          desc = `Tích lũy ${t.stamps} stamp và ${t.points} điểm`;
        } else if (t.stamps > 0) {
          desc = `Tích lũy ${t.stamps} stamp`;
        } else if (t.points > 0) {
          desc = `Tích lũy ${t.points} điểm`;
        } else {
          desc = t.note || 'Cập nhật điểm thành viên';
        }

        list.push({
          id: `loyalty-${t.id}`,
          type: 'loyalty',
          title: user.display_name,
          description: desc,
          timestamp: new Date(t.created_at),
          metaId: t.user_id,
        });
      });

      // Add New User Signups
      (newUsers || []).forEach((u) => {
        list.push({
          id: `signup-${u.user_id}`,
          type: 'signup',
          title: u.display_name || 'Thành viên mới',
          description: `Đăng ký tài khoản thành viên (${u.phone || u.email || 'Ẩn danh'})`,
          timestamp: new Date(u.created_at),
          metaId: u.user_id,
        });
      });

      // Add Promotion Claims
      (claims || []).forEach((c) => {
        const user = userMap[c.user_id] || { display_name: 'Khách hàng' };
        const promo = promoMap[c.promotion_id] || { name: 'Khuyến mãi', code: '' };
        list.push({
          id: `claim-${c.id}`,
          type: 'claim',
          title: user.display_name,
          description: `Nhận khuyến mãi "${promo.name}" (${promo.code})`,
          timestamp: new Date(c.claimed_at),
          metaId: c.user_id,
        });
      });

      // Sort by newest first
      list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Limit to 8 items
      const recentNotifications = list.slice(0, 8);
      setNotifications(recentNotifications);

      // Check if there are any updates in last 24h
      const now = new Date();
      const hasRecent = recentNotifications.some(
        (n) => now.getTime() - n.timestamp.getTime() < 24 * 60 * 60 * 1000
      );
      setHasUnread(hasRecent);
    } catch (error) {
      console.error('Lỗi khi tải thông báo hoạt động:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentEvents();

    // Subscribe to real-time changes across profiles, transactions, and claims
    const channel = supabase
      .channel('admin-realtime-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        () => {
          void fetchRecentEvents();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'loyalty_transactions' },
        () => {
          void fetchRecentEvents();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'promotion_claims' },
        () => {
          void fetchRecentEvents();
        }
      )
      .subscribe();

    // Secondary fallback polling every 60 seconds
    const interval = setInterval(fetchRecentEvents, 60000);

    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, []);

  const handleItemClick = (item: NotificationItem) => {
    onClose();
    if (item.type === 'loyalty' || item.type === 'signup' || item.type === 'claim') {
      if (item.metaId) {
        router.push(`/admin/loyalty?user_id=${item.metaId}`);
      } else {
        router.push('/admin/loyalty');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Click Outside Overlay */}
      <div className="fixed inset-0 z-40 cursor-default" onClick={onClose} />

      <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-sm rounded-2xl border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl p-0 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">Hoạt động gần đây</span>
            {hasUnread && (
              <span className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-pulse" />
            )}
          </div>
          <button
            onClick={() => {
              setHasUnread(false);
              onClose();
              router.push('/admin/loyalty');
            }}
            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
          >
            Quản lý thành viên <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[360px] overflow-y-auto p-1.5 scrollbar-thin">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground text-xs">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <span>Đang tải hoạt động mới...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="p-3 rounded-full bg-muted text-muted-foreground">
                <Check className="h-5 w-5" />
              </div>
              <span className="text-xs text-muted-foreground">Không có hoạt động mới nào</span>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((item) => {
                let icon = <Sparkles className="h-3.5 w-3.5" />;
                let colorClass = 'bg-primary/10 text-primary';
                if (item.type === 'signup') {
                  icon = <UserPlus className="h-3.5 w-3.5" />;
                  colorClass = 'bg-sky-500/10 text-sky-500';
                } else if (item.type === 'claim') {
                  icon = <Gift className="h-3.5 w-3.5" />;
                  colorClass = 'bg-amber-500/10 text-amber-500';
                } else if (item.type === 'loyalty') {
                  icon = <ShoppingBag className="h-3.5 w-3.5" />;
                  colorClass = 'bg-emerald-500/10 text-emerald-500';
                }

                return (
                  <div
                    key={item.id}
                    className="flex gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 cursor-pointer transition-all duration-200"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className={`p-2 rounded-lg ${colorClass} shrink-0 self-start mt-0.5`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground/90 mt-0.5 leading-relaxed break-words">
                        {item.description}
                      </p>
                      <p className="text-[9px] text-muted-foreground/60 mt-1.5">
                        {formatDistanceToNow(item.timestamp, { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
