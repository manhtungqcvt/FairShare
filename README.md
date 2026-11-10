# FairShare 🏡💸

> Nền tảng web quản lý chi tiêu chung và đối soát công nợ minh bạch dành cho người ở ghép (roommates) hoặc các nhóm bạn đi du lịch, sinh hoạt chung.

[![GitHub Repo](https://img.shields.io/badge/GitHub-FairShare-emerald?style=flat&logo=github)](https://github.com/manhtungqcvt/FairShare)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22-green?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen?logo=mongodb)](https://www.mongodb.com/)
[![UI/UX Pro Max](https://img.shields.io/badge/UI%2FUX-Pro_Max_Certified-emerald)](https://github.com/manhtungqcvt/FairShare)

---

## 🌟 Tính Năng Nổi Bật

### 1. 🔄 Rolling Net Balance (Số Dư Gối Đầu Liên Tục)
- Không cần quyết toán toàn bộ sau mỗi lần đi chợ hay đóng tiền điện nước.
- Hệ thống tự động cộng dồn và bù trừ công nợ theo thời gian thực:
  - Khi bạn chi tiền trước: Số dư nợ ròng tăng lên (`+... ₫`).
  - Khi người khác chi và bạn tham gia chia tiền: Số dư nợ ròng giảm xuống (`-... ₫`).
  - Khi thanh toán/trả nợ (Settle Up): Số dư của cả 2 bên tự động cân bằng về 0.

### 2. ⚡ Tối Giản Hóa Công Nợ (Debt Simplification)
- Thuật toán tự động khớp các người nợ (số dư âm) với các chủ nợ (số dư dương) để tối ưu hoá dòng tiền, giảm tối đa số lần phải chuyển khoản ngân hàng giữa các thành viên.

### 3. 🎯 3 Chế Độ Chia Tiền Linh Hoạt
- **Chia đều (EQUAL):** Tự động chia đều cho các thành viên được chọn, xử lý phần dư làm tròn đến từng đơn vị đồng VNĐ.
- **Theo phần trăm (PERCENTAGE):** Chia theo tỷ lệ phần trăm tùy ý (tổng bằng 100%), hỗ trợ tính toán và hiển thị preview số tiền thực nhận ngay khi nhập liệu.
- **Số tiền chính xác (EXACT):** Phù hợp khi mỗi người ăn/tiêu một định mức khác nhau, kiểm tra khớp 100% tổng tiền hóa đơn.

### 4. 💎 Giao Diện UI/UX Pro Max Đạt Chuẩn Cao Cấp
- Thiết kế theo bảng màu hiện đại **Emerald Green (#059669) kết hợp Zinc/Slate**.
- Hiệu ứng **Glassmorphism** nhẹ nhàng cho Header và Modal.
- Hiển thị tài chính chuyên nghiệp với font số định dạng `tabular-nums` cho tiền tệ VNĐ.
- Bố cục **Bento Card** trực quan cho khu vực đối soát số dư.
- Dòng thời gian sao kê chi tiết, bấm vào để mở rộng xem phần chia tiền của từng thành viên.
- Mã mời nhóm 6 ký tự ngẫu nhiên kèm tính năng 1-click copy và phản hồi trực quan.

---

## 🏗️ Kiến Trúc & Tech Stack

```
FairShare/
├── backend/                  # Node.js & Express RESTful API Server
│   ├── config/               # Cấu hình kết nối MongoDB
│   ├── controllers/          # Business controllers (Auth, Groups, Expenses, Settlements)
│   ├── middleware/           # JWT auth & Group membership guards
│   ├── models/               # 4 Mongoose models (User, Group, Expense, Settlement)
│   ├── routes/               # REST API endpoints
│   ├── utils/
│   │   └── debtCalculator.js # Core logic: Splits, Rolling Net Balance & Debt Simplification
│   ├── server.js             # Express entry point
│   └── package.json
│
├── frontend/                 # React.js (Vite) + Tailwind CSS (UI/UX Pro Max)
│   ├── src/
│   │   ├── api/axios.js      # Axios instance với JWT Interceptors
│   │   ├── components/       # UI Components (Bento, Modals, Navbar, Button, Timeline)
│   │   ├── context/          # AuthContext & ToastContext
│   │   ├── pages/            # Login, Register, Dashboard, GroupDetail
│   │   ├── utils/            # formatVND, formatDateTime
│   │   ├── App.jsx           # React Router
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── package.json              # Workspace scripts
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Yêu Cầu Môi Trường
- **Node.js** >= 18 (Khuyên dùng v20+)
- **MongoDB** đang chạy trên máy local (`mongodb://localhost:27017`) hoặc đường dẫn URI từ MongoDB Atlas.

### 1. Clone Kho Mã Nguồn
```bash
git clone https://github.com/manhtungqcvt/FairShare.git
cd FairShare
```

### 2. Cài Đặt Dependencies
```bash
npm run install:all
```
*(Hoặc vào từng thư mục `cd backend && npm install` và `cd ../frontend && npm install`)*

### 3. Cấu Hình Biến Môi Trường (Backend)
Tạo file `backend/.env` (tham khảo `backend/.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/fairshare_db
JWT_SECRET=fairshare_jwt_super_secret_key_2026_roommates_safe
JWT_EXPIRE=30d
```

### 4. Khởi Chạy Ứng Dụng

**Chạy Backend Server:**
```bash
cd backend
npm run dev
# Server lắng nghe tại http://localhost:5000
```

**Chạy Frontend (trong một cửa sổ terminal khác):**
```bash
cd frontend
npm run dev
# Ứng dụng web mở tại http://localhost:3000
```

---

## 📡 Danh Sách RESTful API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` - Đăng ký tài khoản mới (Họ tên, email, mật khẩu, avatar)
- `POST /api/auth/login` - Đăng nhập tài khoản, nhận JWT token
- `GET /api/auth/me` - Lấy thông tin cá nhân hiện tại (Protected)
- `PUT /api/auth/profile` - Cập nhật thông tin tài khoản (Protected)

### 👥 Groups (`/api/groups`)
- `POST /api/groups` - Tạo phòng trọ/nhóm mới (Tự sinh mã mời `inviteCode` 6 ký tự)
- `GET /api/groups` - Lấy danh sách các phòng người dùng tham gia kèm số dư cá nhân
- `GET /api/groups/:id` - Lấy chi tiết thông tin phòng và danh sách thành viên
- `POST /api/groups/join` - Tham gia phòng thông qua mã mời `inviteCode`
- `GET /api/groups/:id/balances` - Tính toán đối soát số dư nợ ròng & danh sách nợ tối giản
- `GET /api/groups/:id/history` - Dòng thời gian sao kê tổng hợp (Khoản chi + Quyết toán)

### 🧾 Expenses (`/api/expenses`)
- `POST /api/expenses` - Tạo khoản chi mới với 3 chế độ chia tiền (`EQUAL`, `PERCENTAGE`, `EXACT`)
- `GET /api/expenses/group/:groupId` - Lấy toàn bộ các khoản chi của nhóm
- `GET /api/expenses/:id` - Xem chi tiết khoản chi
- `DELETE /api/expenses/:id` - Xóa khoản chi (Chỉ dành cho người tạo hoặc Admin nhóm)

### 🤝 Settlements (`/api/settlements`)
- `POST /api/settlements` - Ghi nhận thanh toán / quyết toán công nợ giữa 2 thành viên
- `GET /api/settlements/group/:groupId` - Danh sách các lần quyết toán công nợ
- `DELETE /api/settlements/:id` - Xóa giao dịch quyết toán

---

## 🧪 Kiểm Thử & Tính Toán Công Nợ (Unit Testing)

Thuật toán `calculateRollingNetBalance` và `simplifyDebts` đã được kiểm thử độc lập:
```bash
node -e "require('./backend/utils/debtCalculator.js')"
```

---

## 🛡️ License
Dự án được phân phối dưới giấy phép ISC. Bản quyền thuộc về FairShare Team.
