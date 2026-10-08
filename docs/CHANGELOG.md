# CHANGELOG

## 2026-10 — Nâng chất lượng truyện + ảnh (Phase 4)

### Nội dung (truyện)
- `lib/lessonScript.ts` (mới): sinh bài nhiều bước — (1) lời thoại, (2) validator + vòng tự sửa tối đa 2 lần (độ dài câu theo cấp, chữ CJK, người nói ngoài danh sách, câu trùng, kiểu hỏi-đáp từ vựng, xưng hô/giới tính), (3) vocab/quiz/mission bám lời thoại đã chốt. Vocab không nằm trong thoại bị loại bằng code; quiz/mission được xáo đáp án; panel thiếu thì tự viết tiếp/ mở rộng; tên riêng giữ đúng dấu; "action" luôn tiếng Anh.
- `data/cultureFacts.ts` (mới): kiến thức bổ sung (chờ khách xác minh — xem `CULTURE_REVIEW.md`).
- Đo trên 4 lần chạy thử (L1/L2/L3): 100% câu đúng giới hạn từ, 100% vocab nằm trong thoại, 0 cảnh báo, 3–4 lượt thoại/panel (trước: 2).

### Ảnh
- `lib/imageGen.ts`: tách nền nhân vật bằng flood-fill (không xóa nhầm áo sáng, bỏ watermark nhỏ, làm mềm mép), tỉ lệ theo vai trò (trẻ < người lớn), bóng đổ, hòa màu, mỗi panel một góc máy. Kontext chỉ dùng để hòa ánh sáng với lệnh bảo toàn nhân vật; kiểm tra nhân vật còn nguyên (so sánh vùng), thử lại 1 lần, rồi dùng ảnh ghép. **Không còn rơi im lặng về text→image**: panel có cờ `degraded` + `imageNote`, hiển thị cảnh báo ở trang sửa bài.
- Phát hiện: tài khoản Together **chưa bật "third-party data sharing"** nên mọi model FLUX trả 403 — phải bật trong Together settings thì mới vẽ được ảnh AI.
- Sửa lỗi: vẽ lại panel từ trang sửa bài trước đây gửi *id* nhưng API tìm theo *tên* ⇒ mất nhân vật; nay API nhận cả hai.
- `scripts/regen-assets.ts`: kế hoạch vẽ lại 8 nền + 5 nhân vật lỗi (mặc định chỉ in kế hoạch).

### Vận hành / bảo mật
- Xóa việc lộ 8 ký tự đầu của API key trong phản hồi lỗi.
- `lib/aiConfig.ts`: cấu hình AI một nơi (fallback `AI_API_KEY || TOGETHER_API_KEY`), báo lỗi rõ khi base URL/model lệch nhau; `lib/ai.ts` dùng chung.
- `/api/health` (SELECT 1) + `vercel.json` cron hằng ngày để Supabase free không bị pause; `/api/admin/ai-status` cho ADMIN xem cấu hình (không lộ key).
- Route sinh bài: `maxDuration = 300`, giới hạn `AI_MAX_LESSONS_PER_HOUR` (mặc định 8) mỗi giáo viên, ảnh song song 2 luồng, xóa DRAFT mồ côi khi lỗi, tham số `dryRun` (chỉ sinh kịch bản, không ghi DB/không vẽ ảnh).

### Village Map
- Mỗi điểm 3 câu quiz, đáp án luôn được xáo; fun fact hiện sau câu cuối; XP lấy từ server; ghi tiến độ không còn bắt buộc có bài SAMPLE; báo lỗi đúng khi lưu thất bại; `GET` trả XP thật.
- Lỗi lint (`village/page.tsx`, `EthnicModal.tsx`) đã sửa; thư mục `scripts/` bỏ khỏi lint.

## 2026-10 — Vẽ ảnh thật & bộ truyện mẫu (Phase 5)
- Together đã bật passthrough; FLUX hoạt động (hiệu lực sau vài phút, code tự thử lại).
- Vẽ lại 8 nền (festival_ground, drum, costume, dance, birds, butterfly, bargain, cloth_stall): hết chùa/đèn lồng Trung Hoa, hết người trong nền. Đã áp dụng vào DB (URL cũ lưu ở `scripts/out/`, thư mục không commit).
- Nhân vật: Ama K'Bram đổi thành nam (Kontext chỉnh từ ảnh cũ); Ya Đin, Y Điớp, A Linh, Kpă Điêu gỡ watermark bằng Kontext (giữ nguyên trang phục). Vẽ lại bằng text thuần cho kết quả sai văn hóa (hanfu/chibi) nên KHÔNG dùng.
- Ngưỡng kiểm tra nhân vật `CHARACTER_DIFF_THRESHOLD` nâng 34 → 45 sau khi xem ảnh: các panel có độ lệch 35–41 vẫn giữ đúng nhân vật; chỉ các ca >45 mới thực sự bị vẽ lại.
- Bộ truyện mẫu `source=SAMPLE`: 5/6 bài PUBLISHED (K'Ho, Mạ, M'Nông, H'Mông, Nùng) với 100% panel do Kontext vẽ và nhân vật nhận diện được; bài Tày còn DRAFT (1 panel dùng ảnh ghép).
- Công cụ: `scripts/build-sample-stories.ts`, `rerender-drafts.ts`, `edit-character.ts`, `apply-assets.ts`, `lesson-sheet.ts`.
- Còn lại: nền `costume` vẫn có tranh chữ treo tường (cần vẽ lại, hết số dư Together lúc đó — 402); thi thoảng Kontext thêm một nhân vật thừa (đã thấy 1 lần ở bài H'Mông panel 3).
