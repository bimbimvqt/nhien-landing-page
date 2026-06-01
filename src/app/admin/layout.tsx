'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Menu, Bell, Search, User, ChevronRight, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { isAdminUser } from '@/lib/auth';

const routeLabels: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/menu': 'Thực đơn',
  '/admin/hero': 'Ảnh Hero',
  '/admin/banners': 'Banner & Hình ảnh',
  '/admin/promotions': 'Khuyến mãi',
  '/admin/redeem': 'Áp dụng mã',
  '/admin/loyalty': 'Thành viên',
  '/admin/hours': 'Cài đặt cửa hàng',
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/admin/login');
        return;
      }

      if (!isAdminUser(user)) {
        router.replace('/');
        return;
      }

      setLoading(false);
    };
    checkUser();
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-primary/10 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute font-black text-[10px] text-primary">N</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className={cn(
        "flex-1 flex flex-col min-w-0 relative transition-all duration-300",
        isCollapsed ? "lg:ml-[70px]" : "lg:ml-64"
      )}>
        <header className="h-14 border-b border-border/50 bg-background/60 backdrop-blur-md sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 rounded-lg hover:bg-muted"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>

            {isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground transition-all"
                onClick={() => setIsCollapsed(false)}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            )}

            <nav className="hidden md:flex items-center gap-2 text-xs font-medium">
              <span className="text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer">Admin</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
              <span className="text-foreground font-bold">{routeLabels[pathname] || 'Quản trị'}</span>
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative group hidden sm:block w-40 md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Tìm kiếm nhanh..."
                className="pl-8 bg-muted/40 border-transparent focus:bg-background focus:border-border h-8 rounded-lg transition-all text-[11px] w-full text-foreground"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40 pointer-events-none group-focus-within:opacity-0 transition-opacity">
                <kbd className="h-4 px-1 rounded border border-border bg-muted text-[8px] font-bold">⌘</kbd>
                <kbd className="h-4 px-1 rounded border border-border bg-muted text-[8px] font-bold">K</kbd>
              </div>
            </div>

            <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-lg hover:bg-muted border border-transparent transition-all">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border-2 border-background shadow-sm"></span>
            </Button>

            <div className="h-6 w-px bg-border mx-1"></div>

            <div className="flex items-center gap-2 pl-1 group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/10 flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all">
                <User className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
