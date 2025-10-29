# PickleSpend

Ứng dụng quản lý chi tiêu và thanh toán cho nhóm chơi Pickleball. Ứng dụng sử dụng JAMStack với Next.js và kết nối với database Turso (SQLite sync).

## Tính năng

- **Quản lý thành viên**: Thêm, sửa, xóa thành viên và theo dõi số dư
- **Quản lý khách**: Quản lý khách và có thể chuyển khách thành thành viên
- **Nạp tiền**: Ghi nhận các khoản nạp tiền của thành viên
- **Quản lý Game**: Tạo game với tiền sân, tiền nước, danh sách thành viên và khách tham gia
- **Quản lý cần thu**: Tự động tính toán số tiền mỗi người phải trả. Với thành viên, trừ vào số dư. Với khách, tạo invoice cần thu.

## Yêu cầu

- Node.js 18+ 
- npm hoặc yarn

## Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd picklespend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Database đã được cấu hình sẵn với Turso. Lần đầu chạy ứng dụng, database sẽ tự động được khởi tạo.

## Chạy ứng dụng

### Development
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

### Production Build
```bash
npm run build
npm start
```

## Deploy lên Vercel

Xem file [DEPLOY.md](./DEPLOY.md) để có hướng dẫn chi tiết.

Tóm tắt các bước:

1. **Đẩy code lên GitHub repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

2. **Đăng nhập vào [Vercel](https://vercel.com)** và import project

3. **Thêm Environment Variable:**
   - Name: `TURSO_AUTH_TOKEN`
   - Value: (lấy từ Turso dashboard hoặc từ code hiện tại)

4. **Click Deploy** và đợi build hoàn tất

5. **Truy cập URL** được Vercel cung cấp

**Lưu ý:** Database sẽ tự động được khởi tạo khi bạn truy cập lần đầu.

## Cấu trúc Database

- **members**: Thông tin thành viên
- **guests**: Thông tin khách
- **deposits**: Giao dịch nạp tiền
- **games**: Thông tin game
- **game_members**: Mối quan hệ nhiều-nhiều giữa game và thành viên
- **game_guests**: Mối quan hệ nhiều-nhiều giữa game và khách
- **need_payments**: Bảng theo dõi các khoản cần thu

## Cách sử dụng

1. **Thêm thành viên**: Vào trang "Thành viên" và thêm các thành viên
2. **Nạp tiền**: Vào trang "Nạp tiền" để ghi nhận các khoản nạp tiền của thành viên
3. **Tạo Game**: Vào trang "Game", chọn ngày, nhập tiền sân, tiền nước, và chọn thành viên/khách tham gia
4. **Theo dõi cần thu**: Vào trang "Cần thu" để xem và đánh dấu các khoản đã thu từ khách

## Lưu ý

- Khi tạo game, hệ thống tự động tính số tiền mỗi người phải trả = (tiền sân + tiền nước) / tổng số người
- Với thành viên: Số tiền tự động trừ vào số dư (is_paid = true)
- Với khách: Tạo invoice cần thu (is_paid = false), khi thu xong đánh dấu trong trang "Cần thu"

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Turso (LibSQL - SQLite sync)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
