Chào bạn, dưới đây là nội dung từ file PDF **ASE_Assignment (3).pdf** đã được chuyển đổi sang định dạng Markdown (.md) để bạn có thể dễ dàng sử dụng với Cursor:

---

# BÁO CÁO BÀI TẬP: HỆ THỐNG GIÁM SÁT VỊ TRÍ TRẺ EM (CLMS)
**Nhóm:** CC01-GROUP 1  
**Học kỳ:** 252  
**Giảng viên:** TRƯƠNG TUẤN ANH  
[cite_start]**Trường:** Đại học Bách Khoa TP.HCM - ĐHQG-HCM [cite: 410, 411, 412, 413, 414, 415, 416, 417, 418, 419]

## Danh sách thành viên và phân công công việc
| Họ và tên | MSSV | Công việc | Đóng góp |
| :--- | :--- | :--- | :--- |
| Nguyễn Trịnh Tiến Đạt | 2252147 | Toàn bộ | 100% |
| Arsyad Ghudzamir AFIF | 2560139 | Toàn bộ | 100% |
| Cao Quế Phương | 2252652 | Toàn bộ | 100% |
| Đặng Minh Khang | 2252287 | Toàn bộ | 100% |
| Đặng Ngọc Phú | 2252617 | Toàn bộ | 100% |
[cite_start][cite: 420]

---

## PHẦN 1: TỔNG QUAN HỆ THỐNG

### Câu 1: Mô tả hệ thống
[cite_start]Hệ thống **CLMS** cung cấp dịch vụ cho phụ huynh giám sát con cái thông qua ứng dụng di động cài đặt trên điện thoại của trẻ để thu thập dữ liệu vị trí GPS định kỳ[cite: 422, 423, 424, 425].
* [cite_start]Phụ huynh truy cập thông tin qua giao diện web hoặc di động để xem vị trí hiện tại trên bản đồ[cite: 426].
* [cite_start]Hệ thống hỗ trợ theo dõi vị trí cơ bản và lưu trữ lịch sử ngắn hạn để giảm độ phức tạp và tài nguyên[cite: 427, 428].
* [cite_start]Đảm bảo kiểm soát truy cập để chỉ phụ huynh được ủy quyền mới xem được dữ liệu[cite: 429].
* [cite_start]Các tính năng bổ sung: Thiết lập vùng an toàn (geofencing) với thông báo khi trẻ ra ngoài và chức năng khẩn cấp (SOS)[cite: 430, 431, 432].

### Câu 2: Biểu đồ Use Case và Kiến trúc hệ thống
* [cite_start]**Use Case:** Bao gồm các hoạt động như Đăng nhập, Xem vị trí, Quản lý vùng an toàn, Nhận thông báo cho Phụ huynh; và Gửi dữ liệu vị trí tự động, Gửi cảnh báo SOS cho Trẻ em[cite: 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461].
* [cite_start]**Kiến trúc phân lớp:** [cite: 462]
    * [cite_start]**Presentation Layer:** Giao diện ứng dụng Phụ huynh và Trẻ em[cite: 463, 464, 465, 481].
    * [cite_start]**Service Layer:** Xử lý xác thực, vùng an toàn, thông báo[cite: 466, 467, 468, 469, 470, 482].
    * [cite_start]**Business Layer:** Quản lý người dùng, vị trí và các quy tắc nghiệp vụ cốt lõi[cite: 471, 472, 473, 474, 482].
    * [cite_start]**Data Layer:** Lưu trữ (MySQL) và giao tiếp với API bên ngoài (Bản đồ, Thông báo)[cite: 475, 476, 477, 478, 479, 480, 483].

### Câu 3: Các biện pháp đảm bảo độ tin cậy (Dependability)
[cite_start]Để hệ thống hoạt động tin cậy, cần thực hiện[cite: 484, 485]:
1. [cite_start]**Khả năng chịu lỗi:** Sử dụng máy chủ dự phòng và sao lưu dữ liệu[cite: 486, 487, 488, 489].
2. [cite_start]**Bảo mật & Riêng tư:** Mã hóa liên lạc và kiểm soát truy cập nghiêm ngặt[cite: 490, 491].
3. [cite_start]**Độ chính xác dữ liệu:** Kiểm tra dữ liệu GPS trước khi lưu trữ[cite: 492, 493].
4. [cite_start]**Giám sát hệ thống:** Theo dõi hiệu suất và sức khỏe máy chủ liên tục[cite: 494, 495, 496].
5. [cite_start]**Bảo trì thường xuyên:** Cập nhật phần mềm và vá lỗi định kỳ[cite: 497, 498].
6. [cite_start]**Xem xét an toàn:** Lọc các tín hiệu GPS bất thường để tránh báo động giả[cite: 499, 500, 501].

---

## PHẦN 2: KỸ THUẬT AN TOÀN (SAFETY ENGINEERING)

### Câu 8: Hazard, Accident và Damage
* [cite_start]**Hazard (Mối nguy):** Điều kiện có tiềm năng gây tai nạn (VD: Lỗi cảm biến GPS)[cite: 562, 564, 565].
* [cite_start]**Accident (Tai nạn):** Sự kiện không mong muốn gây thiệt hại (VD: Phụ huynh không tìm thấy con trong tình huống nguy hiểm)[cite: 566, 567, 570, 571].
* [cite_start]**Damage (Thiệt hại):** Hậu quả sau tai nạn (VD: Nguy hiểm đến tính mạng trẻ em, mất uy tín hệ thống)[cite: 572, 573].

### Câu 11: Yêu cầu an toàn
1. [cite_start]**Ngăn chặn báo cáo vị trí sai:** Hệ thống phải xác thực và đối chiếu dữ liệu GPS từ nhiều nguồn (Wi-Fi, Cellular) trước khi hiển thị[cite: 591, 592, 593, 594, 595].
2. [cite_start]**Đảm bảo gửi cảnh báo SOS:** Sử dụng các cơ chế thử lại và kênh dự phòng (như SMS) khi kênh chính gặp sự cố[cite: 596, 597, 598, 599].

---

## PHẦN 3: KỸ THUẬT BẢO MẬT (SECURITY ENGINEERING)

### Câu 13: CIA (Confidentiality, Integrity, Availability)
* [cite_start]**Tính bảo mật (Confidentiality):** Đảm bảo chỉ người dùng được cấp quyền mới xem được dữ liệu[cite: 367, 368].
* [cite_start]**Tính toàn vẹn (Integrity):** Đảm bảo dữ liệu chính xác và không bị chỉnh sửa trái phép[cite: 369].
* [cite_start]**Tính sẵn sàng (Availability):** Đảm bảo hệ thống luôn có thể truy cập khi cần[cite: 370].

### Câu 16: Yêu cầu bảo mật
1. [cite_start]**Mã hóa dữ liệu khi truyền tải:** Sử dụng TLS 1.3 cho mọi thông tin liên lạc[cite: 403, 404].
2. [cite_start]**Xác thực mạnh:** Triển khai chính sách mật khẩu mạnh và xác thực đa yếu tố (MFA)[cite: 405, 406].
3. [cite_start]**Bảo mật API & Kiểm tra đầu vào:** Xác thực mọi yêu cầu bằng token mã hóa và làm sạch dữ liệu đầu vào[cite: 407, 408, 409].