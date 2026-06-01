"use client";

import { Heart, Loader2 } from "lucide-react";
import React from "react";

import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  productId: string;
  productName: string;
  className?: string;
};

function openLoginDialog() {
  window.dispatchEvent(new Event("nhien:open-login"));
}

function notifyFavoriteChanged() {
  window.dispatchEvent(new Event("nhien:favorites-changed"));
}

export default function FavoriteButton({
  productId,
  productName,
  className,
}: FavoriteButtonProps) {
  const [userId, setUserId] = React.useState<string | null>(null);
  const [favoriteId, setFavoriteId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [unavailable, setUnavailable] = React.useState(false);

  const loadFavorite = React.useCallback(async (currentUserId: string | null) => {
    if (!currentUserId) {
      setFavoriteId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch('/api/me/engagement', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error('Failed to load favorites');
      
      const data = await res.json();
      const fav = data.favorites?.find((f: any) => f.product_id === productId);
      setFavoriteId(fav ? fav.id : null);
      setUnavailable(false);
    } catch (error) {
      console.error("Error loading favorite:", error);
      setUnavailable(true);
      setFavoriteId(null);
    }
    setLoading(false);
  }, [productId]);

  React.useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const currentUserId = data.session?.user?.id ?? null;
      setUserId(currentUserId);
      void loadFavorite(currentUserId);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const currentUserId = session?.user?.id ?? null;
      setUserId(currentUserId);
      void loadFavorite(currentUserId);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadFavorite]);

  const handleToggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!userId) {
      openLoginDialog();
      return;
    }

    if (unavailable) {
      return;
    }

    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        openLoginDialog();
        setSaving(false);
        return;
      }

      if (favoriteId) {
        const res = await fetch(`/api/me/favorites?product_id=${productId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (!res.ok) throw new Error('Error removing favorite');
        setFavoriteId(null);
        notifyFavoriteChanged();
      } else {
        const res = await fetch('/api/me/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ product_id: productId })
        });

        if (!res.ok) {
          throw new Error('Error saving favorite');
        }
        const data = await res.json();
        setFavoriteId(data.id);
        notifyFavoriteChanged();
      }
    } catch (error) {
      console.error(error);
      setUnavailable(true);
    }

    setSaving(false);
  };

  const isActive = Boolean(favoriteId);
  const disabled = loading || saving || unavailable;

  return (
    <button
      type="button"
      onClick={handleToggle}
      onKeyDown={(event) => event.stopPropagation()}
      disabled={disabled}
      aria-pressed={isActive}
      aria-label={`${isActive ? "Bỏ lưu" : "Lưu"} ${productName} vào món yêu thích`}
      title={unavailable ? "Cần chạy migration favorites trước" : "Lưu món yêu thích"}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all",
        isActive
          ? "border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-500/30"
          : "border-white/50 bg-white/90 text-slate-700 backdrop-blur-md hover:border-rose-500 hover:text-rose-500 hover:bg-white shadow-sm",
        disabled && "cursor-not-allowed opacity-70",
        className,
      )}
    >
      {saving || loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={cn("h-4 w-4", isActive && "fill-current")} />
      )}
    </button>
  );
}
