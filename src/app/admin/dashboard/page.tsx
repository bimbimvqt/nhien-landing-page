'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  ChevronRight,
  Coffee,
  Gift,
  Heart,
  Image as ImageIcon,
  Loader2,
  Package,
  RefreshCw,
  Stamp,
  Tag,
  TicketCheck,
  TrendingUp,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

type TopFavoriteRow = {
  product_id: string;
  product?: {
    name?: string | null;
    category?: string | null;
  } | null;
};

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    bestSellers: 0,
    activePromos: 0,
    totalUsers: 0,
    totalFavorites: 0,
    totalClaims: 0,
    totalRedeemed: 0,
    totalStampsAwarded: 0,
  });
  const [topFavoriteRows, setTopFavoriteRows] = useState<TopFavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    const [
      productCount,
      bestSellerCount,
      activePromoCount,
      userCount,
      favoriteCount,
      claimCount,
      redeemedCount,
      stampRows,
      favoriteRows,
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_best_seller', true),
      supabase
        .from('promotions')
        .select('*', { count: 'exact', head: true })
        .eq('active', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('favorites').select('*', { count: 'exact', head: true }),
      supabase.from('promotion_claims').select('*', { count: 'exact', head: true }),
      supabase.from('promotion_claims').select('redeemed_count'),
      supabase.from('loyalty_transactions').select('stamps'),
      supabase
        .from('favorites')
        .select('product_id, product:products(name, category)')
        .limit(500),
    ]);

    if (productCount.error) {
      setError(productCount.error.message);
    }

    setStats({
      totalProducts: productCount.count || 0,
      bestSellers: bestSellerCount.count || 0,
      activePromos: activePromoCount.count || 0,
      totalUsers: userCount.count || 0,
      totalFavorites: favoriteCount.count || 0,
      totalClaims: claimCount.count || 0,
      totalRedeemed:
        redeemedCount.data?.reduce(
          (sum, row) => sum + Math.max(0, Number(row.redeemed_count) || 0),
          0,
        ) || 0,
      totalStampsAwarded:
        stampRows.data?.reduce((sum, row) => sum + Math.max(0, Number(row.stamps) || 0), 0) || 0,
    });
    setTopFavoriteRows((favoriteRows.data || []) as unknown as TopFavoriteRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchStats();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchStats]);

  const redeemedRate =
    stats.totalClaims > 0 ? Math.round((stats.totalRedeemed / stats.totalClaims) * 100) : 0;

  const topFavorites = useMemo(() => {
    const favoriteMap = new Map<
      string,
      { productId: string; name: string; category: string; count: number }
    >();

    topFavoriteRows.forEach((row) => {
      const current = favoriteMap.get(row.product_id);
      favoriteMap.set(row.product_id, {
        productId: row.product_id,
        name: current?.name || row.product?.name || 'Món chưa rõ',
        category: current?.category || row.product?.category || 'Thực đơn',
        count: (current?.count || 0) + 1,
      });
    });

    return Array.from(favoriteMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [topFavoriteRows]);

  const statCards = [
    {
      title: 'Tổng user',
      value: stats.totalUsers.toString(),
      icon: Users,
      detail: 'profiles đã tạo',
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    },
    {
      title: 'Mã đã nhận',
      value: stats.totalClaims.toString(),
      icon: Gift,
      detail: `${stats.totalRedeemed} đã áp dụng`,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      title: 'Món yêu thích',
      value: stats.totalFavorites.toString(),
      icon: Heart,
      detail: 'lượt lưu món',
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-500/10',
    },
    {
      title: 'Stamp đã cộng',
      value: stats.totalStampsAwarded.toString(),
      icon: Stamp,
      detail: 'từ loyalty history',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Tổng quan hệ thống
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analytics từ Supabase cho user, ưu đãi, favorite và stamp.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={fetchStats}
            disabled={loading}
            className="border-border bg-background"
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
            Làm mới
          </Button>
          <Link href="/admin/redeem">
            <Button className="shadow-lg shadow-primary/20">
              <TicketCheck className="mr-2 h-4 w-4" />
              Áp dụng mã
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className="border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={cn('rounded-lg p-2', stat.bg)}>
                <stat.icon className={cn('h-4 w-4', stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stat.value}
              </div>
              <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                {stat.detail}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="overflow-hidden border-border/50 bg-card shadow-sm lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-foreground">Hiệu quả khuyến mãi</CardTitle>
              <CardDescription>
                Tỷ lệ mã đã nhận được áp dụng tại quầy.
              </CardDescription>
            </div>
            <BarChart3 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="space-y-6 border-t border-border/50 bg-muted/20 p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label="Mã active" value={stats.activePromos.toString()} />
              <Metric label="Đã nhận" value={stats.totalClaims.toString()} />
              <Metric label="Đã áp dụng" value={stats.totalRedeemed.toString()} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm font-bold">
                <span>Tỷ lệ áp dụng</span>
                <span>{redeemedRate}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${redeemedRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-foreground">Món được lưu nhiều</CardTitle>
              <CardDescription>Top favorite từ khách đã đăng nhập.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {topFavorites.length === 0 ? (
                <div className="rounded-xl bg-muted/40 p-4 text-sm font-semibold text-muted-foreground">
                  Chưa có dữ liệu favorite.
                </div>
              ) : (
                topFavorites.map((item, index) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted font-black text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">{item.category}</p>
                    </div>
                    <span className="text-sm font-black text-primary">{item.count}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-foreground">Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {[
                { label: 'Cập nhật menu', href: '/admin/menu', icon: Coffee, desc: 'Quản lý món uống và giá cả' },
                { label: 'Ảnh quảng bá', href: '/admin/banners', icon: ImageIcon, desc: 'Chỉnh sửa banner trang chủ' },
                { label: 'Chương trình ưu đãi', href: '/admin/promotions', icon: Tag, desc: 'Thiết lập mã giảm giá' },
                { label: 'Áp dụng mã tại quầy', href: '/admin/redeem', icon: TicketCheck, desc: 'Redeem code và tăng usage' },
                { label: 'Cộng stamp thành viên', href: '/admin/loyalty', icon: Stamp, desc: 'Tìm khách và cập nhật điểm' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card p-3 transition-all hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat icon={<Package className="h-4 w-4" />} label="Sản phẩm" value={stats.totalProducts} />
        <MiniStat icon={<TrendingUp className="h-4 w-4" />} label="Best seller" value={stats.bestSellers} />
        <MiniStat icon={<Users className="h-4 w-4" />} label="User có profile" value={stats.totalUsers} />
        <MiniStat icon={<Heart className="h-4 w-4" />} label="Favorite" value={stats.totalFavorites} />
      </div>
    </div>
  );
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-background p-5">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-foreground">{value}</p>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4">
      <div className="rounded-xl bg-muted p-2 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs font-bold text-muted-foreground">{label}</p>
        <p className="text-lg font-black text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default DashboardPage;
