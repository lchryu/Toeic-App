# 🎯 TOEIC 900+ | Auto-Checker SPA

A modern, highly interactive Serverless Fullstack Web Application designed exclusively for rapid TOEIC answer checking and intensive self-practice. 

## 🌟 Mục tiêu dự án (Project Objective)
Dự án này được tạo ra với hai mục đích cốt lõi:
1. **Phục vụ học tập & Nâng cao kỹ năng**: Áp dụng và củng cố kiến thức về Serverless Architecture, phát triển Single Page Application (SPA) qua kiến trúc Vanilla JS kết hợp Firebase.
2. **Công cụ tự luyện thi chứng chỉ TOEIC 900+**: Cung cấp một nền tảng hỗ trợ luyện đề tốc độ cao, tiết kiệm tới 80% thời gian dò và đếm đáp án thủ công so với giải trên giấy. Giúp người làm tập trung tối đa vào việc review lỗi sai để bứt phá band điểm.

---

## ✨ Tính năng nổi bật (Key Features)

### 💻 Trải nghiệm Làm Bài (Test Taking Experience)
- **Tốc Độ Bàn Phím (Keyboard Shortcuts)**: Nhấn bàn phím cứng `A`, `B`, `C`, `D` để nhập câu trả lời siêu chuẩn; dùng mũi tên `⬅️` / `➡️` để chuyển tiếp qua lại các câu.
- **Auto-Grading Mạng Lưới (Visual Grid)**: Ngay khi nộp bài, lưới 200 câu sẽ phản hồi màu sắc Xanh (Đúng), Đỏ (Sai) cực trực quan, cho phép hover chuột để biết ngay "Bạn đã chọn gì vs Đáp án đúng là gì?".
- **Responsive Mobile-Touch UI**: Giao diện được thiết kế thích ứng 100% cho điện thoại cảm ứng, biến các phím điều hướng thành Icon siêu lớn và loại bỏ các mảng thông tin rườm rà.

### 👑 Quản Trị Đề Thi (Admin Dashboard)
- **Kéo & Thả (Drag/Drop) Nạp Đề Nhanh**: Cho phép upload đáp án vào kho ngay lập tức bằng việc ném file `.txt` vào. Độ dài đề tự co giãn (từ mini test 10 câu tới Test chuẩn 200 câu).
- **📝 Nạp Đề Thủ Công (Mobile-Friendly)**: Bổ sung panel nhập liệu đáp án bằng tay cực nhanh. Tính năng sinh ra để các admin có thể đăng đề, tạo đề luyện tập từ xa thông qua ứng dụng Điện Thoại mà không cần tải hay thao tác file phức tạp!
- **Sửa Đề Trực Tuyến**: Lưới UI thông minh cho Admin dùng để tùy chỉnh text hoặc sửa từng đáp án sai lệch. Có ô đính kèm Link PDF/Giải thích cho mỗi đề trắc nghiệm.

### 💬 Thảo Luận Mở (Real-time Discussion)
- **Realtime Comments (Firestore)**: Nhờ `onSnapshot`, mỗi Test là một forum. 1 người để lại câu hỏi "Câu 120 mẹo là gì?", mọi người trong phòng lập tức nhìn thấy tin nhắn trên màn hình mà không cần Refresh. 
- **Google Authentication**: Quy trình đăng nhập tức thời, an toàn; xác thực chặt quyền admin (`lch.ryu2001@gmail.com`).

---

## 🛠 Công Nghệ (Tech Stack)

- **Frontend Core**: Vanilla JS (ES6+), HTML5, CSS3 Custom Properties (Bọc màng Glassmorphism cao cấp cùng Dark Mode dịu mắt).
- **Tooling**: Vite (Hot Reload biên dịch siêu việt).
- **Backend (BaaS)**: Firebase
  - *Firestore*: Xử lý Database NoSQL thời gian thực.
  - *Firebase Authentication*: Phân luồng Single Sign-on.

---

## 🚀 Setup & Cài Đặt

Dự án này sử dụng Vite. Đảm bảo cấu hình Node.js đã được cài đặt.

1. **Clone repository**
   ```bash
   git clone https://github.com/lchryu/Toeic-App.git
   cd Toeic-App
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies)**
   ```bash
   npm install
   ```

3. **Chạy Môi Trường Phát Triển (Dev Server)**
   ```bash
   npm run dev
   ```

**Lưu ý Cấu Hình:**
Điền đúng thông số vào file `src/firebase.js`. Mặc định quyền Tác giả/Quản trị viên (được nạp dề, sửa, xoá đề) sẽ bám dính lấy email config cứng trong source.

---
*Created and maintained by LCH Ryu*