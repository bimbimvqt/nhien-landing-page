This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Quy Trình Khởi Chạy & Cập Nhật Server (Deployment Rules)

Mỗi khi bạn có sự thay đổi về **Code** (thêm/sửa/xoá tính năng) hoặc thay đổi **Biến môi trường (`.env`)** trên server, bạn **BẮT BUỘC** phải build lại các container để code mới và cấu hình mới được áp dụng.

### 1. Khởi chạy lần đầu hoặc Cập nhật toàn bộ (Cả Web và API)
Chạy lệnh sau tại thư mục chứa mã nguồn trên server:
```bash
docker compose up -d --build
```
*(Lệnh này sẽ tự động build lại image cho những service có thay đổi và khởi động lại container tương ứng).*

### 2. Nếu chỉ muốn cập nhật 1 phần cụ thể (để tiết kiệm thời gian)
Nếu bạn chỉ thay đổi code ở frontend (Web) hoặc backend (API), bạn có thể chỉ định cụ thể service để build lại:
- **Chỉ cập nhật Web (Next.js)**: 
  ```bash
  docker compose up -d --build web
  ```
- **Chỉ cập nhật API (Go)**:
  ```bash
  docker compose up -d --build api
  ```

### 3. Xử lý lỗi thường gặp
- **Lỗi thiếu mạng (network nginx-manager_default declared as external, but could not be found)**: 
  Hãy tạo mạng lưới ảo proxy trước khi chạy docker compose:
  ```bash
  docker network create nginx-manager_default
  ```
- **Lỗi không cập nhật giao diện hoặc lỗi gọi nhầm API cũ**:
  Do Next.js lưu cache biến môi trường vào lúc build (như `NEXT_PUBLIC_API_BASE_URL`). Nếu bạn sửa file `.env`, bạn bắt buộc phải chạy lệnh rebuild `docker compose up -d --build web`.

---

Các lệnh quản lý hữu ích khác:
```bash
# Xem log hệ thống
docker compose logs -f web
docker compose logs -f api

# Dừng toàn bộ hệ thống
docker compose down
```

### Migrate Supabase Data to Go/Postgres

With the Compose stack running, migrate public Supabase data into the Go API/Postgres backend:

```bash
npm run migrate:supabase
```

The script migrates `store_settings`, `products`, and `promotions`. User auth/session data remains on the existing Supabase Auth flow until the auth layer is migrated separately.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
