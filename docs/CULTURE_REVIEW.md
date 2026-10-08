# CULTURE_REVIEW — Nội dung cần khách xác minh

Mọi nội dung văn hóa mới hoặc nghi vấn đều gom ở đây. Chưa được khách duyệt thì **không** coi là đã xác minh.

## 1. Kiến thức bổ sung đưa vào prompt AI (`data/cultureFacts.ts`)
Mỗi dân tộc có 5 mục, viết ngắn và trung tính. Trạng thái: **CHỜ XÁC MINH**. Cần giáo viên/người địa phương kiểm tra từng mục:

| Dân tộc | Mục | Cần kiểm tra |
|---|---|---|
| K'Ho | dệt thổ cẩm trên khung dệt, hoa văn hình học; cồng chiêng ở lễ hội (UNESCO); gùi tre mây; cơm lam; rượu cần uống chung | Cách gọi "rượu cần" trong lời thoại cho trẻ em (đã dịch "jar drink") |
| Mạ | sống gần rừng; già làng kể chuyện; trang phục chàm; đan lát; lễ cúng bến nước | "Lễ cúng bến nước" có đúng tên/ý nghĩa với người Mạ không |
| M'Nông | gắn bó với voi; sử thi Ot Ndrong; mẫu hệ; Công viên địa chất UNESCO Đắk Nông; thủ công | Mẫu hệ và vai trò voi ở Đắk Nông (không chỉ Buôn Đôn/Đắk Lắk) |
| H'Mông | khèn; thêu; vẽ sáp ong + nhuộm chàm; vải lanh; mèn mén | Phù hợp với cộng đồng H'Mông ở Đắk Nông (không chỉ miền Bắc) |
| Tày | nhà sàn (củi/gia súc dưới sàn); Then + đàn tính (UNESCO 2019); Lồng Tồng mùa xuân; áo chàm; xôi ngũ sắc | Cộng đồng Tày ở Đắk Nông có giữ lễ Lồng Tồng không |
| Nùng | Then + đàn tính; nhuộm chàm; bánh khảo; lúa nước/ruộng bậc thang; giấy bản | "Ruộng bậc thang" của người Nùng; giấy bản có còn phổ biến |

## 2. Vấn đề dữ liệu có sẵn (chưa sửa — chờ duyệt)
- `data/culture.ts`: H'Mông/Tày/Nùng ghi địa danh miền Bắc kèm "Đắk Nông" (Hà Giang, Đồng Văn, Cao Bằng, Bắc Kạn, Lạng Sơn). Cần diễn đạt thành "cộng đồng sinh sống tại Đắk Nông" mà không bịa số liệu/di cư.
- `architecture` toàn tiếng Anh; Mạ có nhãn trung tính "Traditional Buffalo Offering Ceremony".
- Tên tiếng Anh nhóm: `ma` = "Ma'", `mnong` = "Mnong" (nhân vật dùng "M'Nong").
- Tên nhân vật theo phong cách dân tộc khác: H'Linh/Y Blô (H'Mông), Kpă Điêu (Tày) — đề xuất bộ tên khác nhưng **chỉ khi khách đồng ý** vì preset/video đang dùng.
- Nhân vật phụ trong `data/villageMap.ts`: Sùng Mỷ, Lâm Bảo, Bà Then Lan chưa có trong DB.
- Village Map: các câu về voi/cồng chiêng của M'Nông ở Đắk Nông; quan hệ "ông cháu"/tên Ama K'Bram.
- Quiz bổ sung Village Map (`data/villageQuiz.ts`) chỉ hỏi về chi tiết có trong lời kể, không thêm khẳng định văn hóa mới.

## 3. Tài sản hình ảnh sai văn hóa / lỗi (xem `scripts/regen-assets.ts`)
- Nền `festival_ground`, `drum`, `costume` có chùa/đèn lồng/chữ Hán kiểu Trung Hoa; `dance`, `birds`, `butterfly`, `bargain`, `cloth_stall` có người trong nền.
- Nhân vật Ya Đin, Y Điớp, A Linh, Kpă Điêu có watermark/chữ lạ; "Ama K'Bram" (nam, già làng) được vẽ thành bà cụ; `H' Mai` = `Pơ Mai` và `K'Thao` = `N'Thao` (ảnh trùng, bản ghi thừa trong DB).
