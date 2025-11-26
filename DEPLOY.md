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
2. Thêm các biến sau:

   **Biến 1:**
   - **Name:** `TURSO_AUTH_TOKEN`  
   - **Value:** (Turso token)
   
   **Biến 2:**
   - **Name:** `ADMIN_PASS`
   - **Value:** (Nhập password bạn muốn dùng để login vào /superadmin)
   
   **Biến 3 (Tùy chọn - để bảo mật Cron Job):**
   - **Name:** `CRON_SECRET`
   - **Value:** (Một chuỗi secret ngẫu nhiên, ví dụ: `your-secret-key-here`)

3. Chọn môi trường: **Production**, **Preview**, và **Development** (hoặc chỉ Production)

**Lưu ý:** 
- Nếu bạn có auth token khác, hãy thay thế giá trị trên
- `ADMIN_PASS` là password để truy cập trang admin và hiển thị các tính năng quản lý (Nạp tiền, Game, Cần thu)

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

## Cron Jobs

Ứng dụng sử dụng Vercel Cron Jobs để tự động tính toán badges vào ngày mùng 1 hàng tháng.

### Cấu hình Cron Job

Cron job đã được cấu hình trong file `vercel.json`:
- **Schedule:** `0 0 1 * *` (00:00 UTC ngày mùng 1 hàng tháng)
- **Endpoint:** `/api/cron/calculate-badges`

**Lưu ý về bảo mật:**
- Vercel Cron Jobs được bảo vệ tự động bởi Vercel infrastructure - chỉ Vercel mới có thể gọi các endpoint này
- File `vercel.json` chỉ cấu hình lịch trình, không chứa secret
- Nếu muốn thêm lớp bảo mật bổ sung, bạn có thể:
  1. Thêm `CRON_SECRET` vào Environment Variables trên Vercel Dashboard
  2. Cron job sẽ verify secret này khi được gọi

### Kiểm tra Cron Job

1. Vào Vercel Dashboard → Project → Settings → Cron Jobs
2. Kiểm tra xem cron job đã được kích hoạt chưa
3. Xem logs trong Vercel Dashboard để kiểm tra cron job có chạy thành công không

### Test Cron Job (Development)

**Lưu ý:** Vercel Cron chỉ có thể được gọi bởi Vercel infrastructure. Để test trong development:

1. **Cách 1:** Deploy lên Vercel và kiểm tra logs
2. **Cách 2:** Gọi API trực tiếp với secret (nếu đã set CRON_SECRET):
```bash
# Nếu có CRON_SECRET
curl "https://your-domain.vercel.app/api/cron/calculate-badges?secret=your-secret"

# Hoặc với Authorization header
curl -H "Authorization: Bearer your-secret" https://your-domain.vercel.app/api/cron/calculate-badges
```

**Lưu ý:** Cron job sẽ tính toán badges cho tháng trước đó (tháng vừa kết thúc).

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

