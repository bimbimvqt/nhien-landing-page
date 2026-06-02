"use client";

import { SeraSectionHeading } from "@/components/sera/section-heading";
import type { AboutStat, StoreSettings } from "@/types";
import { motion } from "framer-motion";

interface AboutProps {
  settings: Pick<
    StoreSettings,
    | "about_image_url"
    | "about_title"
    | "about_description_1"
    | "about_description_2"
    | "about_stats"
  >;
}

const DEFAULT_IMAGE = "/images/image-transparant.png";

const About = ({ settings }: AboutProps) => {
  const imageSrc = settings.about_image_url || DEFAULT_IMAGE;
  const title = settings.about_title || "Từ sự giản dị, tạo nên trải nghiệm.";
  const description1 =
    settings.about_description_1 ||
    "Tại Nhiên CàFe, chúng tôi tin rằng hạnh phúc đôi khi đến từ những điều bình dị nhất. Một ly cà phê thơm nồng vào buổi sáng, một góc nhỏ tĩnh lặng để suy ngẫm, hay một cuộc trò chuyện chân tình cùng bạn bè.";
  const description2 =
    settings.about_description_2 ||
    'Chúng tôi không chỉ bán cà phê, chúng tôi trao gửi sự thư giãn. Mỗi hạt cà phê đều được tuyển chọn kỹ lưỡng, mỗi món nước đều được pha chế bằng cả cái tâm để mang lại hương vị "tự nhiên" nhất cho bạn.';

  const stats: AboutStat[] =
    Array.isArray(settings.about_stats) && settings.about_stats.length > 0
      ? settings.about_stats
      : [
          { value: "100%", label: "Hạt cà phê sạch" },
          { value: "Chill", label: "Không gian nhẹ nhàng" },
        ];

  return (
    <section id="about" className="py-24 bg-sera-surface">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center gap-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 relative"
          >
            <div className="relative aspect-[4/5] w-full max-w-md mx-auto">
              <div className="absolute -top-6 -left-6 w-full h-full rounded-[2rem] border border-sera-sage/25 bg-sera-cream" />
              <img
                src={imageSrc}
                alt="Nhiên CàFe Vibe"
                className="absolute inset-0 w-full h-full object-cover rounded-[2rem] shadow-[0_32px_90px_-50px_rgba(39,32,28,0.9)] z-10 border-4 border-sera-cream"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1"
          >
            <SeraSectionHeading
              eyebrow="Câu chuyện của chúng tôi"
              title={<>{title}</>}
              className="mb-8"
            />
            <div className="space-y-6 text-sera-muted leading-relaxed text-lg">
              <p>{description1}</p>
              {description2 && <p>{description2}</p>}
            </div>

            {stats.length > 0 && (
              <div
                className={`grid gap-8 mt-12 ${
                  stats.length === 1 ? "grid-cols-1 max-w-xs" : "grid-cols-2"
                }`}
              >
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="rounded-3xl border border-sera-ink/10 bg-sera-cream p-6"
                  >
                    <h4 className="text-3xl font-bold text-sera-ember font-serif mb-2">
                      {stat.value}
                    </h4>
                    <p className="text-sm text-sera-muted uppercase tracking-wide">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
