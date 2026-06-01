'use client';

import React from 'react';
import Link from 'next/link';
import { FaFacebookF, FaInstagram, FaPhoneAlt, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { SeraButton } from '@/components/sera/button';
import { formatOpeningHours } from '@/lib/storeSettings';
import type { StoreSettings } from '@/types';

type FooterProps = {
  settings: StoreSettings;
};

const Footer = ({ settings }: FooterProps) => {
  const [primaryHours, secondaryHours] = formatOpeningHours(settings.opening_hours);

  return (
    <footer id="contact" className="bg-sera-deep text-white pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 lg:col-span-1">
            <h3 className="text-2xl font-bold font-serif mb-6 text-sera-linen">{settings.brand_name}</h3>
            <p className="text-white/62 mb-8 leading-relaxed">
              Chạm vào sự thư giãn qua từng ly cà phê nguyên bản và không gian nhẹ nhàng.
            </p>
            <div className="flex space-x-4">
              {settings.facebook_url && (
                <SeraButton
                  asChild
                  size="icon"
                  variant="light"
                  aria-label={`Facebook ${settings.brand_name}`}
                >
                  <a
                    href={settings.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaFacebookF />
                  </a>
                </SeraButton>
              )}
              {settings.instagram_url && (
                <SeraButton
                  asChild
                  size="icon"
                  variant="light"
                  aria-label={`Instagram ${settings.brand_name}`}
                >
                  <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer">
                    <FaInstagram />
                  </a>
                </SeraButton>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 uppercase tracking-wider">Liên kết</h4>
            <ul className="space-y-4 text-white/62">
              <li><Link href="/#home" className="hover:text-sera-linen transition-colors">Trang chủ</Link></li>
              <li><Link href="/#about" className="hover:text-sera-linen transition-colors">Về chúng tôi</Link></li>
              <li><Link href="/#menu" className="hover:text-sera-linen transition-colors">Thực đơn</Link></li>
              <li><Link href="/#gallery" className="hover:text-sera-linen transition-colors">Không gian</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 uppercase tracking-wider">Thông tin</h4>
            <ul className="space-y-4 text-white/62">
              <li className="flex items-start space-x-3">
                <FaMapMarkerAlt className="mt-1 text-sera-ember" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center space-x-3">
                <FaPhoneAlt className="text-sera-ember" />
                <span>{settings.hotline}</span>
              </li>
              <li className="flex items-start space-x-3">
                <FaClock className="mt-1 text-sera-ember" />
                <span>
                  {primaryHours}
                  <br />
                  {secondaryHours}
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 uppercase tracking-wider">Bản đồ</h4>
            <div className="rounded-[1.5rem] overflow-hidden h-48 w-full bg-white/10 relative ring-1 ring-white/10">
              <iframe 
                src={settings.map_embed_url || undefined}
                title={`Bản đồ ${settings.brand_name}`}
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/45">
          <p>© 2026 {settings.brand_name}. All rights reserved.</p>
          <p>Thiết kế bởi <span className="text-sera-linen">{settings.brand_name}</span></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
