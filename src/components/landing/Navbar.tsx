'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenuAlt3, HiX } from 'react-icons/hi';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { User } from '@supabase/supabase-js';
import { SeraButton } from '@/components/sera/button';
import { SeraGoogleLoginForm } from '@/components/auth/SeraGoogleLoginForm';
import { supabase } from '@/lib/supabaseClient';
import { getAuthRedirectUrl, getUserAvatarUrl, getUserDisplayName } from '@/lib/auth';

const subscribeToMounted = () => () => {};
const getMountedSnapshot = () => true;
const getServerMountedSnapshot = () => false;

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const isMounted = useSyncExternalStore(
    subscribeToMounted,
    getMountedSnapshot,
    getServerMountedSnapshot
  );
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const userName = getUserDisplayName(user);
  const userAvatar = getUserAvatarUrl(user);
  const isHomePage = pathname === '/';
  const isSolid = isScrolled || !isHomePage;
  const isDarkTheme = isMounted && resolvedTheme === 'dark';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    // SEO & UX: Reset scroll position on reload
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }

      // Check if this is a page reload (F5) vs a direct link visit
      const navEntries = performance.getEntriesByType('navigation');
      const isReload = navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === 'reload';

      if (isReload) {
        // If user refreshed, remove the hash from URL and go to top
        if (window.location.hash) {
          // Use Next.js router instead of native history to keep state in sync
          const url = window.location.pathname + window.location.search;
          window.history.replaceState(null, '', url); // clear natively first
          // We can also trigger a hashchange or just let the links handle it via JS
        }
        setTimeout(() => window.scrollTo(0, 0), 10);
      } else {
        // Direct visit (e.g. shared link with #menu)
        if (!window.location.hash || window.location.hash === '#home') {
          setTimeout(() => window.scrollTo(0, 0), 10);
        }
      }
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleOpenLogin = () => {
      setIsMobileMenuOpen(false);
      setIsLoginOpen(true);
    };

    window.addEventListener('nhien:open-login', handleOpenLogin);
    return () => window.removeEventListener('nhien:open-login', handleOpenLogin);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setAuthLoading(false);
      setIsLoginOpen(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl('/'),
      },
    });

    if (error) {
      console.error('Google login failed:', error);
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
      console.error('Email login failed:', error);
      setAuthError(error.message);
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const navLinks = [
    { name: 'Trang chủ', href: '/#home' },
    { name: 'Về chúng tôi', href: '/#about' },
    { name: 'Thực đơn', href: '/#menu' },
    { name: 'Ưu đãi', href: '/#promotions' },
    { name: 'Không gian', href: '/#gallery' },
    { name: 'Liên hệ', href: '/#contact' },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#') && isHomePage) {
      e.preventDefault();
      const targetId = href.substring(2);
      const target = document.getElementById(targetId);
      if (target) {
        window.history.pushState(null, '', href);
        const y = target.getBoundingClientRect().top + window.scrollY - 80; // account for navbar height
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isSolid
          ? 'bg-sera-surface/90 backdrop-blur-xl py-3 shadow-[0_18px_60px_-42px_rgba(39,32,28,0.8)]'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <span className={`text-2xl font-bold font-serif ${isSolid ? 'text-sera-ink' : 'text-white'}`}>
            Nhiên CàFe
          </span>
        </Link>

        <div className="hidden md:flex space-x-8 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className={`text-sm font-semibold transition-colors hover:text-sera-ember ${
                isSolid ? 'text-sera-muted' : 'text-white/90'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setTheme(isDarkTheme ? 'light' : 'dark')}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
              isSolid
                ? 'border-sera-ink/10 bg-sera-cream text-sera-ink hover:border-sera-ember/30'
                : 'border-white/25 bg-white/12 text-white backdrop-blur-md hover:bg-white/20'
            }`}
            aria-label="Đổi giao diện sáng tối"
          >
            {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className={`flex max-w-[210px] items-center gap-2 rounded-full border px-2.5 py-1.5 transition-all ${
                  isSolid
                    ? 'border-sera-ink/10 bg-sera-cream text-sera-ink hover:border-sera-ember/30'
                    : 'border-white/25 bg-white/12 text-white backdrop-blur-md hover:bg-white/20'
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sera-ember text-xs font-black text-white">
                  {userAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={userAvatar} alt={userName} className="h-full w-full object-cover" />
                  ) : (
                    userName.charAt(0).toUpperCase()
                  )}
                </span>
                <span className="truncate text-sm font-bold">{userName}</span>
              </Link>
              <SeraButton
                type="button"
                size="sm"
                variant={isSolid ? 'ghost' : 'light'}
                onClick={handleLogout}
              >
                Đăng xuất
              </SeraButton>
            </div>
          ) : (
            <SeraButton
              type="button"
              size="sm"
              variant={isSolid ? 'accent' : 'light'}
              onClick={() => setIsLoginOpen(true)}
              disabled={authLoading}
            >
              Đăng nhập
            </SeraButton>
          )}
        </div>

        <button
          className="md:hidden text-2xl"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Mở menu"
        >
          {isMobileMenuOpen ? (
            <HiX className={isSolid ? 'text-sera-ink' : 'text-white'} />
          ) : (
            <HiMenuAlt3 className={isSolid ? 'text-sera-ink' : 'text-white'} />
          )}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute w-full top-full left-0 border-b border-sera-ink/10 bg-sera-surface overflow-hidden shadow-2xl"
          >
            <div className="flex flex-col p-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    handleLinkClick(e, link.href);
                  }}
                  className="font-semibold text-sera-muted hover:text-sera-ember"
                >
                  {link.name}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => setTheme(isDarkTheme ? 'light' : 'dark')}
                className="flex items-center justify-between rounded-2xl bg-sera-cream px-4 py-3 text-sm font-bold text-sera-ink"
              >
                Giao diện
                {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              {user && (
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-2xl bg-sera-cream p-3 font-semibold text-sera-ink"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sera-ember text-sm font-black text-white">
                    {userAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={userAvatar} alt={userName} className="h-full w-full object-cover" />
                    ) : (
                      userName.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate">{userName}</span>
                    <span className="block text-xs font-medium text-sera-muted">Xem hồ sơ</span>
                  </span>
                </Link>
              )}
              <SeraButton
                type="button"
                variant="accent"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (user) {
                    void handleLogout();
                  } else {
                    setIsLoginOpen(true);
                  }
                }}
                disabled={authLoading}
              >
                {user ? 'Đăng xuất' : 'Đăng nhập'}
              </SeraButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLoginOpen && !user && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/78 px-5 py-8 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setIsLoginOpen(false)}
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-[460px]"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <SeraGoogleLoginForm
                loading={authLoading}
                error={authError}
                onPasswordLogin={handlePasswordLogin}
                onGoogleLogin={handleGoogleLogin}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
