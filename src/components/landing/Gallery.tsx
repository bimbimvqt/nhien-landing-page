"use client";

import { SeraSectionHeading } from "@/components/sera/section-heading";
import { motion } from "framer-motion";
import Image from "next/image";

import { getProxiedImageUrl } from "@/lib/image-proxy";

const Gallery = () => {
  const images: { src: string; label: string; bg: string }[] = [];

  return (
    <section id="gallery" className="py-24 bg-sera-surface">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <SeraSectionHeading
            eyebrow="Trải nghiệm Nhiên"
            title={<>Góc nhỏ bình yên, nơi mọi thứ dừng lại.</>}
            className="max-w-2xl"
          />
          <p className="text-sera-muted max-w-sm mb-2 leading-7">
            Lưu giữ những khoảnh khắc đẹp qua ống kính tại không gian của Nhiên
            CàFe.
          </p>
        </div>

        {images.length === 0 ? (
          <div className="flex justify-center items-center py-20 bg-sera-surface rounded-2xl border border-sera-border/10">
            <p className="text-sera-muted text-lg italic font-serif">
              Hình ảnh đang được cập nhật...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {images.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative overflow-hidden rounded-[1.75rem] group ${image.bg} ${
                  index === 1 || index === 4 ? "md:row-span-2" : "aspect-square"
                }`}
              >
                <Image
                  src={getProxiedImageUrl(image.src)}
                  alt={image.label}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-contain p-8 transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-sera-ember/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white font-serif italic text-xl">
                    {image.label}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;
