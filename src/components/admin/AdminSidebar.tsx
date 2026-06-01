"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Coffee, 
  Image as ImageIcon, 
  PanelsTopLeft,
  Tag, 
  Settings, 
  ChevronLeft,
  Moon,
  Sun,
  Stamp,
  TicketCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

const sidebarItems = [
  { name: "Bảng điều khiển", href: "/admin/dashboard", icon: LayoutDashboard, category: "Tổng quan" },
  { name: "Thực đơn", href: "/admin/menu", icon: Coffee, category: "Quản lý" },
  { name: "Ảnh Hero", href: "/admin/hero", icon: PanelsTopLeft, category: "Quản lý" },
  { name: "Khuyến mãi", href: "/admin/promotions", icon: Tag, category: "Quản lý" },
  { name: "Áp dụng mã", href: "/admin/redeem", icon: TicketCheck, category: "Quản lý" },
  { name: "Thành viên", href: "/admin/loyalty", icon: Stamp, category: "Quản lý" },
  { name: "Cài đặt cửa hàng", href: "/admin/hours", icon: Settings, category: "Hệ thống" },
];

const subscribeToMounted = () => () => {};
const getMountedSnapshot = () => true;
const getServerMountedSnapshot = () => false;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

export function AdminSidebar({ isOpen, onClose, isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isMounted = useSyncExternalStore(
    subscribeToMounted,
    getMountedSnapshot,
    getServerMountedSnapshot
  );
  const isDarkTheme = isMounted && theme === 'dark';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const groupedItems = sidebarItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof sidebarItems>);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r transition-all duration-300 shadow-sm",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-[70px]" : "w-64"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-14 items-center justify-between px-3 border-b border-sidebar-border">
          <Link href="/admin/dashboard" className={cn("flex items-center gap-2 font-bold group overflow-hidden transition-all", isCollapsed ? "justify-center w-full" : "px-2")}>
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex-shrink-0 flex items-center justify-center text-sidebar-primary-foreground font-black shadow-md">
              N
            </div>
            {!isCollapsed && (
              <span className="text-sidebar-foreground font-bold tracking-tight whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                Nhien Dashboard
              </span>
            )}
          </Link>
          
          {!isCollapsed && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsCollapsed(true)} 
              className="hidden lg:flex h-8 w-8 rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-none">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-1">
              {!isCollapsed && (
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-2">
                  {category}
                </h2>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.name} href={item.href} onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}>
                      <span
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all relative overflow-hidden",
                          isActive 
                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isCollapsed && "justify-center px-0 h-10"
                        )}
                        title={isCollapsed ? item.name : ""}
                      >
                        <item.icon className={cn(
                          "h-[18px] w-[18px] shrink-0 transition-colors",
                          isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-primary"
                        )} />
                        {!isCollapsed && (
                          <span className="flex-1 whitespace-nowrap">
                            {item.name}
                          </span>
                        )}
                        {isActive && !isCollapsed && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-sidebar-primary rounded-l-full" />
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-2 bg-sidebar-background/50">
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-full h-10 rounded-lg justify-start gap-3 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all", isCollapsed && "justify-center px-0")}
            onClick={() => setTheme(isDarkTheme ? 'light' : 'dark')}
          >
            {isDarkTheme ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wider">{isDarkTheme ? 'Giao diện Sáng' : 'Giao diện Tối'}</span>}
          </Button>

          <div className={cn("flex items-center gap-3 rounded-xl border border-sidebar-border shadow-sm transition-all overflow-hidden", isCollapsed ? "p-1.5 justify-center" : "px-3 py-2 bg-sidebar-background")}>
            <div className="w-8 h-8 rounded-lg bg-sidebar-accent border border-sidebar-border flex-shrink-0 flex items-center justify-center text-xs font-bold text-sidebar-foreground/60 shadow-inner">
              AD
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-sidebar-foreground truncate leading-none">Admin Nhiên</p>
                <button 
                  onClick={handleLogout}
                  className="text-[9px] text-rose-500 font-bold uppercase tracking-wider hover:text-rose-600 transition-colors mt-1"
                >
                  Đăng xuất
                </button>
              </div>
            )}
            {isCollapsed && (
              <button 
                onClick={handleLogout}
                className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                title="Đăng xuất"
              />
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
