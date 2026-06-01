# Nhiên CàFe - Hướng dẫn chức năng

Tài liệu này mô tả cách các chức năng khách hàng, ưu đãi, thành viên và admin đang hoạt động trong website.

## 1. Cài đặt bắt buộc

Trước khi test đầy đủ, chạy SQL trong Supabase theo thứ tự:

1. `supabase_schema.sql`
2. `supabase_migration_v2.sql`
3. `supabase_customer_engagement.sql`
4. `supabase_storage.sql`
5. `supabase_hero_image_settings.sql` nếu database cũ chưa có `hero_image_url`

Các biến môi trường cần có:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ADMIN_EMAILS=
OPENAI_API_KEY=
OPENAI_MENU_IMPORT_MODEL=
```

`NEXT_PUBLIC_ADMIN_EMAILS` là danh sách email admin, phân tách bằng dấu phẩy.

## 2. Trang chủ

Trang chủ lấy dữ liệu từ Supabase và hiển thị:

- Hero image từ `store_settings.hero_image_url`.
- Footer từ `store_settings`: tên quán, hotline, địa chỉ, Facebook, Instagram, giờ mở cửa.
- Menu từ bảng `products`.
- Ưu đãi từ bảng `promotions`.
- Nút hành động nổi trên mobile: gọi, chỉ đường, xem menu, nhắn Facebook.

## 3. Menu

Khách có thể:

- Xem nhiều món hơn thay vì chỉ 6 món ngẫu nhiên.
- Tìm món theo tên, mô tả, danh mục hoặc sub category.
- Lọc theo category.
- Bấm vào card để xem modal chi tiết món.
- Bấm trái tim để lưu món yêu thích.

Nếu khách chưa đăng nhập khi bấm trái tim, website mở modal đăng nhập.

## 4. Món yêu thích

Bảng liên quan:

- `favorites`
- `products`

Luồng hoạt động:

1. Khách đăng nhập.
2. Bấm trái tim trên product card.
3. App ghi `{ user_id, product_id }` vào `favorites`.
4. Trang profile đọc lại danh sách yêu thích và hiển thị trong mục "Món yêu thích".

Mỗi user chỉ lưu một product một lần nhờ unique key `user_id, product_id`.

## 5. Ưu đãi hôm nay và nhiệm vụ

Bảng liên quan:

- `promotions`
- `tasks`
- `user_task_completions`
- `promotion_claims`
- `favorites`

Section "Ưu đãi hôm nay" nằm trên landing page. Khách đăng nhập rồi hoàn thành nhiệm vụ để nhận mã.

Nhiệm vụ mặc định:

- Lưu 3 món yêu thích.
- Theo dõi Facebook/Instagram rồi bấm xác nhận.
- Chia sẻ link quán.
- Hoàn thiện hồ sơ.
- Check-in tại quán bằng QR.

Điều kiện nhận mã hiện tại:

- Hoàn thành ít nhất 2 nhiệm vụ online.
- Promotion phải đang active và chưa hết hạn.
- Promotion chưa chạm `max_total_redemptions` nếu có giới hạn tổng.
- Mỗi user chỉ nhận một lần cho mỗi promotion.
- Mỗi claim có `remaining_uses` theo `promotions.max_redemptions_per_user`.

Khi nhận mã:

1. App kiểm tra user đã đăng nhập.
2. App ghi vào `promotion_claims`.
3. Profile hiển thị mã đã nhận.
4. Khách có thể copy code để dùng tại quầy.

Khi áp dụng mã tại quầy:

1. Admin/cashier vào `/admin/redeem`.
2. Nhập code khách đưa.
3. Chọn đúng lượt claim của khách.
4. Bấm "Áp dụng mã".
5. App cập nhật `promotion_claims.redeemed_at`, `redeemed_by`, `redeem_note`, `redeemed_count`, `remaining_uses`.
6. App tăng `promotions.usage_count` qua RPC `increment_promotion_usage`.

Profile khách sẽ hiển thị mã nào đã dùng.

## 6. Theo dõi fanpage có xác minh tự động được không?

Không nên coi việc "đã follow fanpage" là một điều kiện có thể xác minh tự động đáng tin cậy bằng website hiện tại.

Lý do:

- Graph API có thể đọc các chỉ số tổng như `fan_count`, nhưng đó là số tổng của Page, không phải danh sách user cụ thể.
- Webhook của Page không cung cấp luồng sự kiện ổn định để báo "user X vừa follow Page".
- Việc yêu cầu user cấp quyền mạng xã hội để đọc likes/follows là nhạy cảm, phụ thuộc App Review và không phù hợp cho flow nhận voucher nhanh của quán nhỏ.

Cách nên dùng trong sản phẩm này:

- Cách hiện tại: mở fanpage, khách tự xác nhận đã theo dõi.
- Cách chắc hơn: đăng một mã bí mật trên fanpage, khách nhập mã đó vào website.
- Cách tại quầy: nhân viên nhìn màn hình follow rồi bấm xác nhận QR/check-in.
- Cách qua Messenger: yêu cầu khách nhắn một keyword cho Page; nếu tích hợp Messenger webhook sau này, hệ thống có thể xác nhận khách đã tương tác với Page, nhưng vẫn không đồng nghĩa chắc chắn là đã follow.

Khuyến nghị: dùng "Theo dõi fanpage" như nhiệm vụ tự xác nhận hoặc mã bí mật trên fanpage, không dùng làm điều kiện giá trị cao.

## 7. Profile khách hàng

Profile hiển thị:

- Thông tin tài khoản.
- QR/mã thành viên.
- Món yêu thích.
- Mã khuyến mãi đã nhận.
- Nhiệm vụ đã hoàn thành.
- Điểm, stamp và hạng thành viên.
- Lịch sử cộng/đổi điểm.

Khi user mở profile, app tự upsert:

- `profiles`: user id, tên, email.
- `loyalty_accounts`: tài khoản điểm/stamp mặc định.

Nhờ vậy admin/cashier có thể tìm thấy user trong trang thành viên sau khi khách đã đăng nhập ít nhất một lần.

## 8. Stamp card và tích điểm

Bảng liên quan:

- `profiles`
- `loyalty_accounts`
- `loyalty_transactions`

Mô hình hiện tại:

- Mua 1 ly = 1 stamp.
- Đủ 8 stamp = có thể đổi 1 món.
- Admin/cashier cộng stamp hoặc điểm tại `/admin/loyalty`.
- Khi đổi thưởng, hệ thống trừ 8 stamp và ghi lịch sử.

Hạng thành viên tạm tính theo điểm + stamp:

- `Member`: mặc định.
- `Silver`: từ 200 điểm quy đổi.
- `Gold`: từ 500 điểm quy đổi.

## 9. Admin: Thành viên & Stamp

Vào `/admin/loyalty`.

Admin/cashier có thể:

- Tìm khách theo tên, email, số điện thoại hoặc user id.
- Xem hạng, stamp và điểm hiện có.
- Cộng stamp/điểm.
- Đổi 8 stamp lấy 1 món.
- Xem lịch sử giao dịch gần đây.

Lưu ý: trang này chỉ thấy khách đã từng mở profile hoặc được tạo profile trong Supabase.

## 10. Admin: Cài đặt cửa hàng

Vào `/admin/hours`.

Admin có thể chỉnh:

- Tên thương hiệu.
- Hotline.
- Địa chỉ.
- Facebook/Instagram.
- Google Maps embed URL.
- Giờ mở cửa từng ngày.

Footer trang chủ dùng dữ liệu này, bao gồm iframe bản đồ.

## 11. Admin: Promotions

Vào `/admin/promotions`.

Admin có thể:

- Tạo mã khuyến mãi.
- Cài số lượt dùng cho mỗi user.
- Cài tổng lượt áp dụng tối đa nếu cần.
- Bật/tắt mã.
- Xóa mã.
- Theo dõi số lượt nhận và số lượt đã áp dụng theo từng mã.

Landing page chỉ hiển thị mã `active = true`.

## 12. Admin: Áp dụng mã

Vào `/admin/redeem`.

Admin/cashier có thể:

- Nhập code khách đưa.
- Xem danh sách user đã nhận code đó.
- Biết code đã dùng hay chưa.
- Đánh dấu code là đã dùng.
- Ghi chú lần áp dụng.
- Copy user id nếu cần đối chiếu với QR/mã thành viên.

Mỗi claim chỉ được redeem một lần vì thao tác update chỉ áp dụng khi `redeemed_at IS NULL`.

## 13. Admin: Analytics tổng

Vào `/admin/dashboard`.

Dashboard hiện đếm từ Supabase:

- Tổng user có profile.
- Tổng mã đã nhận.
- Tổng mã đã áp dụng.
- Tổng favorite.
- Tổng stamp đã cộng.
- Tổng sản phẩm.
- Tổng best seller.
- Tỷ lệ mã nhận được áp dụng.
- Top món được favorite.

## 14. Giới hạn bảo mật hiện tại

Repo hiện vẫn dùng Supabase client ở frontend cho nhiều trang admin.

RLS đang cho user authenticated quản lý một số bảng admin để app chạy được trong bản đầu. Trước production nghiêm túc nên nâng cấp:

- Dùng role admin trong `app_metadata`.
- Hoặc dùng bảng `admin_users`.
- Hoặc chuyển thao tác admin nhạy cảm sang route handler dùng service role server-side.
- Siết lại policy của `profiles`, `loyalty_accounts`, `loyalty_transactions`, `products`, `promotions`, `banners`, `store_settings`.

## 15. Test nhanh

Chạy:

```bash
npm run lint
npm run build
npm run dev
```

Test thủ công:

- Trang chủ tải được.
- Menu tìm kiếm/lọc/mở modal được.
- Đăng nhập.
- Lưu món yêu thích.
- Hoàn thành nhiệm vụ.
- Nhận mã khuyến mãi.
- Profile hiển thị favorite, claim, QR, stamp.
- Admin `/admin/loyalty` cộng stamp và đổi thưởng.
- Admin `/admin/redeem` áp dụng mã và tăng usage count.
- Admin `/admin/hours` lưu thông tin cửa hàng.
