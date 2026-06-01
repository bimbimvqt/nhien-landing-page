# NEXT STEPS - Nhiên Cafe Landing Page

## Hiện trạng nhanh

- Dự án đang dùng Next.js `16.2.4`, React `19.2.4`, App Router trong `src/app`.
- `npm run lint` chạy sạch.
- `npm run build` chạy thành công.
- Trang chính, dashboard admin analytics, quản lý menu, hero image, banner, khuyến mãi, áp dụng mã, cài đặt cửa hàng, profile, yêu thích và nhận mã nhiệm vụ đã có khung chức năng.
- README vẫn là nội dung mặc định của `create-next-app`, chưa phản ánh cách cài đặt dự án thật.
- Đã có tài liệu chức năng tại `docs/FEATURES_GUIDE.md`.

## Cần làm trước khi deploy

### 1. Cấu hình môi trường

- Tạo/kiểm tra `.env.local` và biến production:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_ADMIN_EMAILS`
  - `OPENAI_API_KEY` nếu dùng tính năng import menu từ ảnh.
  - `OPENAI_MENU_IMPORT_MODEL` nếu muốn đổi model mặc định.
- Không commit `.env.local`.
- Kiểm tra callback URL trong Supabase Auth cho Google login:
  - Local: `http://localhost:3000`
  - Production: domain thật của website.

### 2. Hoàn tất Supabase

- Chạy lần lượt các file SQL trong Supabase SQL Editor:
  - `supabase_schema.sql`
  - `supabase_migration_v2.sql`
  - `supabase_customer_engagement.sql`
  - `supabase_storage.sql`
  - `supabase_hero_image_settings.sql` nếu database cũ chưa có `hero_image_url`.
- Tạo/kiểm tra bucket storage `product-images` là public.
- Seed dữ liệu thật cho:
  - `products`
  - `banners`
  - `promotions`
  - `store_settings`
  - `tasks` nếu muốn quản trị nhiệm vụ động sau này.

### 3. Siết bảo mật admin

- Hiện tại UI admin dùng `NEXT_PUBLIC_ADMIN_EMAILS` và kiểm tra quyền ở client.
- RLS SQL hiện cho phép mọi user đã đăng nhập ghi vào `products`, `banners`, `promotions`, `store_settings` và storage.
- Cần chuyển policy ghi sang kiểm tra admin thật, ví dụ qua `app_metadata.role = admin`, bảng `admin_users`, hoặc RPC bảo vệ bằng service role.
- Nên thêm middleware/server-side guard cho `/admin/*` để tránh chỉ dựa vào client redirect.

### 4. Cài đặt cửa hàng

- Đã có trang `/admin/hours` để chỉnh:
  - Tên thương hiệu.
  - Hotline.
  - Địa chỉ.
  - Facebook/Instagram.
  - Giờ mở cửa.
- Footer trang chủ đã dùng dữ liệu `store_settings` từ Supabase.
- Việc còn lại: test lưu dữ liệu trên Supabase production sau khi chạy đủ SQL/RLS.

### 5. Làm sạch dữ liệu demo

- Dashboard còn số liệu tĩnh như doanh thu, đơn hàng, khách hàng mới.
- Cần quyết định:
  - Ẩn các số liệu chưa có backend.
  - Hoặc tạo bảng/orders thật để dashboard lấy dữ liệu.
- Kiểm tra lại thông tin mặc định trong `storeSettings.ts` sau khi có dữ liệu chính thức cuối cùng của quán.

## Nên làm sau khi deploy bản đầu

### 6. Hoàn thiện UX khách hàng

- Kiểm tra flow đăng nhập Google/email trên production.
- Kiểm tra favorite, profile, nhận khuyến mãi, điểm/stamp nếu muốn dùng như chương trình thành viên.
- Kiểm tra flow nhận mã ưu đãi theo nhiệm vụ với user thật.
- Kiểm tra favorite, profile, nhận khuyến mãi, điểm/stamp trên Supabase production.
- Thêm trạng thái loading/error thân thiện hơn cho best seller.
- Kiểm tra responsive trên mobile thật, đặc biệt navbar, modal login và admin menu.

### 7. Ảnh và SEO

- Thay ảnh local/default bằng ảnh thật của quán.
- Thêm favicon/app icon mới vì favicon cũ đang bị xóa trong git status.
- Cập nhật metadata trong `src/app/layout.tsx`:
  - Title.
  - Description.
  - Open Graph image.
  - URL production.
- Cân nhắc dùng `next/image` cho ảnh sản phẩm/hero nếu muốn tối ưu tải ảnh.

### 8. Tài liệu vận hành

- Viết lại `README.md` theo dự án thật:
  - Cách chạy local.
  - Biến môi trường.
  - Thứ tự chạy SQL.
  - Cách deploy.
  - Tài khoản/quyền admin.
- Ghi rõ bucket Supabase và policy cần có.
- Ghi rõ cách dùng import menu từ ảnh và yêu cầu `OPENAI_API_KEY`.

### 9. Kiểm thử trước khi bàn giao

- Test thủ công các luồng chính:
  - Mở trang chủ.
  - Xem menu.
  - Đăng nhập/đăng xuất.
  - Favorite sản phẩm.
  - Admin thêm/sửa/xóa món.
  - Admin upload ảnh sản phẩm.
  - Admin đổi ảnh hero.
- Admin thêm/sửa/xóa banner và khuyến mãi.
  - Khách lưu món yêu thích, hoàn thành nhiệm vụ và nhận mã.
  - Admin áp dụng mã tại `/admin/redeem` và kiểm tra `usage_count`.
  - Import menu từ ảnh.
- Chạy lại:

```bash
npm run lint
npm run build
```

## Ưu tiên đề xuất

1. Siết bảo mật Supabase RLS và admin guard.
2. Seed dữ liệu thật và ảnh thật.
3. Thêm xác nhận QR check-in nâng cao nếu muốn tự động hơn tại quầy.
4. Viết lại README.
5. Test production auth/storage/import menu.
