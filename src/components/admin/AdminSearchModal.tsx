'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Sparkles, Coffee, Gift, User, ArrowRight, Loader2, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Product, Promotion, Profile } from '@/types';

interface AdminPageItem {
  id: string;
  name: string;
  path: string;
  category: string;
  keywords: string[];
  type: 'page';
}

const ADMIN_PAGES: AdminPageItem[] = [
  { id: 'page-dashboard', name: 'Bảng điều khiển (Dashboard)', path: '/admin/dashboard', category: 'Hệ thống', keywords: ['dashboard', 'thống kê', 'tổng quan', 'doanh thu', 'biểu đồ', 'bảng điều khiển'], type: 'page' },
  { id: 'page-menu', name: 'Quản lý Thực đơn (Menu)', path: '/admin/menu', category: 'Dịch vụ', keywords: ['menu', 'thực đơn', 'món ăn', 'nước uống', 'sản phẩm', 'cà phê', 'giá bán'], type: 'page' },
  { id: 'page-promotions', name: 'Quản lý Chương trình Ưu đãi', path: '/admin/promotions', category: 'Khách hàng', keywords: ['khuyến mãi', 'promotions', 'mã giảm giá', 'voucher', 'discount', 'giảm giá', 'ưu đãi'], type: 'page' },
  { id: 'page-loyalty', name: 'Quản lý Thành viên & Tích điểm', path: '/admin/loyalty', category: 'Khách hàng', keywords: ['thành viên', 'loyalty', 'khách hàng', 'tích điểm', 'stamps', 'points', 'hạng thành viên'], type: 'page' },
  { id: 'page-gallery', name: 'Thư viện Không gian (Gallery)', path: '/admin/gallery', category: 'Nội dung', keywords: ['gallery', 'thư viện', 'không gian', 'hình ảnh', 'album', 'ảnh', 'bộ sưu tập'], type: 'page' },
  { id: 'page-banners', name: 'Banner & Hình ảnh Quảng bá', path: '/admin/banners', category: 'Nội dung', keywords: ['banner', 'banners', 'quảng cáo', 'khuyến khích', 'hình ảnh'], type: 'page' },
  { id: 'page-hero', name: 'Ảnh bìa Trang chủ (Hero)', path: '/admin/hero', category: 'Nội dung', keywords: ['hero', 'ảnh bìa', 'trang chủ', 'giao diện'], type: 'page' },
  { id: 'page-hours', name: 'Cài đặt Cửa hàng & Giờ mở cửa', path: '/admin/hours', category: 'Hệ thống', keywords: ['giờ mở cửa', 'cài đặt', 'hours', 'cửa hàng', 'hotline', 'địa chỉ', 'bản đồ'], type: 'page' },
  { id: 'page-about', name: 'Trang Giới thiệu (Về Chúng Tôi)', path: '/admin/about', category: 'Nội dung', keywords: ['about', 'giới thiệu', 'về chúng tôi', 'thông tin'], type: 'page' },
  { id: 'page-redeem', name: 'Áp dụng mã tại quầy (Redeem)', path: '/admin/redeem', category: 'Dịch vụ', keywords: ['redeem', 'áp dụng mã', 'quét mã', 'đổi quà', 'quầy thanh toán'], type: 'page' },
];

interface SearchResult {
  products: Product[];
  promotions: Promotion[];
  members: Profile[];
}

