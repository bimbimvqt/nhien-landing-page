"use client";

import { SeraBadge } from "@/components/sera/badge";
import { SeraMagicCard } from "@/components/sera/magic-card";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/images";
import { Product } from "@/types";
import { motion } from "framer-motion";
import Image from "next/image";
import FavoriteButton from "./FavoriteButton";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const description =
    product.description ||
    "Hương vị thơm ngon, tự nhiên đặc trưng của Nhiên CàFe.";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <SeraMagicCard className="h-full">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.image_url || DEFAULT_PRODUCT_IMAGE}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className={`transition-transform duration-700 group-hover:scale-105 ${
              product.image_url ? "object-cover" : "object-contain p-10"
            }`}
          />
          {product.is_best_seller && (
            <SeraBadge
              tone="light"
              className="absolute left-4 top-4 z-10 bg-sera-ember text-white"
            >
              Best Seller
            </SeraBadge>
          )}
          <FavoriteButton
            productId={product.id}
            productName={product.name}
            className="absolute right-4 top-4 z-10"
          />
        </div>

        <div className="flex min-h-[220px] flex-col p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="inline-flex max-w-[65%] items-center rounded-full bg-sera-cream px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-sera-muted">
              <span className="truncate">{product.category}</span>
            </span>
            {product.is_best_seller && (
              <span className="inline-flex items-center rounded-full bg-sera-ember/10 px-3 py-1 text-[11px] font-bold text-sera-ember">
                Bán chạy
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="line-clamp-2 min-h-[3.25rem] text-xl font-bold leading-[1.28] text-sera-ink transition-colors group-hover:text-sera-ember">
              {product.name}
            </h3>
            <p className="line-clamp-2 min-h-[2.75rem] text-sm leading-6 text-sera-muted">
              {description}
            </p>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-3 border-t border-sera-ink/10 pt-5">
            <div className="rounded-2xl bg-sera-cream px-4 py-3">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-sera-muted">
                Size S
              </span>
              {product.price_s && (
                <span className="mt-1 block text-xl font-black leading-none text-sera-ember">
                  {product.price_s}k
                </span>
              )}
            </div>
            <div className="rounded-2xl border border-sera-ink/10 bg-sera-surface px-4 py-3">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-sera-muted">
                Size M
              </span>
              {product.price_m ? (
                <span className="mt-1 block text-xl font-black leading-none text-sera-ink">
                  {product.price_m}k
                </span>
              ) : (
                <span className="mt-1 block text-sm font-bold leading-6 text-sera-muted">
                  -
                </span>
              )}
            </div>
          </div>
        </div>
      </SeraMagicCard>
    </motion.div>
  );
};

export default ProductCard;
