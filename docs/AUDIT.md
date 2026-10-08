# AUDIT — Highland English Horizon (Phase 1–2)

Ngày: 2026-10-08. Phương pháp: đọc code, chạy `tsc`/`eslint`/`next build`/`prisma validate`, truy vấn DB **chỉ đọc** (`scripts/audit-db.ts`, `scripts/measure-lessons.ts`), xem ảnh panel thật. **Chưa gọi API sinh ảnh/LLM lần nào (0 ảnh, $0).** Số đo lấy từ 11 bài COMIC đã có trong DB (đủ 3 cấp độ).

## 0. Tóm tắt trạng thái

| Hạng mục | Kết quả |
|---|---|
| `prisma validate` / `generate` | OK |
| `tsc --noEmit` | 0 lỗi |
| `next build` | OK (43 trang). Cảnh báo: `middleware.ts` ở Next 16 gọi là **Proxy**, vẫn chạy |
| `eslint` | 2 lỗi + 35 cảnh báo. Lỗi: `app/village/page.tsx:247` (setState trong effect); `components/ui/EthnicModal.tsx:227` (dùng `close` trước khi khai báo) |
| Tham chiếu Ê Đê/Gia Rai/Ba Na | **0** trong repo (grep) và 0 trong `User.ethnicGroup` |
| DB | Supabase pooler `aws-1-ap-southeast-2`, **đang chạy**. `EthnicGroup` đúng 6 slug: kho, ma, mnong, hmong, tay, nung |
| Dev/prod chung DB? | **Chưa xác minh được** (không đọc được env Vercel). `.env` local trỏ Supabase thật ⇒ coi mọi ghi là ghi production. Cần người dùng xác nhận |

## 1. Các mục [CẦN XÁC MINH] đã có câu trả lời

