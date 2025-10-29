# Hướng dẫn Deploy lên Vercel

## Bước 1: Chuẩn bị Git Repository

Đảm bảo code đã được push lên GitHub, GitLab hoặc Bitbucket:

```bash
# Nếu chưa có git repository
git init
git add .
git commit -m "Initial commit"

# Thêm remote repository (thay YOUR_REPO_URL bằng URL repository của bạn)
git remote add origin YOUR_REPO_URL
git branch -M main
git push -u origin main
```

## Bước 2: Đăng nhập Vercel

1. Truy cập [https://vercel.com](https://vercel.com)
2. Đăng nhập bằng GitHub/GitLab/Bitbucket account
3. Vào Dashboard

## Bước 3: Import Project

1. Click **"Add New Project"** hoặc **"Import Project"**
2. Chọn repository `picklespend` từ danh sách
3. Hoặc paste URL của repository nếu không thấy

## Bước 4: Cấu hình Project

Vercel sẽ tự động detect Next.js, bạn chỉ cần:

### Framework Preset: 
- Tự động chọn **Next.js** (không cần thay đổi)

### Root Directory:
- Để trống hoặc `.` (nếu project ở root)

### Build Command:
- Để mặc định: `npm run build`

### Output Directory:
- Để mặc định: `.next`

### Install Command:
- Để mặc định: `npm install`

## Bước 5: Thêm Environment Variables

Trước khi deploy, thêm biến môi trường:

1. Trong màn hình cấu hình project, scroll xuống phần **"Environment Variables"**
2. Thêm biến:

   **Name:** `TURSO_AUTH_TOKEN`  
   **Value:** `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjE3MzA2ODEsImlkIjoiMjYxMjA0YTgtZmQ5ZS00Y2ZlLTgyYzAtNGI3OWMzNTVkNjM2IiwicmlkIjoiYmYzMDI3OGEtNzMyNy00NWQxLWFhZWEtNzIxMTRhY2UwNGJlIn0.TkBUeQYuBmu_eRIGoPp51JWsrql5TQAY2_y6mgvxLUTmAevQhLaja6UJIeYl6OoxJOGOy-FltOE2rf2tWSxBDg`

3. Chọn môi trường: **Production**, **Preview**, và **Development** (hoặc chỉ Production)

**Lưu ý:** Nếu bạn có auth token khác, hãy thay thế giá trị trên.

## Bước 6: Deploy

1. Click **"Deploy"**
2. Đợi Vercel build và deploy (thường mất 2-3 phút)
3. Khi xong, bạn sẽ nhận được một URL như: `https://picklespend.vercel.app`

## Bước 7: Kiểm tra

1. Truy cập URL được cung cấp
2. Kiểm tra xem app có chạy đúng không
3. Test các tính năng: thêm member, tạo game, etc.

## Lưu ý quan trọng

1. **Database sẽ tự động được khởi tạo** khi bạn truy cập lần đầu (gọi API `/api/init`)

2. **Mỗi lần push code mới**, Vercel sẽ tự động deploy lại

3. **Production URL** sẽ được tạo tự động. Bạn có thể thêm custom domain sau

4. **Preview Deployments**: Mỗi Pull Request sẽ có một preview URL riêng để test

## Cách deploy qua CLI (Tùy chọn)

Nếu muốn dùng Vercel CLI:

```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy production
vercel --prod
```

## Troubleshooting

### Build fails
- Kiểm tra logs trong Vercel Dashboard
- Đảm bảo tất cả dependencies đã được thêm vào `package.json`

### Database connection errors
- Kiểm tra `TURSO_AUTH_TOKEN` environment variable đã được set đúng chưa
- Kiểm tra URL database trong `lib/db.ts`

### Environment variables không hoạt động
- Đảm bảo đã thêm đúng tên biến và chọn đúng môi trường
- Redeploy sau khi thêm/sửa environment variables

