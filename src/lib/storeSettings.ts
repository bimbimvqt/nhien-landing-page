import type { OpeningHour, StoreSettings } from '@/types';

export const DEFAULT_HERO_BACKGROUND =
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop';

export const DEFAULT_MAP_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3921.282583803874!2d107.8105!3d11.5434!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDMyJzM2LjIiTiAxMDfCsDQ4JzM3LjgiRQ!5e0!3m2!1svi!2svn!4v1700000000000';

export const DEFAULT_OPENING_HOURS: OpeningHour[] = [
  { day: 'Thứ Hai', open: '07:00', close: '22:00', closed: false },
  { day: 'Thứ Ba', open: '07:00', close: '22:00', closed: false },
  { day: 'Thứ Tư', open: '07:00', close: '22:00', closed: false },
  { day: 'Thứ Năm', open: '07:00', close: '22:00', closed: false },
  { day: 'Thứ Sáu', open: '07:00', close: '23:00', closed: false },
  { day: 'Thứ Bảy', open: '07:00', close: '23:00', closed: false },
  { day: 'Chủ Nhật', open: '07:00', close: '22:00', closed: false },
];

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 1,
  brand_name: 'Nhiên CàFe',
  hotline: '0357 258 159',
  address: '8 Lam Sơn, Lộc Sơn, Bảo Lộc',
  facebook_url: 'https://www.facebook.com/nhiencafes',
  instagram_url: null,
  map_embed_url: DEFAULT_MAP_EMBED_URL,
  hero_image_url: DEFAULT_HERO_BACKGROUND,
  opening_hours: DEFAULT_OPENING_HOURS,
  updated_at: '',
};

export function normalizeOpeningHours(value: unknown): OpeningHour[] {
  if (!Array.isArray(value)) {
    return DEFAULT_OPENING_HOURS;
  }

  return DEFAULT_OPENING_HOURS.map((fallback, index) => {
    const candidate = value[index];

    if (!candidate || typeof candidate !== 'object') {
      return fallback;
    }

    const hour = candidate as Partial<OpeningHour>;

    return {
      day: typeof hour.day === 'string' && hour.day ? hour.day : fallback.day,
      open: typeof hour.open === 'string' && hour.open ? hour.open : fallback.open,
      close: typeof hour.close === 'string' && hour.close ? hour.close : fallback.close,
      closed: Boolean(hour.closed),
    };
  });
}

export function normalizeStoreSettings(
  settings: Partial<StoreSettings> | null | undefined,
): StoreSettings {
  const mapEmbedUrl = getGoogleMapsEmbedUrl(settings?.map_embed_url);

  return {
    ...DEFAULT_STORE_SETTINGS,
    ...settings,
    brand_name: settings?.brand_name || DEFAULT_STORE_SETTINGS.brand_name,
    hotline: settings?.hotline || DEFAULT_STORE_SETTINGS.hotline,
    address: settings?.address || DEFAULT_STORE_SETTINGS.address,
    facebook_url: settings?.facebook_url || DEFAULT_STORE_SETTINGS.facebook_url,
    instagram_url: settings?.instagram_url || null,
    map_embed_url: mapEmbedUrl || DEFAULT_MAP_EMBED_URL,
    hero_image_url: settings?.hero_image_url || DEFAULT_HERO_BACKGROUND,
    opening_hours: normalizeOpeningHours(settings?.opening_hours),
  };
}

export function extractGoogleMapsEmbedUrl(value: string | null | undefined) {
  const trimmedValue = value?.trim() || '';

  if (!trimmedValue) {
    return '';
  }

  const iframeSrcMatch = trimmedValue.match(/\bsrc=(["'])(.*?)\1/i);
  const candidate = iframeSrcMatch?.[2] || trimmedValue;

  return candidate.replaceAll('&amp;', '&').trim();
}

export function getGoogleMapsEmbedUrl(value: string | null | undefined) {
  const candidate = extractGoogleMapsEmbedUrl(value);

  if (!candidate) {
    return '';
  }

  try {
    const url = new URL(candidate);
    const hostname = url.hostname.toLowerCase();
    const isGoogleHost = hostname === 'google.com' || hostname.endsWith('.google.com');
    const isEmbedPath = url.pathname.startsWith('/maps/embed');
    const isLegacyEmbed =
      hostname === 'maps.google.com' &&
      url.pathname === '/maps' &&
      url.searchParams.get('output') === 'embed';

    if (url.protocol === 'https:' && isGoogleHost && (isEmbedPath || isLegacyEmbed)) {
      return url.toString();
    }
  } catch {
    return '';
  }

  return '';
}

export function formatOpeningHours(openingHours: OpeningHour[]) {
  const openDays = openingHours.filter((hour) => !hour.closed);

  if (openDays.length === 0) {
    return ['Tạm nghỉ', 'Vui lòng theo dõi thông báo mới'];
  }

  const first = openDays[0];
  const everyOpenDaySameHours =
    openDays.length === openingHours.length &&
    openDays.every((hour) => hour.open === first.open && hour.close === first.close);

  if (everyOpenDaySameHours) {
    return [`Mở cửa: ${first.open} - ${first.close}`, 'Hàng ngày'];
  }

  const weekday = openDays.find((hour) => hour.day === 'Thứ Hai') || first;
  const weekend = openDays.find((hour) => hour.day === 'Thứ Bảy');

  if (weekend && (weekend.open !== weekday.open || weekend.close !== weekday.close)) {
    return [
      `T2 - T6: ${weekday.open} - ${weekday.close}`,
      `T7 - CN: ${weekend.open} - ${weekend.close}`,
    ];
  }

  return [`Mở cửa: ${first.open} - ${first.close}`, `${openDays.length}/7 ngày trong tuần`];
}
