import type { AboutStat, GalleryItem, OpeningHour, StoreSettings } from '@/types';

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

export const DEFAULT_ABOUT_STATS: AboutStat[] = [
  { value: '100%', label: 'Hạt cà phê sạch' },
  { value: 'Chill', label: 'Không gian nhẹ nhàng' },
];

export const DEFAULT_ABOUT_TITLE = 'Từ sự giản dị, tạo nên trải nghiệm.';
export const DEFAULT_ABOUT_DESCRIPTION_1 = 'Tại Nhiên CàFe, chúng tôi tin rằng hạnh phúc đôi khi đến từ những điều bình dị nhất. Một ly cà phê thơm nồng vào buổi sáng, một góc nhỏ tĩnh lặng để suy ngẫm, hay một cuộc trò chuyện chân tình cùng bạn bè.';
export const DEFAULT_ABOUT_DESCRIPTION_2 = 'Chúng tôi không chỉ bán cà phê, chúng tôi trao gửi sự thư giãn. Mỗi hạt cà phê đều được tuyển chọn kỹ lưỡng, mỗi món nước đều được pha chế bằng cả cái tâm để mang lại hương vị "tự nhiên" nhất cho bạn.';

export const DEFAULT_GALLERY: GalleryItem[] = [
  {
    id: "cozy-corner",
    imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1200",
    title: "Góc Nhỏ Mộc Mạc",
    description: "Một góc bàn gỗ tự nhiên ngập tràn nắng mai, lý tưởng cho những ai tìm kiếm sự tĩnh lặng để làm việc hoặc đọc sách.",
  },
  {
    id: "barista-craft",
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1200",
    title: "Hương Vị Thủ Công",
    description: "Từng ly Latte đều được pha chế thủ công bằng sự đam mê của barista, mang đến hương vị béo ngậy cùng lớp bọt mịn màng.",
  },
  {
    id: "greenery-space",
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=1200",
    title: "Không Gian Xanh",
    description: "Sự kết hợp tinh tế giữa gỗ ấm áp và những mảng xanh mát mắt, mang lại cảm giác dễ chịu, gần gũi với thiên nhiên.",
  },
  {
    id: "afternoon-vibe",
    imageUrl: "https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?auto=format&fit=crop&q=80&w=1200",
    title: "Giai Điệu Buổi Chiều",
    description: "Tận hưởng một tách cà phê thơm ngon cùng chiếc bánh ngọt xinh xắn, để những muộn phiền trôi đi theo từng ngụm nước ấm.",
  },
  {
    id: "friendly-gathering",
    imageUrl: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=1200",
    title: "Nơi Gặp Gỡ Thân Tình",
    description: "Địa điểm quen thuộc để bạn cùng những người thân yêu chia sẻ những câu chuyện vui buồn trong cuộc sống bên ly nước đậm vị.",
  },
];

export const DEFAULT_REWARD_TASKS = [
  {
    key: 'save_3_favorites',
    title: 'Lưu 3 món yêu thích',
    description: 'Bấm trái tim ở các món bạn muốn thử để mở khóa nhiệm vụ này.',
    reward: 'Mở khóa mã ưu đãi',
    actionLabel: 'Xem thực đơn',
    kind: 'auto',
    active: true,
  },
  {
    key: 'follow_social',
    title: 'Theo dõi Nhiên CàFe',
    description: 'Theo dõi Facebook hoặc Instagram rồi quay lại xác nhận.',
    reward: 'Tăng cơ hội nhận mã',
    actionLabel: 'Xác nhận đã theo dõi',
    kind: 'confirm',
    active: true,
  },
  {
    key: 'share_shop',
    title: 'Chia sẻ link quán',
    description: 'Gửi link Nhiên CàFe cho bạn bè hoặc lưu để rủ nhau ghé quán.',
    reward: 'Hoàn thành nhiệm vụ chia sẻ',
    actionLabel: 'Chia sẻ ngay',
    kind: 'share',
    active: true,
  },
  {
    key: 'complete_profile',
    title: 'Hoàn thiện hồ sơ',
    description: 'Đăng nhập bằng tài khoản có tên và email để quán nhận diện bạn.',
    reward: 'Sẵn sàng tích điểm',
    actionLabel: 'Xem hồ sơ',
    kind: 'profile',
    active: true,
  },
  {
    key: 'qr_checkin',
    title: 'Check-in tại quán bằng QR',
    description: 'Quét QR tại quầy khi ghé quán để nhân viên xác nhận.',
    reward: 'Nhận stamp tại quán',
    actionLabel: 'Thực hiện tại quầy',
    kind: 'counter',
    active: true,
  },
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
  about_image_url: null,
  about_title: DEFAULT_ABOUT_TITLE,
  about_description_1: DEFAULT_ABOUT_DESCRIPTION_1,
  about_description_2: DEFAULT_ABOUT_DESCRIPTION_2,
  about_stats: DEFAULT_ABOUT_STATS,
  gallery: DEFAULT_GALLERY,
  required_tasks_to_claim: 2,
  reward_tasks: DEFAULT_REWARD_TASKS as any,
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
    about_image_url: settings?.about_image_url || null,
    about_title: settings?.about_title || DEFAULT_ABOUT_TITLE,
    about_description_1: settings?.about_description_1 || DEFAULT_ABOUT_DESCRIPTION_1,
    about_description_2: settings?.about_description_2 || DEFAULT_ABOUT_DESCRIPTION_2,
    about_stats: (Array.isArray(settings?.about_stats) && settings.about_stats.length > 0)
      ? settings.about_stats
      : DEFAULT_ABOUT_STATS,
    gallery: (Array.isArray(settings?.gallery) && settings.gallery.length > 0)
      ? settings.gallery
      : DEFAULT_GALLERY,
    required_tasks_to_claim: typeof settings?.required_tasks_to_claim === 'number'
      ? settings.required_tasks_to_claim
      : DEFAULT_STORE_SETTINGS.required_tasks_to_claim,
    reward_tasks: (Array.isArray(settings?.reward_tasks) && settings.reward_tasks.length > 0)
      ? settings.reward_tasks
      : DEFAULT_STORE_SETTINGS.reward_tasks,
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
