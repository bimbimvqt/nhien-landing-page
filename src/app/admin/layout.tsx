'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Menu, Bell, Search, User, ChevronRight, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isAdminUser } from '@/lib/auth';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Import our i18n service
import { LanguageProvider, useAdminLanguage } from '@/lib/adminLanguage';

// Import our new premium header components
import { AdminSearchModal } from '@/components/admin/AdminSearchModal';
import { AdminNotificationsDropdown } from '@/components/admin/AdminNotificationsDropdown';
import { AdminProfileDropdown } from '@/components/admin/AdminProfileDropdown';

const routeLabels: Record<string, string> = {
  '/admin/dashboard': 'nav.dashboard',
  '/admin/menu': 'nav.menu',
  '/admin/hero': 'nav.hero',
  '/admin/about': 'nav.about',
  '/admin/gallery': 'nav.gallery',
  '/admin/banners': 'nav.banners',
  '/admin/promotions': 'nav.promotions',
  '/admin/redeem': 'nav.redeem',
  '/admin/loyalty': 'nav.loyalty',
  '/admin/hours': 'nav.hours',
  '/admin/pos': 'nav.pos',
};

const AdminLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // States for interactive header features
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  
  // Consume i18n
  const { language, setLanguage, t } = useAdminLanguage();

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

      setCurrentUser(user);
      setLoading(false);
    };
    checkUser();
  }, [isLoginPage, router]);

  // Global key listener for ⌘K / Ctrl+K Quick Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
              <span className="text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer">{t('header.admin')}</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
              <span className="text-foreground font-bold">
                {t(routeLabels[pathname] as any) || t('nav.dashboard')}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Quick Search trigger button */}
            <div 
              onClick={() => setIsSearchOpen(true)}
              className="relative group hidden sm:block w-40 md:w-64 cursor-pointer"
            >
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
              <div className="pl-8 bg-muted/40 hover:bg-muted/60 border border-transparent hover:border-border/30 h-8 rounded-lg transition-all text-[11px] w-full text-muted-foreground flex items-center select-none">
                {t('header.searchPlaceholder')}
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40 pointer-events-none transition-opacity">
                <kbd className="h-4 px-1 rounded border border-border bg-muted text-[8px] font-bold">⌘</kbd>
                <kbd className="h-4 px-1 rounded border border-border bg-muted text-[8px] font-bold">K</kbd>
              </div>
            </div>

            {/* Language Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 rounded-lg font-bold text-[10px] hover:bg-muted text-muted-foreground transition-all shrink-0 border border-border/20 flex items-center gap-1"
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            >
              {language === 'vi' ? 'VI 🇻🇳' : 'EN 🇬🇧'}
            </Button>

            {/* Notification Bell with Dropdown container */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "relative h-8 w-8 rounded-lg border border-transparent transition-all",
                  isNotificationsOpen ? "bg-muted" : "hover:bg-muted"
                )}
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileOpen(false);
                }}
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border-2 border-background shadow-sm"></span>
              </Button>
              
              <AdminNotificationsDropdown 
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
              />
            </div>

            <div className="h-6 w-px bg-border mx-1"></div>

            {/* Profile Avatar with Dropdown container */}
            <div className="relative">
              <div 
                className="flex items-center gap-2 pl-1 group cursor-pointer"
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                }}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg bg-primary/10 border flex items-center justify-center overflow-hidden shadow-sm transition-all",
                  isProfileOpen ? "border-primary bg-primary/20" : "border-primary/10 group-hover:border-primary/20 group-hover:shadow-md"
                )}>
                  <User className="h-4 w-4 text-primary" />
                </div>
              </div>

              <AdminProfileDropdown 
                user={currentUser}
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>

      {/* Global Quick Search Dialog Modal */}
      <AdminSearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <LanguageProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </LanguageProvider>
  );
};

export default AdminLayout;
