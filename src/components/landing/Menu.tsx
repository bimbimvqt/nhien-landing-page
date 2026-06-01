'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { Coffee, Search, SlidersHorizontal, X } from 'lucide-react';

import ProductCard from './ProductCard';
import { SeraBadge } from '@/components/sera/badge';
import { SeraButton } from '@/components/sera/button';
import { SeraSectionHeading } from '@/components/sera/section-heading';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { fetchProducts } from '@/lib/backendApi';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/images';
import { cn } from '@/lib/utils';
import type { Category, Product } from '@/types';

const INITIAL_VISIBLE_COUNT = 8;

const Menu = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | 'Tất cả'>('Tất cả');
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    fetchProducts()
      .then((data) => {
        if (!isActive) {
          return;
        }

        setProducts(data || []);
        setLoading(false);
      })
      .catch((error: Error) => {
        if (!isActive) {
          return;
        }

        console.error('Error fetching products:', error);
        setError(error.message);
        setProducts([]);
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const categories = useMemo<(Category | 'Tất cả')[]>(() => {
    const uniqueCategories = products
      .map((product) => product.category)
      .filter((category, index, list) => category && list.indexOf(category) === index);

    return ['Tất cả', ...uniqueCategories];
  }, [products]);

  const currentCategory = categories.includes(activeCategory) ? activeCategory : 'Tất cả';
  const normalizedQuery = query.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    const categoryMatches =
      currentCategory === 'Tất cả' || product.category === currentCategory;
    const searchMatches =
      normalizedQuery.length === 0 ||
      [product.name, product.description, product.category, product.sub_category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);

    return categoryMatches && searchMatches;
  });
  const visibleProducts = showAll
    ? filteredProducts
    : filteredProducts.slice(0, INITIAL_VISIBLE_COUNT);

  return (
    <section id="menu" className="bg-sera-cream py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <SeraSectionHeading
            eyebrow="Hương vị tự nhiên"
            title="Thực đơn của chúng tôi"
            description="Tìm món theo khẩu vị, xem giá theo size và lưu món yêu thích để nhận ưu đãi."
            align="center"
          />
          <div className="mx-auto mt-8 h-1 w-20 rounded-full bg-sera-ember" />
        </motion.div>

        <div className="mb-10 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sera-muted" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setShowAll(false);
              }}
              placeholder="Tìm cà phê, matcha, trà trái cây..."
              className="h-14 rounded-full border-sera-ink/10 bg-sera-surface pl-11 pr-12 text-base font-semibold text-sera-ink shadow-sm focus-visible:ring-sera-ember/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-sera-cream text-sera-muted transition-colors hover:text-sera-ember"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 rounded-full bg-sera-surface px-4 py-3 text-sm font-bold text-sera-muted shadow-sm">
            <SlidersHorizontal className="h-4 w-4 text-sera-ember" />
            {filteredProducts.length} món phù hợp
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 flex flex-wrap justify-center gap-3"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveCategory(cat);
                setShowAll(false);
              }}
              className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                currentCategory === cat
                  ? 'border-sera-ember bg-sera-ember text-white shadow-[0_14px_35px_-22px_rgba(184,67,43,0.9)]'
                  : 'border-sera-ink/10 bg-sera-surface text-sera-muted hover:border-sera-ember/35 hover:text-sera-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-[2rem] bg-sera-surface shadow-sm h-[400px]">
                <div className="aspect-square w-full rounded-t-[2rem] bg-sera-ink/5" />
                <div className="p-6">
                  <div className="mb-4 h-6 w-20 rounded-full bg-sera-ink/5" />
                  <div className="mb-2 h-6 w-3/4 rounded-lg bg-sera-ink/10" />
                  <div className="h-4 w-full rounded-lg bg-sera-ink/5" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-rose-500/20 bg-rose-500/10 p-6 text-center text-sm font-bold text-rose-600">
            Không thể tải thực đơn: {error}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {visibleProducts.map((product) => (
                <div
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedProduct(product)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedProduct(product);
                    }
                  }}
                  className="block h-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sera-ember/30"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {filteredProducts.length === 0 && !loading && !error && (
          <div className="py-20 text-center italic text-sera-muted">
            Hiện chưa có sản phẩm nào phù hợp.
          </div>
        )}

        {filteredProducts.length > INITIAL_VISIBLE_COUNT && (
          <div className="mt-12 flex justify-center">
            <SeraButton
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setShowAll((current) => !current)}
            >
              {showAll ? 'Thu gọn thực đơn' : `Xem tất cả ${filteredProducts.length} món`}
            </SeraButton>
          </div>
        )}
      </div>

      <Dialog open={Boolean(selectedProduct)} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-[2rem] border-sera-ink/10 bg-sera-surface p-0">
          {selectedProduct && (
            <>
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={selectedProduct.image_url || DEFAULT_PRODUCT_IMAGE}
                  alt={selectedProduct.name}
                  fill
                  sizes="(min-width: 768px) 720px, 100vw"
                  className={cn(
                    selectedProduct.image_url ? 'object-cover' : 'object-contain bg-sera-cream p-12',
                  )}
                />
                <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                  <SeraBadge tone="light" className="bg-sera-deep/70">
                    {selectedProduct.category}
                  </SeraBadge>
                  {selectedProduct.is_best_seller && (
                    <SeraBadge tone="light" className="bg-sera-ember text-white">
                      Best Seller
                    </SeraBadge>
                  )}
                </div>
              </div>
              <div className="p-6 md:p-8">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black leading-tight text-sera-ink">
                    {selectedProduct.name}
                  </DialogTitle>
                  <DialogDescription className="text-base leading-7 text-sera-muted">
                    {selectedProduct.description ||
                      'Hương vị thơm ngon, tự nhiên đặc trưng của Nhiên CàFe.'}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <PriceTile label="Size S" value={selectedProduct.price_s} />
                  <PriceTile label="Size M" value={selectedProduct.price_m} />
                </div>

                <div className="mt-7 rounded-3xl bg-sera-cream p-5">
                  <div className="mb-3 flex items-center gap-2 text-sera-ember">
                    <Coffee className="h-4 w-4" />
                    <p className="text-xs font-black uppercase tracking-[0.18em]">Gợi ý</p>
                  </div>
                  <p className="text-sm leading-6 text-sera-muted">
                    Có thể hỏi nhân viên để điều chỉnh độ ngọt, đá hoặc topping theo khẩu vị.
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

function PriceTile({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-3xl border border-sera-ink/10 bg-sera-cream p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-sera-muted">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-sera-ember">{value ? `${value}k` : '-'}</p>
    </div>
  );
}

export default Menu;
