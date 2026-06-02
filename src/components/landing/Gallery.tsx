"use client";

import { SeraSectionHeading } from "@/components/sera/section-heading";
import { SeraCarousel } from "@/components/sera/carousel";
import type { StoreSettings } from "@/types";

interface GalleryProps {
  settings: Pick<StoreSettings, "gallery">;
}

const Gallery = ({ settings }: GalleryProps) => {
  const items = Array.isArray(settings.gallery) && settings.gallery.length > 0
    ? settings.gallery
    : [];

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
            Lưu giữ những khoảnh khắc đẹp qua ống kính tại không gian ấm cúng của Nhiên CàFe.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="flex justify-center items-center py-20 bg-sera-surface rounded-2xl border border-sera-border/10">
            <p className="text-sera-muted text-lg italic font-serif">
              Hình ảnh đang được cập nhật...
            </p>
          </div>
        ) : (
          <div className="w-full mt-8">
            <SeraCarousel items={items} autoplay autoplayInterval={5000} />
          </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;

