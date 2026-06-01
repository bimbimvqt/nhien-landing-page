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
    const { data, error } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", currentUserId)
      .eq("product_id", productId)
      .maybeSingle();

    if (error) {
      if (error.code !== "PGRST205") {
        console.error("Error loading favorite:", error);
      }
      setUnavailable(true);
      setFavoriteId(null);
    } else {
      setUnavailable(false);
      setFavoriteId(data?.id ?? null);
    }

    setLoading(false);
  }, [productId]);

  React.useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const currentUserId = data.user?.id ?? null;
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

    if (favoriteId) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) {
        console.error("Error removing favorite:", error);
      } else {
        setFavoriteId(null);
        notifyFavoriteChanged();
      }
    } else {
      const { data, error } = await supabase
        .from("favorites")
        .upsert(
          { user_id: userId, product_id: productId },
          { onConflict: "user_id,product_id" },
        )
        .select("id")
        .single();

      if (error) {
        console.error("Error saving favorite:", error);
        setUnavailable(true);
      } else {
        setFavoriteId(data.id);
        notifyFavoriteChanged();
      }
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
