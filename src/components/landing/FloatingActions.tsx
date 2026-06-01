'use client';

import type { ReactNode } from 'react';
import { Coffee, MapPinned, MessageCircle, Phone } from 'lucide-react';

import type { StoreSettings } from '@/types';

type FloatingActionsProps = {
  settings: StoreSettings;
};

export default function FloatingActions({ settings }: FloatingActionsProps) {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    settings.address,
  )}`;
  const phoneUrl = `tel:${settings.hotline.replace(/[^\d+]/g, '')}`;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 grid grid-cols-4 gap-2 rounded-3xl border border-white/20 bg-sera-deep/92 p-2 text-white shadow-[0_24px_70px_-35px_rgba(0,0,0,0.75)] backdrop-blur-xl md:hidden">
      <ActionLink href={phoneUrl} label="Gọi" icon={<Phone className="h-4 w-4" />} />
      <ActionLink
        href={mapUrl}
        label="Đường"
        icon={<MapPinned className="h-4 w-4" />}
        external
      />
      <ActionLink href="/#menu" label="Menu" icon={<Coffee className="h-4 w-4" />} />
      <ActionLink
        href={settings.facebook_url || '#contact'}
        label="Nhắn"
        icon={<MessageCircle className="h-4 w-4" />}
        external={Boolean(settings.facebook_url)}
      />
    </div>
  );
}

function ActionLink({
  href,
  label,
  icon,
  external = false,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black uppercase tracking-wide text-white/78 transition-colors hover:bg-white/10 hover:text-white"
    >
      {icon}
      <span className="truncate">{label}</span>
    </a>
  );
}
