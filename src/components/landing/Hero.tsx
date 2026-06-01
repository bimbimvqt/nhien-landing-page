'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { SeraBadge } from '@/components/sera/badge';
import { SeraButton } from '@/components/sera/button';

type HeroProps = {
  backgroundImageUrl: string;
};

const Hero = ({ backgroundImageUrl }: HeroProps) => {
  return (
    <section id="home" className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ 
          backgroundImage: `url("${backgroundImageUrl}")`,
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(39,32,28,0.82),rgba(39,32,28,0.42),rgba(39,32,28,0.18))] z-10" />
      </div>

      <div className="container mx-auto px-6 relative z-20 text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-3xl"
        >
          <SeraBadge tone="light" className="mb-6">
            TỰ NHIÊN • GIẢN DỊ • CHÂN THẬT
          </SeraBadge>
          <h1 className="text-5xl md:text-7xl font-bold font-serif mb-6 leading-[0.98]">
            Nhiên CàFe
            <span className="block pt-3 text-3xl font-light italic text-white md:text-5xl">
              Chạm vào sự thư giãn
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/82 max-w-2xl mb-10 font-light leading-relaxed">
            Một không gian nhỏ nhắn, nơi bạn có thể tìm thấy sự bình yên 
            giữa những hối hả của cuộc sống thường nhật.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <SeraButton asChild variant="accent" size="lg" arrow className="w-full sm:w-auto">
              <Link href="/#menu">Xem thực đơn</Link>
            </SeraButton>
            <SeraButton asChild variant="light" size="lg" className="w-full sm:w-auto">
              <Link href="/#about">Về chúng tôi</Link>
            </SeraButton>
          </div>
        </motion.div>
      </div>

      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
      >
        <span className="text-white/50 text-xs uppercase tracking-widest">Cuộn để xem thêm</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent" />
      </motion.div>
    </section>
  );
};

export default Hero;
