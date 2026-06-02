"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface CarouselItem {
  id: string | number;
  imageUrl: string;
  title: string;
  description?: string;
}

export interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  items: CarouselItem[];
  autoplay?: boolean;
  autoplayInterval?: number;
}

function SeraCarousel({
  items,
  autoplay = false,
  autoplayInterval = 4000,
  className,
  ...props
}: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState<number>(
    Math.floor(items.length / 2)
  );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetAutoplay = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    if (!autoplay) return;

    resetAutoplay();
    timeoutRef.current = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, autoplayInterval);

    return () => resetAutoplay();
  }, [activeIndex, autoplay, autoplayInterval, items.length]);

  const handleSelect = (index: number) => {
    setActiveIndex(index);
    resetAutoplay();
  };

  return (
    <div className={cn("w-full", className)} {...props}>
      {/* Desktop View: Card Accordion Expansion */}
      <div className="hidden md:block w-full">
        <ul className="flex w-full h-[520px] gap-[1.5%] transition-all duration-500 ease-in-out">
          {items.map((item, index) => {
            const isActive = activeIndex === index;
            return (
              <li
                key={item.id}
                onClick={() => handleSelect(index)}
                className={cn(
                  "relative group cursor-pointer overflow-hidden rounded-3xl bg-sera-cream shadow-md transition-all duration-500 ease-in-out transform-gpu hover:shadow-lg",
                  isActive ? "w-[44%]" : "w-[12%] hover:w-[15%]"
                )}
              >
                <div className="relative h-full w-full overflow-hidden">
                  {/* Background Image */}
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className={cn(
                      "absolute left-1/2 top-1/2 h-full w-auto max-w-none -translate-x-1/2 -translate-y-1/2 object-cover transition-all duration-700 ease-in-out",
                      isActive ? "scale-105 grayscale-0" : "scale-100 grayscale group-hover:grayscale-0 group-hover:scale-105"
                    )}
                  />

                  {/* Dark overlay gradient */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-500",
                      isActive ? "opacity-100" : "opacity-40 group-hover:opacity-60"
                    )}
                  />

                  {/* Vertical text banner for collapsed cards */}
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center p-4 transition-opacity duration-300 pointer-events-none",
                      isActive ? "opacity-0" : "opacity-100"
                    )}
                  >
                    <span className="font-serif italic text-lg text-white/80 whitespace-nowrap rotate-90 origin-center tracking-widest uppercase">
                      {item.title}
                    </span>
                  </div>

                  {/* Information display for expanded card */}
                  <div
                    className={cn(
                      "absolute bottom-0 left-0 w-full p-8 text-white transition-all duration-500 ease-in-out transform-gpu",
                      isActive
                        ? "translate-y-0 opacity-100"
                        : "translate-y-8 opacity-0 pointer-events-none"
                    )}
                  >
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-sera-ember bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full">
                      Không gian Nhiên
                    </span>
                    <h3 className="text-3xl font-black font-serif mt-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mt-2 text-sm text-white/82 font-light max-w-md drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Mobile View: Swipe / Scroll Snap Container */}
      <div className="md:hidden w-full overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 flex gap-4 px-1">
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <div
              key={item.id}
              onClick={() => handleSelect(index)}
              className={cn(
                "w-[280px] h-[380px] shrink-0 snap-center rounded-[2rem] overflow-hidden relative shadow-md transition-all duration-300",
                isActive ? "ring-2 ring-sera-ember/50 scale-102" : "opacity-82"
              )}
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sera-ember bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full">
                  Không gian
                </span>
                <h3 className="text-xl font-bold font-serif mt-2.5">{item.title}</h3>
                {item.description && (
                  <p className="mt-1.5 text-xs text-white/70 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Indicators */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300 focus:outline-none",
              activeIndex === index
                ? "w-8 bg-sera-ember"
                : "w-2 bg-sera-ink/20 hover:bg-sera-ink/40"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export { SeraCarousel };
