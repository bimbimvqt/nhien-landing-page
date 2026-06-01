"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { PartyPopper, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export function RedeemSuccessPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [promotionName, setPromotionName] = useState("Ưu đãi của bạn");

  useEffect(() => {
    let channel: any = null;

    const setupListener = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      channel = supabase
        .channel("schema-db-changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "promotion_claims",
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload) => {
            const oldRecord = payload.old;
            const newRecord = payload.new;
            
            // Check if it was just redeemed
            if (
              newRecord.redeemed_count > (oldRecord.redeemed_count || 0) ||
              (newRecord.redeemed_at && newRecord.redeemed_at !== oldRecord.redeemed_at)
            ) {
              // Trigger success!
              triggerSuccess();
            }
          }
        )
        .subscribe();
    };

    setupListener();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const triggerSuccess = () => {
    setShowPopup(true);
    
    // Fire confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
    
    // Auto close after 6 seconds
    setTimeout(() => {
      setShowPopup(false);
    }, 6000);
  };

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-sera-cream p-8 text-center shadow-2xl"
          >
            <button
              onClick={() => setShowPopup(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-sera-muted hover:bg-black/5 hover:text-sera-ink transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-emerald-100 shadow-inner">
              <PartyPopper className="h-10 w-10 text-emerald-600 animate-bounce" />
            </div>

            <h2 className="mb-2 text-2xl font-black text-sera-ink">
              Áp dụng thành công!
            </h2>
            <p className="mb-6 text-sm font-medium leading-relaxed text-sera-muted">
              Nhân viên đã xác nhận mã của bạn. Cảm ơn bạn đã sử dụng ưu đãi tại Nhiên CàFe!
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPopup(false)}
              className="w-full rounded-[1.5rem] bg-sera-ember py-4 font-black text-white shadow-lg shadow-sera-ember/20"
            >
              Đóng
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
