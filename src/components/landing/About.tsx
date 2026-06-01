'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { SeraSectionHeading } from '@/components/sera/section-heading';

const About = () => {
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
              <Image
                src="/images/image-transparent.png"
                alt="Nhiên CàFe Vibe"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-contain rounded-[2rem] bg-sera-cream p-8 shadow-[0_32px_90px_-50px_rgba(39,32,28,0.9)] z-10"
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
              title={<>Từ sự giản dị, tạo nên trải nghiệm.</>}
              className="mb-8"
            />
            <div className="space-y-6 text-sera-muted leading-relaxed text-lg">
              <p>
                Tại Nhiên CàFe, chúng tôi tin rằng hạnh phúc đôi khi đến từ những điều bình dị nhất. 
                Một ly cà phê thơm nồng vào buổi sáng, một góc nhỏ tĩnh lặng để suy ngẫm, 
                hay một cuộc trò chuyện chân tình cùng bạn bè.
              </p>
              <p>
                Chúng tôi không chỉ bán cà phê, chúng tôi trao gửi sự thư giãn. Mỗi hạt cà phê 
                đều được tuyển chọn kỹ lưỡng, mỗi món nước đều được pha chế bằng cả cái tâm 
                để mang lại hương vị &quot;tự nhiên&quot; nhất cho bạn.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mt-12">
              <div className="rounded-3xl border border-sera-ink/10 bg-sera-cream p-6">
                <h4 className="text-3xl font-bold text-sera-ember font-serif mb-2">100%</h4>
                <p className="text-sm text-sera-muted uppercase tracking-wide">Hạt cà phê sạch</p>
              </div>
              <div className="rounded-3xl border border-sera-ink/10 bg-sera-cream p-6">
                <h4 className="text-3xl font-bold text-sera-ember font-serif mb-2">Chill</h4>
                <p className="text-sm text-sera-muted uppercase tracking-wide">Không gian nhẹ nhàng</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