- Tên giáo viên trong DB là **"Cô Hằng"**; `seed.ts` ghi "Cô Hương" (do `upsert update:{}`). Lệch nhưng không lỗi.
- Nhân vật trong DB: **14** (HANDOFF nói 12). Thừa **`H' Mai`** (Mạ) và **`K'Thao`** (M'Nông) không có trong seed; 3 bài cũ dùng K'Thao. `A Linh` đúng `nung`. DB ghi `Đinh Thị Hoa` (không có "Bà") trong khi preset ghi "Bà Đinh Thị Hoa".
- Background: 14 key theo preset đều có và **có `imageUrl`**. Thừa key `"evening-mountain "` (có **dấu cách cuối**), không có trong seed.
- Mọi nhân vật đều có `characterImageUrl`. Có 3 bài SAMPLE ⇒ `village/progress` hiện không vỡ, nhưng vẫn phụ thuộc SAMPLE.
- `lib/ai.ts` **vẫn tự khai báo** `AI_BASE_URL/MODEL/KEY` riêng, không hợp nhất với `generate/route.ts`; không có fallback `AI_API_KEY || TOGETHER_API_KEY`.
- `POST /api/lessons/generate` chỉ cho `TEACHER`, ADMIN bị 403 (chưa rõ có chủ đích — cần hỏi khách).
- `.env` có đủ biến; storage dùng `NEXT_PUBLIC_SUPABASE_URL` (hoặc `SUPABASE_URL`) + `SUPABASE_SERVICE_ROLE_KEY`. Không có `.env.local`. `AI_BASE_URL/AI_MODEL` local đúng Together.

## 2. Số đo nội dung (11 bài COMIC: 3×L1, 3×L2, 5×L3 — 128 câu thoại, 104 vocab, 44 câu quiz)

| Chỉ số | Kết quả | Mục tiêu |
|---|---|---|
| Câu **vượt** giới hạn từ theo cấp | 11/128 = **8.6%** (L1: 11/24 ≈ 46% vượt 8 từ) | ≥95% đúng |
| Câu **dưới** mức tối thiểu của cấp | 63/128 = **49%** (L3: 49/60 ≈ 82% dưới 12 từ) | — |
| Vocab **không có** trong lời thoại | 55/104 = **52.9%** (L3: 41/58 ≈ 71%) | 0% |
| Dòng thoại có tên nhân vật lạ | 9/128 = **7%** ("Già làng", "Người dân địa phương"…) | 0 |
| Câu thoại chứa chữ CJK | **3 câu / 3 bài** ("Chúng ta几乎 đến đó", "穿", "忘记") | 0 |
| Quiz có `answer = 0` | 23/44 = **52%**; Village Map 6/6 đều `answer: 0` | phân bố đều |
| Số lượt thoại | đúng **2 câu/panel** (12 câu cho bài 6 panel) ⇒ rất mỏng | ≥3–4 |
| Câu < 4 từ (prompt cấm) | 5 | 0 |
| Panel không có ảnh | 0/64. Không có cờ `degraded` nên **không biết** panel nào đã rơi về text→image | — |
| Thời gian sinh ảnh | ~8–9 s/panel theo dấu thời gian file (6 panel ≈ 50 s) | — |
| Chi phí ước tính/bài 6 panel | 6 × $0.04 ≈ **$0.24** ảnh + LLM ≈ $0.01 | — |

Ghi chú: ngưỡng L3 "12–20 từ" theo `LEVEL_SPEC`; 82% câu L3 ngắn hơn 12 từ có thể do prompt/LLM không đếm được từ — nên chốt lại ngưỡng với khách.
Hạn chế: chưa chạy bài mới. Đo lại sau sửa sẽ chạy LLM-only (~$0.01/bài) trước, ảnh sau.

## 3. Phát hiện chi tiết (bằng chứng → nguyên nhân gốc → mức độ → công/chi phí)

### Ảnh

**A1. Nhân vật rơi mất / không nhất quán / sai văn hóa — P0, Cao.**
- Bằng chứng: bài "Ya Din Learns Traditional Weaving" (`lessons/cmse2xuv30001l4046u8sicis`), cả 6 panel có `characterIds = 2` (Ya Đin + H'Brih) nhưng panel 4 và 6 **chỉ thấy 1 cô bé**, mẹ H'Brih biến mất. Panel 1: hai người mặc trang phục giống **hanbok/hanfu**, nội thất kiểu Đông Á có **chữ Hán trên tranh tường**, không có khung cửi dù lời thoại nói "This is a loom". Trang phục K'Ho không được thể hiện.
- Nguyên nhân: (1) composite sharp dán nhân vật lên nền rồi FLUX Kontext với prompt "Transform into anime… enhance colors" **vẽ lại toàn bộ** (xóa/đổi nhân vật, mặc định sang phong cách Đông Á); (2) `costumePrompt` chỉ là "K'Ho traditional costume", không mô tả cụ thể nên model tự suy diễn; (3) ảnh nhân vật chưa được dùng làm tham chiếu thực sự; (4) không có bước kiểm tra "nhân vật còn trong ảnh không".
- Công: 2–4 ngày thử nghiệm + sửa. Chi phí thí nghiệm: ~10–15 ảnh ≈ $0.4–0.6.

**A2. Rơi im lặng về text→image — P0, Trung bình.** `generateComicPanel` catch → text→image → Pollinations, không đánh dấu `degraded`. Công: 0.5 ngày.

**A3. Ghép ảnh trông "dán" — P1.** Xóa nền bằng ngưỡng RGB>235 cứng, không feather/bóng/hòa màu; chiều cao nhân vật cố định 60%; vị trí cố định trái/phải bất kể `action`. Công: 1–2 ngày.

**A4. Sinh tuần tự trong 1 request, không `maxDuration`, không tiến trình — P1.** Lesson DRAFT tạo trước; nếu request chết giữa chừng sẽ để DRAFT mồ côi (hiện 0 DRAFT trong DB). Công: 1–2 ngày.

**A5. Đa dạng bối cảnh — Thấp.** Preset có 2–4 bối cảnh/bài; nhưng 4/5 bài L3 tự tạo chỉ có **1** bối cảnh.

### Nội dung

**N1. Từ vựng không nằm trong thoại (53%) — P0.** LLM viết vocab song song với thoại trong cùng 1 lần gọi, không có kiểm tra. Ví dụ L3: "wildlife conservation", "fire prevention", "cồng chiêng", "chieng". Sửa: trích vocab bằng code từ thoại + validator. Công: 1 ngày.

**N2. Vi phạm cấp độ (L1 46% vượt; L3 82% ngắn) — P0.** Không có validator/vòng sửa; LLM không đếm từ tin cậy. Công: 1–2 ngày (validator + repair loop ≤2 lần).

**N3. Chữ CJK lọt vào tiếng Việt (3/128 câu) — P0.** Prompt đã cấm nhưng vẫn lọt. Sửa: regex chặn + gọi sửa lại đúng câu đó. Gộp vào N2.

**N4. Nhân vật lạ (7%) — P0.** Prompt tự mâu thuẫn: vừa bắt chỉ dùng tên trong danh sách, vừa bảo dùng mô tả "nguoi ban/nguoi lang" cho nhân vật phụ ⇒ LLM viết "Già làng", "Người dân địa phương". Validator cần cho phép một tập nhân vật phụ định sẵn hoặc map về nhân vật hợp lệ.

**N5. Nội dung mỏng, nông — P0/P1.** 2 câu/panel; kiến thức chỉ dựa vài dòng `EthnicGroup` (mỗi mục 3 phần tử, không có nghĩa EN/ngữ cảnh). `FESTIVAL_8` đòi giải thích "cách làm món/luật chơi" nhưng dữ liệu không có ⇒ LLM bịa hoặc nói chung chung. Hướng: làm giàu dữ liệu văn hóa (gắn cờ chờ xác minh).

**N6. Quiz lộ đáp án — P1.** 52% quiz LLM và 100% quiz Village Map có đáp án đúng ở vị trí 0. Sửa: xáo trộn khi lưu/hiển thị. Công: 0.5 ngày.

**N7. Parse JSON không schema, không retry — P1.** `parseJson` chỉ cắt `{…}` + `JSON.parse`; `zod` đã có trong dependencies nhưng chưa dùng cho đầu ra LLM.

### Vận hành / bảo mật

**O1. Supabase free tự pause — P0.** Chưa có cron/health-check. Công: 0.5 ngày (route `/api/health` có `SELECT 1` + Vercel Cron hoặc GitHub Actions, chu kỳ ≤3 ngày). Người dùng phải tạo cron/secret phía Vercel/GitHub.

**O2. Lộ 8 ký tự đầu của API key trong phản hồi lỗi — P0 (bảo mật), sửa 5 phút.** `app/api/lessons/generate/route.ts:402` trả `KEY: ${process.env.AI_API_KEY?.slice(0, 8)}` về client khi LLM lỗi (dòng 396 còn biến `keyPrefix` thừa).

**O3. Cấu hình AI nhân đôi — P0.** `lib/ai.ts` và `generate/route.ts` mỗi nơi một bản; không fail-fast, không health-check cấu hình. Gom vào một module, fallback `AI_API_KEY || TOGETHER_API_KEY`, thêm endpoint admin kiểm tra (không lộ key). Công: 0.5 ngày.

**O4. Không có rate-limit/xác nhận chi phí — P1.** Một click = 4–8 ảnh Kontext; không giới hạn số lần/giờ.

**O5. Khóa API từng bị dán trong chat — nhắc xoay key.** `TOGETHER_API_KEY` và `AI_API_KEY` đều dài 52 ký tự (có thể là cùng một key). Cập nhật cả Vercel và `.env`, rồi Redeploy.

**O6. `middleware.ts` → Next 16 gọi là `proxy`** (deprecation, vẫn chạy). P2.

### Village Map

- **V1. Modal chỉ có chữ; `illustrationHint` chưa dùng — P1.** Phương án: crop bản đồ làm banner ($0), hoặc sinh 6 ảnh cover (~$0.11) hoặc 24 ảnh (~$0.43).
- **V2. Quiz 6/6 `answer: 0` — P1.** Như N6; nên thêm câu hỏi.
- **V3. Tiến độ phụ thuộc bài SAMPLE; `GET` luôn `xpEarned: 0` — P1.** Bảng riêng `VillageProgress` cần `db push` ⇒ chờ duyệt.
- **V4. Lint error `village/page.tsx:247`.**
- **V5. Nhân vật ngoài DB trong `villageMap.ts`** (Sùng Mỷ, Lâm Bảo, Bà Then Lan theo HANDOFF) — chưa rà từng dòng, mức Thấp.

### Văn hóa / dữ liệu (mọi chỉnh sửa phải ghi vào `docs/CULTURE_REVIEW.md` chờ khách xác minh)

- **C1. Tên nhân vật mang phong cách dân tộc khác — P1, cần khách duyệt.** `H'Linh`/`Y Blô` (H'Mông), `Kpă Điêu` (Tày) dùng tiền tố kiểu Ê Đê/Gia Rai. Không đổi hàng loạt khi chưa duyệt (preset, kịch bản, video đang dùng tên hiện tại).
- **C2. Địa danh miền Bắc kèm "Đắk Nông"** cho H'Mông/Tày/Nùng (`culture.ts`: Hà Giang, Đồng Văn, Cao Bằng, Bắc Kạn, Lạng Sơn). Cần diễn đạt lại không bịa di cư.
- **C3. Không nhất quán ngôn ngữ:** `architecture` toàn tiếng Anh; Mạ có `"Traditional Buffalo Offering Ceremony"`.
- **C4. Cách viết tên không đồng nhất:** nhóm `ma` nameEn = "Ma'", `mnong` = "Mnong" trong khi nhân vật/preset dùng "M'Nong".
- **C5. Seed `update:{}`:** sửa `culture.ts` không tự cập nhật DB; cần script cập nhật có kiểm soát.
- **C6. `WORD_DICT` khớp chuỗi cứng:** đã ghi trong HANDOFF, chưa đọc `EthnicModal.tsx` kỹ.

## 4. Việc đã làm / chưa làm trong phiên này

- Đã tạo: `docs/AUDIT.md`, `scripts/audit-db.ts`, `scripts/measure-lessons.ts` (đều chỉ đọc). **Không sửa code ứng dụng, không ghi DB, không gọi API tính phí, không commit.**
- Cần người dùng: xác nhận dev/prod chung DB; xoay key; duyệt kế hoạch Phase 3.
