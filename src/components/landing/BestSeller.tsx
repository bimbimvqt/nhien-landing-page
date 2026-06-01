'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import { Product } from '@/types';
import { fetchProducts } from '@/lib/backendApi';
import { SeraSectionHeading } from '@/components/sera/section-heading';

const BestSeller = () => {
  const [bestSellers, setBestSellers] = useState<Product[]>([]);

  useEffect(() => {
    const fetchBestSellers = async () => {
      const data = await fetchProducts({ bestSeller: true, limit: 4 }).catch(() => []);

      if (data && data.length > 0) {
        setBestSellers(data);
      } else {
        // Fallback
        setBestSellers([
          { id: '1', name: 'Cà phê sữa', price_s: 18, price_m: 35, category: 'Cà phê', is_best_seller: true, description: 'Cà phê nguyên chất kết hợp sữa đặc.' } as Product,
          { id: '3', name: 'Matcha latte sữa hạt Fuji', price_s: 38, price_m: 58, category: 'Signature', is_best_seller: true, description: 'Matcha cao cấp kết hợp sữa hạt béo ngậy.' } as Product,
          { id: '5', name: 'Trà xoài chanh dây', price_s: null, price_m: 25, category: 'Signature', is_best_seller: true, description: 'Sự kết hợp hoàn hảo giữa xoài và chanh dây.' } as Product,
        ]);
      }
    };
    fetchBestSellers();
  }, []);

  return (
    <section className="py-24 bg-sera-surface">
      <div className="container mx-auto px-6">
        <SeraSectionHeading
          eyebrow="Được yêu thích nhất"
          title={<>Món &quot;Nhiên&quot; phải thử</>}
          description={
            <>
            Những món uống đặc trưng làm nên tên tuổi của Nhiên CàFe, 
            được khách hàng yêu thích và lựa chọn nhiều nhất.
            </>
          }
          align="center"
          className="mb-16"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {bestSellers.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestSeller;
