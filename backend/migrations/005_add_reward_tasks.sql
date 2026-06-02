alter table store_settings add column if not exists reward_tasks jsonb;

update store_settings
set reward_tasks = '[
  {"key": "save_3_favorites", "title": "Lưu 3 món yêu thích", "description": "Bấm trái tim ở các món bạn muốn thử để mở khóa nhiệm vụ này.", "reward": "Mở khóa mã ưu đãi", "actionLabel": "Xem thực đơn", "kind": "auto", "active": true},
  {"key": "follow_social", "title": "Theo dõi Nhiên CàFe", "description": "Theo dõi Facebook hoặc Instagram rồi quay lại xác nhận.", "reward": "Tăng cơ hội nhận mã", "actionLabel": "Xác nhận đã theo dõi", "kind": "confirm", "active": true},
  {"key": "share_shop", "title": "Chia sẻ link quán", "description": "Gửi link Nhiên CàFe cho bạn bè hoặc lưu để rủ nhau ghé quán.", "reward": "Hoàn thành nhiệm vụ chia sẻ", "actionLabel": "Chia sẻ ngay", "kind": "share", "active": true},
  {"key": "complete_profile", "title": "Hoàn thiện hồ sơ", "description": "Đăng nhập bằng tài khoản có tên và email để quán nhận diện bạn.", "reward": "Sẵn sàng tích điểm", "actionLabel": "Xem hồ sơ", "kind": "profile", "active": true},
  {"key": "qr_checkin", "title": "Check-in tại quán bằng QR", "description": "Quét QR tại quầy khi ghé quán để nhân viên xác nhận.", "reward": "Nhận stamp tại quán", "actionLabel": "Thực hiện tại quầy", "kind": "counter", "active": true}
]'::jsonb
where id = 1 and reward_tasks is null;
