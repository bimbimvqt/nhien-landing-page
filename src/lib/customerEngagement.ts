import type { Promotion } from '@/types';

export type RewardTaskKey =
  | 'save_3_favorites'
  | 'follow_social'
  | 'share_shop'
  | 'complete_profile'
  | 'qr_checkin';

export type RewardTask = {
  key: RewardTaskKey;
  title: string;
  description: string;
  reward: string;
  actionLabel: string;
  kind: 'auto' | 'confirm' | 'share' | 'profile' | 'counter';
};

export const REWARD_TASKS: RewardTask[] = [
  {
    key: 'save_3_favorites',
    title: 'Lưu 3 món yêu thích',
    description: 'Bấm trái tim ở các món bạn muốn thử để mở khóa nhiệm vụ này.',
    reward: 'Mở khóa mã ưu đãi',
    actionLabel: 'Xem thực đơn',
    kind: 'auto',
  },
  {
    key: 'follow_social',
    title: 'Theo dõi Nhiên CàFe',
    description: 'Theo dõi Facebook hoặc Instagram rồi quay lại xác nhận.',
    reward: 'Tăng cơ hội nhận mã',
    actionLabel: 'Xác nhận đã theo dõi',
    kind: 'confirm',
  },
  {
    key: 'share_shop',
    title: 'Chia sẻ link quán',
    description: 'Gửi link Nhiên CàFe cho bạn bè hoặc lưu để rủ nhau ghé quán.',
    reward: 'Hoàn thành nhiệm vụ chia sẻ',
    actionLabel: 'Chia sẻ ngay',
    kind: 'share',
  },
  {
    key: 'complete_profile',
    title: 'Hoàn thiện hồ sơ',
    description: 'Đăng nhập bằng tài khoản có tên và email để quán nhận diện bạn.',
    reward: 'Sẵn sàng tích điểm',
    actionLabel: 'Xem hồ sơ',
    kind: 'profile',
  },
  {
    key: 'qr_checkin',
    title: 'Check-in tại quán bằng QR',
    description: 'Quét QR tại quầy khi ghé quán để nhân viên xác nhận.',
    reward: 'Nhận stamp tại quán',
    actionLabel: 'Thực hiện tại quầy',
    kind: 'counter',
  },
];

export function isPromotionExpired(promotion: Promotion) {
  if (!promotion.end_date || promotion.end_date === '-') {
    return false;
  }

  const endDate = new Date(promotion.end_date);

  if (Number.isNaN(endDate.getTime())) {
    return false;
  }

  endDate.setHours(23, 59, 59, 999);
  return endDate.getTime() < Date.now();
}

export function getPromotionStatus(promotion: Promotion) {
  if (!promotion.active) {
    return 'Đã dừng';
  }

  if (isPromotionExpired(promotion)) {
    return 'Hết hạn';
  }

  if (
    promotion.max_total_redemptions &&
    (promotion.usage_count || 0) >= promotion.max_total_redemptions
  ) {
    return 'Hết lượt';
  }

  return 'Đang chạy';
}

export function isPromotionClaimable(promotion: Promotion) {
  const belowTotalLimit =
    !promotion.max_total_redemptions ||
    (promotion.usage_count || 0) < promotion.max_total_redemptions;

  return promotion.active && !isPromotionExpired(promotion) && belowTotalLimit;
}
