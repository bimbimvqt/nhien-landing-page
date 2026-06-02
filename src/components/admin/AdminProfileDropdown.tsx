'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { User, LogOut, Settings, Home, ShieldAlert } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AdminProfileDropdownProps {
  user: SupabaseUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminProfileDropdown({ user, isOpen, onClose }: AdminProfileDropdownProps) {
  const router = useRouter();

  const handleLogout = async () => {
    onClose();
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  const navigateTo = (path: string) => {
    onClose();
    router.push(path);
  };

  if (!isOpen) return null;

  const email = user?.email || 'admin@nhien.cafe';
  const initial = email.charAt(0).toUpperCase();

  return (
    <>
      {/* Click Outside Overlay */}
      <div className="fixed inset-0 z-40 cursor-default" onClick={onClose} />

      <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
        {/* Profile Card Header */}
        <div className="flex items-center gap-3 p-3 border-b border-border/40 mb-1.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary shadow-sm">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{email}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-primary/10 text-primary border border-primary/10">
                Quản trị viên
              </span>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="space-y-0.5">
          <button
            onClick={() => navigateTo('/admin/hours')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60 rounded-xl transition-all duration-150"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>Cài đặt cửa hàng</span>
          </button>

          <button
            onClick={() => navigateTo('/')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60 rounded-xl transition-all duration-150"
          >
            <Home className="h-4 w-4 text-muted-foreground" />
            <span>Quay lại Trang chủ</span>
          </button>

          <div className="h-px bg-border/40 my-1 mx-1" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all duration-150"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </>
  );
}