interface AdminSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSearchModal({ isOpen, onClose }: AdminSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult>({ products: [], promotions: [], members: [] });
  const [matchedPages, setMatchedPages] = useState<AdminPageItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults({ products: [], promotions: [], members: [] });
      setMatchedPages([]);
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle Search Query with Debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults({ products: [], promotions: [], members: [] });
      setMatchedPages([]);
      setLoading(false);
      return;
    }

    // Filter pages instantly
    const termClean = query.trim().toLowerCase();
    const filteredPages = ADMIN_PAGES.filter(p => 
      p.name.toLowerCase().includes(termClean) || 
      p.keywords.some(kw => kw.includes(termClean))
    );
    setMatchedPages(filteredPages);

    setLoading(true);
    const handler = setTimeout(async () => {
      try {
        const term = `%${query.trim()}%`;

        const [productsRes, promotionsRes, membersRes] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .or(`name.ilike.${term},description.ilike.${term}`)
            .limit(5),
          supabase
            .from('promotions')
            .select('*')
            .or(`name.ilike.${term},code.ilike.${term}`)
            .limit(5),
          supabase
            .from('profiles')
            .select('*')
            .or(`display_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`)
            .limit(5),
        ]);

        setResults({
          products: (productsRes.data || []) as Product[],
          promotions: (promotionsRes.data || []) as Promotion[],
          members: (membersRes.data || []) as Profile[],
        });
      } catch (err) {
        console.error('Lỗi khi tìm kiếm:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  // Combine results for flat list navigation
  const flatResults = [
    ...matchedPages,
    ...results.products.map(item => ({ ...item, type: 'product' as const })),
    ...results.promotions.map(item => ({ ...item, type: 'promotion' as const })),
    ...results.members.map(item => ({ ...item, type: 'member' as const })),
  ];

  // Reset selection index when flatResults length changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [flatResults.length]);

  const handleSelect = (item: typeof flatResults[number]) => {
    onClose();
    if (item.type === 'page') {
      router.push(item.path);
    } else if (item.type === 'product') {
      router.push(`/admin/menu?search=${encodeURIComponent(item.name)}`);
    } else if (item.type === 'promotion') {
      router.push(`/admin/promotions?search=${encodeURIComponent(item.code)}`);
    } else if (item.type === 'member') {
      router.push(`/admin/loyalty?user_id=${item.user_id}`);
    }
  };

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatResults.length) % Math.max(1, flatResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        handleSelect(flatResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl gap-0">
        <DialogTitle className="sr-only">Tìm kiếm nhanh</DialogTitle>
        <DialogDescription className="sr-only">Tìm kiếm các món ăn, ưu đãi và thành viên trong hệ thống nhãn hàng</DialogDescription>
        <div className="relative flex items-center border-b border-border/40 p-4">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <Input
            ref={inputRef}
            placeholder="Tìm kiếm món ăn, thành viên, khuyến mãi, tính năng..."
            className="flex-1 bg-transparent border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-base h-auto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {loading ? (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          ) : (
            <div className="flex items-center gap-1">
              <kbd className="h-5 px-1.5 rounded border border-border bg-muted text-[10px] font-medium text-muted-foreground shadow-sm">ESC</kbd>
            </div>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin">
          {!query.trim() && (
            <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Tìm kiếm nhanh thông minh</p>
                <p className="text-xs text-muted-foreground/80 mt-0.5">Nhập tên món ăn, mã khuyến mãi, trang quản lý hoặc thành viên để bắt đầu.</p>
              </div>
            </div>
          )}

          {query.trim() && flatResults.length === 0 && !loading && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Không tìm thấy kết quả phù hợp với &ldquo;<span className="text-foreground font-semibold">{query}</span>&rdquo;
            </div>
          )}

          {flatResults.length > 0 && (
            <div className="space-y-4 py-2">
              {/* Pages Section */}
              {matchedPages.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Menu chức năng & Trang quản lý</div>
                  <div className="mt-1 space-y-0.5">
                    {matchedPages.map((item, index) => {
                      const flatIndex = flatResults.findIndex(f => f.type === 'page' && (f as any).id === item.id);
                      const active = flatIndex === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                            active ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-foreground'
                          }`}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-lg ${active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'} shrink-0`}>
                              <Navigation className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{item.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[9px] font-bold">Chức năng</Badge>
                            <ArrowRight className={`h-4 w-4 transition-transform duration-200 ${active ? 'translate-x-1 opacity-100' : 'opacity-0'}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Products Section */}
              {results.products.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Món ăn / Sản phẩm</div>
                  <div className="mt-1 space-y-0.5">
                    {results.products.map((item, index) => {
                      const flatIndex = flatResults.findIndex(f => f.type === 'product' && (f as any).id === item.id);
                      const active = flatIndex === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                            active ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-foreground'
                          }`}
                          onClick={() => handleSelect({ ...item, type: 'product' })}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-lg ${active ? 'bg-primary/20' : 'bg-muted'} shrink-0`}>
                              <Coffee className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{item.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.price_s && (
                              <Badge variant="outline" className="text-[10px] font-semibold border-muted-foreground/20">
                                {item.price_s.toLocaleString()}đ (S)
                              </Badge>
                            )}
                            <ArrowRight className={`h-4 w-4 transition-transform duration-200 ${active ? 'translate-x-1 opacity-100' : 'opacity-0'}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Promotions Section */}
              {results.promotions.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Khuyến mãi & Mã giảm giá</div>
                  <div className="mt-1 space-y-0.5">
                    {results.promotions.map((item, index) => {
                      const flatIndex = flatResults.findIndex(f => f.type === 'promotion' && (f as any).id === item.id);
                      const active = flatIndex === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                            active ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-foreground'
                          }`}
                          onClick={() => handleSelect({ ...item, type: 'promotion' })}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-lg ${active ? 'bg-primary/20' : 'bg-muted'} shrink-0`}>
                              <Gift className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground truncate">Mã: <span className="font-mono font-bold text-foreground">{item.code}</span></p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-[10px] font-bold border-none">
                              {item.discount}
                            </Badge>
                            <ArrowRight className={`h-4 w-4 transition-transform duration-200 ${active ? 'translate-x-1 opacity-100' : 'opacity-0'}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Members Section */}
              {results.members.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Thành viên & Khách hàng</div>
                  <div className="mt-1 space-y-0.5">
                    {results.members.map((item, index) => {
                      const flatIndex = flatResults.findIndex(f => f.type === 'member' && (f as any).user_id === item.user_id);
                      const active = flatIndex === selectedIndex;
                      return (
                        <div
                          key={item.user_id}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                            active ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-foreground'
                          }`}
                          onClick={() => handleSelect({ ...item, type: 'member' })}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-lg ${active ? 'bg-primary/20' : 'bg-muted'} shrink-0`}>
                              <User className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{item.display_name || 'Khách hàng'}</p>
                              <p className="text-xs text-muted-foreground truncate">{item.phone || item.email || 'Chưa cập nhật thông tin'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">ID: {item.user_id.slice(0, 6)}</span>
                            <ArrowRight className={`h-4 w-4 transition-transform duration-200 ${active ? 'translate-x-1 opacity-100' : 'opacity-0'}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {flatResults.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t border-border/40 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>Di chuyển bằng <kbd className="font-bold">↑</kbd> <kbd className="font-bold">↓</kbd></span>
              <span>Chọn bằng <kbd className="font-bold">Enter</kbd></span>
            </div>
            <span>Tìm thấy {flatResults.length} kết quả</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
