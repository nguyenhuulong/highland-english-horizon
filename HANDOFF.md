# HIGHLAND ENGLISH HORIZON — HANDOFF CHO CLAUDE CODE

> Đặt file này ở thư mục gốc repo (cạnh `package.json`) và đọc **toàn bộ** trước khi chạm vào code.
> Tài liệu viết bằng tiếng Việt vì chủ dự án và người dùng cuối là người Việt; mọi định danh kỹ thuật giữ nguyên tiếng Anh.
> Những chỗ ghi **[CẦN XÁC MINH]** là điều người viết không chắc còn đúng ở thời điểm hiện tại. Hãy kiểm tra trong repo/DB thật trước khi tin.

---

## 1. BỐI CẢNH & Ý TƯỞNG BAN ĐẦU

**Sản phẩm:** Highland English Horizon — web học tiếng Anh song ngữ Anh–Việt bằng truyện tranh tương tác, nội dung gắn với văn hóa dân tộc thiểu số, dành cho học sinh 9–13 tuổi ở vùng Tây Nguyên, cụ thể **Đắk Nông**.

**Ai là khách và ai dùng:**
- Khách: một cô giáo điều phối nhóm **giáo viên và học sinh cấp 2–3 tại Đắk Nông** đang dự một **cuộc thi sản phẩm sáng tạo**. Chính học sinh sẽ đứng ra giới thiệu sản phẩm, quay video demo và nộp báo cáo (viết giọng học sinh) cho Ban tổ chức.
- Người dùng cuối: học sinh dân tộc thiểu số (đọc truyện, chơi game, khám phá bản đồ làng), giáo viên vùng sâu vùng xa (tạo bài học bằng AI, không cần kỹ năng vẽ/soạn giáo án chuyên sâu).
- Người nhờ bạn: lập trình viên nhận làm sản phẩm cho khách. Người này dùng **Windows + PowerShell**, không chạy được `prisma migrate`, và đang vội bàn giao lại sản phẩm.

**Giá trị cốt lõi (khách đã chốt, đừng làm lệch):**
1. Công cụ dạy tiếng Anh cho trẻ dân tộc bằng cách đưa yếu tố văn hóa bản địa vào.
2. Giáo viên quản lý nhân vật, bối cảnh và tạo truyện bằng sức mạnh AI với prompt đầu vào đơn giản.
3. Phụ huynh **không** có vai trò riêng: dùng chế độ Khách hoặc dùng tài khoản của con.

**Lịch sử ngắn:** MVP phía client (localStorage) → bản đầy đủ có DB/auth/RBAC/gamification → module truyện tranh AI có ảnh thật (FLUX qua Together.ai) → thêm Culture Hub (modal dân tộc ở trang chủ) → thêm "Learn English Through My Village" (bản đồ làng 6 điểm) → viết lại pipeline ghép ảnh nhân vật lên nền. Đã bàn giao cho khách đầu tháng 8/2026. Tháng 10/2026 Supabase free tự pause, khách liên hệ lại; trước khi bàn giao lần nữa, người dùng muốn **nâng chất lượng hình ảnh truyện và hàm lượng kiến thức**.

---

## 2. QUYẾT ĐỊNH KIẾN TRÚC & NGHIỆP VỤ ĐÃ CHỐT (KHÔNG TỰ Ý ĐẢO NGƯỢC)

1. **`Lesson` là entity duy nhất** (không có `ComicStory`). Lesson có `source`: `MANUAL | AI | SAMPLE | COMIC`.
2. **3 vai trò đăng nhập + Khách:** `STUDENT`, `TEACHER`, `ADMIN`. **Chỉ STUDENT** lưu XP/huy hiệu/tiến độ/xếp hạng. Teacher/Admin đọc/chơi để kiểm tra nội dung, không ảnh hưởng bảng xếp hạng.
3. **Sáu dân tộc hiển thị trong hệ thống là: K'Ho, Mạ, M'Nông, H'Mông, Tày, Nùng** (slug: `kho`, `ma`, `mnong`, `hmong`, `tay`, `nung`). Đây là yêu cầu của khách theo đặc điểm địa phương Đắk Nông.
   - Đã từng có phiên bản dùng Ê Đê/Gia Rai/Ba Na (slug `ede`, `giarai`, `bana`) — **đã bị loại bỏ**. Một bản rà soát văn hóa bên ngoài từng gợi ý quay lại nhóm Tây Nguyên "thuần"; **khách đã quyết định giữ 6 nhóm trên**. Không đưa Ê Đê/Gia Rai/Ba Na trở lại ở bất kỳ đâu (UI, seed, prompt, preset, wordmap, tài liệu).
   - Hãy `grep -rniE "Ê Đê|Gia Rai|Ba Na|\bede\b|giarai|bana"` toàn repo ở Phase 1 để xác nhận không còn sót.
4. **`EthnicGroup` KHÔNG có FK từ `Lesson`, `ComicBackground`, `User`.** Chỉ `ComicCharacter.ethnicGroupId` là FK duy nhất. Bảng `EthnicGroup` chỉ phục vụ: (a) hiển thị Culture Hub ở trang chủ, (b) làm "nguồn sự thật" văn hóa cho prompt AI khi sinh truyện.
5. **Không dùng `prisma migrate`.** Quy trình DB: sửa `schema.prisma` → `npx prisma validate` → `npx prisma generate` → `npx prisma db push` → `npx prisma db seed`.
6. **Seed dùng `upsert` với `update: {}` ở nhiều chỗ** ⇒ seed lại **không** cập nhật dữ liệu đã tồn tại. Muốn đổi dữ liệu seed phải `UPDATE`/xóa bản ghi cũ rồi seed lại (đã từng vấp ở tên giáo viên "Cô Hằng").
7. **Tiến độ Village Map lưu bằng "mẹo" `MissionAttempt`** với `missionId = "village_<pointId>"` (không có bảng riêng). Xem mục 9 để biết nhược điểm.
8. **Nội dung AI đọc văn hóa từ DB lúc chạy**, không đọc `data/culture.ts` ở runtime. `data/culture.ts` chỉ dùng để seed và hiển thị trang chủ.
9. **Prompt gửi LLM viết bằng ASCII không dấu** (có chủ đích) để tránh lỗi encoding làm LLM bỏ qua phần sau ký tự lỗi. Đừng "sửa đẹp" lại thành có dấu mà chưa kiểm chứng.

---

## 3. TECH STACK & HẠ TẦNG

| Lớp | Công nghệ |
|---|---|
| Framework | Next.js (App Router), TypeScript, React |
| Style | Tailwind v4 + rất nhiều inline style; CSS variables (`--primary`, `--surface`, `--bg-card`, `--border`, `--text-muted`, `--font-display` = Baloo 2, `--font-body` = Nunito) |
| DB | PostgreSQL trên **Supabase** (free plan — **tự pause nếu không có truy cập ~1 tuần**), Prisma `6.19.3` |
| Auth | NextAuth v5 (Auth.js), JWT, `trustHost: true`, `pages.signIn = "/login"` |
| Storage ảnh | Supabase Storage (qua `lib/storage.ts`) |
| LLM | Together.ai, OpenAI-compatible `/v1/chat/completions`, model `meta-llama/Llama-3.3-70B-Instruct-Turbo` (~$1.04/1M token — chi phí LLM nhỏ so với ảnh) |
| Ảnh | Together.ai: `black-forest-labs/FLUX.1.1-pro` (text→image, ~$0.018/ảnh), `black-forest-labs/FLUX.1-kontext-pro` (image→image, ~$0.04/ảnh) |
| Xử lý ảnh server | `sharp` (native module; cần `serverExternalPackages: ["sharp"]` trong `next.config.ts`) |
| Deploy | Vercel, auto-deploy khi push nhánh `main`; Node 24; free plan (xem log hạn chế) |
| Dev machine | Windows + PowerShell |

**Biến môi trường (chỉ tên, KHÔNG ghi giá trị vào bất kỳ file nào được commit):**
`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXTAUTH_URL` (dev), `AI_BASE_URL` (=`https://api.together.xyz/v1`), `AI_MODEL` (=`meta-llama/Llama-3.3-70B-Instruct-Turbo`), `AI_API_KEY`, `TOGETHER_API_KEY`, và các biến Supabase Storage **[CẦN XÁC MINH tên chính xác trong `lib/storage.ts`]**.

**Bài học đã trả giá khi deploy (đừng lặp lại):**
- Sửa env trên Vercel **chỉ có hiệu lực sau Redeploy** (khuyến nghị "Redeploy without cache").
- Sự cố từng gặp: `AI_BASE_URL`/`AI_MODEL`/`AI_API_KEY` trên Vercel vẫn là giá trị Groq cũ ⇒ 401 rồi 404 ("Unable to access model llama-3.3-70b-versatile"). Dev chạy được còn prod lỗi vì env hai nơi khác nhau. Gợi ý: code nên **fail-fast có thông báo rõ** khi phát hiện base URL/model không khớp provider, và có một endpoint/health-check cho admin để xem cấu hình AI đang dùng (không lộ key).
- `generate/route.ts` và `lib/ai.ts` từng cùng khai báo `AI_BASE_URL/AI_MODEL/AI_API_KEY` với default Groq — **[CẦN XÁC MINH]** đã hợp nhất chưa; nên gom về một module cấu hình duy nhất, có fallback `AI_API_KEY || TOGETHER_API_KEY`.
- Từng có `console.log(res.json())` đặt trước `res.ok` làm "body unusable" (đọc body hai lần). Chỉ đọc body một lần.
- Prisma CLI bản này **không có `--sql`**. Dùng `npx prisma db execute --file x.sql --schema=prisma/schema.prisma`. Trên PowerShell, SQL inline có dấu `"` rất dễ hỏng ⇒ luôn tạo file `.sql` rồi chạy `--file`.
- Supabase free sẽ pause lại. **Cần cơ chế giữ sống** (ví dụ Vercel Cron hoặc GitHub Actions gọi một route nhẹ có chạm DB mỗi vài ngày). Đây là việc ưu tiên cao vì nó vừa làm sản phẩm "chết" ngay trước ngày thi.
- Một Together API key đã từng bị dán nguyên văn trong cuộc trò chuyện với người dùng. **Nhắc người dùng xoay (rotate) key** và cập nhật lại trên Vercel + `.env.local`.

---

## 4. CẤU TRÚC REPO (các file quan trọng)

```
app/
  page.tsx                          Trang chủ + Culture Hub (6 dân tộc, mở EthnicModal)
  library/page.tsx                  Thư viện bài (Khách chỉ thấy source SAMPLE|MANUAL)
  reader/page.tsx                   Đọc truyện song ngữ + TTS + quiz
  games/ ...                        5 trò chơi: Lật thẻ, Ghép đôi, Đố vui, Điền từ, Luyện nói
  progress/page.tsx                 XP, huy hiệu, bảng xếp hạng (STUDENT)
  village/page.tsx                  "Làng của tôi": bản đồ 6 điểm + modal truyện/từ vựng/quiz
  dashboard/
    layout.tsx                      Sidebar theo role
    student|teacher|admin/...       Các bảng điều khiển
    teacher/stories/page.tsx        Danh sách / tạo / sửa bài (sửa lời thoại, từ vựng, sinh lại ảnh từng panel)
    teacher/characters|backgrounds  Quản lý nhân vật / bối cảnh
    admin/culture|students|users... Dữ liệu văn hóa, theo dõi học sinh
  api/
    lessons/route.ts, [id]/route.ts
    lessons/generate/route.ts       ★ Pipeline sinh bài bằng AI (LLM + ảnh từng panel)
    comic/characters|backgrounds|generate-image ...
    village/progress/route.ts       GET/POST tiến độ bản đồ làng
components/
  comic/StoryCreator.tsx            Form 4 bước + DEMO_PRESETS (6 preset, mỗi dân tộc 1)
  comic/CharacterManager.tsx, BackgroundManager.tsx
  ui/EthnicModal.tsx                Modal dân tộc + WORD_DICT + WordChip/RichText (click từ → nghĩa EN + TTS)
  ui/Feedback.tsx                   showToast, spawnConfetti
  layout/Navbar.tsx
lib/
  imageGen.ts                       ★ togetherGenerate (retry 503/429), buildCompositeReference (sharp), generateComicPanel, generateCharacterSheet, generateBackgroundImage
  storage.ts                        uploadToSupabase, uploadFromUrl, makeFileName
  ai.ts, gamification.ts (addXP, evaluateBadges), rbac.ts, hooks.ts (useSettings, useTTS), prisma.ts
data/
  culture.ts                        Dữ liệu 6 dân tộc (nguồn để seed + trang chủ)
  villageMap.ts                     6 điểm bản đồ làng: tọa độ %, truyện kể 4 panel, vocab, quiz, funFact
prisma/schema.prisma, seed.ts
middleware.ts                       Chặn route theo role (dùng getToken — chạy được trên Vercel)
auth.ts
public/images/village-map.jpg       Ảnh nền bản đồ 16:9 (đã có)
```

Quyền theo role (middleware): TEACHER được vào `/dashboard/teacher`, `/creator`, `/dashboard/admin/students`; ADMIN vào `/dashboard/admin`; `/village`, `/library`, `/games` là công khai. `POST /api/lessons/generate` chỉ cho role `TEACHER` (ADMIN bị 403 — **[CẦN XÁC MINH]** có chủ đích không).

---

## 5. MÔ HÌNH DỮ LIỆU (tóm tắt Prisma)

- `User(id, name, email@unique, password, role, ethnicGroup String?, ageGroup, avatar, xp, streak, lastActiveAt)` — `ethnicGroup` là **text thường**, không phải FK.
- `EthnicGroup(slug@unique, nameVi, nameEn, emoji, description, costume Json, festivals Json, instruments Json, crafts Json, cuisine Json, locations Json, architecture)` — quan hệ duy nhất: `comicCharacters`.
- `Lesson(titleVi, titleEn, topic, level 1-3, ageGroup, color, emoji, descriptionVi, vocabulary Json, panels Json, quiz Json, missions Json, status DRAFT|PUBLISHED, source, authorId, characterIds Json, backgroundIds Json, templateKey)`.
- `ComicCharacter(name, nameEn, role child|adult|elder, gender, ethnicGroupId?, descriptionVi/En, costumePrompt, appearancePrompt, referenceImageUrl?, characterImageUrl?, thumbnailEmoji, isActive, createdById)`.
- `ComicBackground(key@unique, nameVi, nameEn, category village|forest|market|festival|house|school, prompt, referenceImageUrl?, imageUrl?, thumbnailEmoji, isActive, createdById)`.
- `LessonProgress`, `PronunciationAttempt`, `MissionAttempt(userId, lessonId, missionId, correct)`, `Badge`, `UserBadge`, `AITemplate`, `AIGenerationLog`.

Cấu trúc JSON panel (Lesson.panels): `{ id, bg, scene, generatedImageUrl?, dialogue:[{character, vi, en}], characterIds[], backgroundId, action }`.

---

## 6. CHỨC NĂNG & TRẠNG THÁI HIỆN TẠI

| Chức năng | Trạng thái | Ghi chú |
|---|---|---|
| Trang chủ + Culture Hub (6 dân tộc, modal, từ vựng click-to-listen) | Xong | WORD_DICT hardcode theo chuỗi tiếng Việt khớp tuyệt đối với `culture.ts` ⇒ giòn |
| Thư viện + Reader song ngữ + TTS + quiz | Xong | Khách chỉ thấy bài SAMPLE/MANUAL |
| 5 trò chơi | Xong | "Luyện nói" dùng nhận diện giọng nói của trình duyệt, cần thử thêm |
| Gamification (XP, huy hiệu, xếp hạng) | Xong | |
| RBAC + demo login | Xong | Có 3 nút đăng nhập nhanh Học sinh/Giáo viên/Quản trị (tiện demo; có thể ẩn) |
| Quản lý nhân vật/bối cảnh + sinh ảnh AI | Xong | Nhân vật: ảnh dọc 512×768 nền trắng; bối cảnh: 896×512 |
| Tạo bài bằng AI (4 mẫu: INTRO_4, DIALOGUE_6, ADVENTURE_6, FESTIVAL_8; 3 cấp độ) | Chạy được nhưng **chất lượng chưa đạt** | Xem mục 8 |
| Sửa bài đã sinh (lời thoại, từ vựng, sinh lại ảnh từng panel + ghi chú) | Xong | |
| DEMO_PRESETS (6 preset + `panelBackgrounds`) | Xong | Cần kiểm tra các `backgroundKeys` có tồn tại trong DB **[CẦN XÁC MINH]** |
| Village Map (bản đồ làng) | Chạy được, nội dung/hình mới ở mức "vừa đủ demo" | Xem mục 9 |
| Adventure Map | **Chưa làm** (khách từng đề xuất, đã hoãn) | |
| Mobile/offline | Chỉ cơ bản | |

**Tài khoản demo:** xem `prisma/seed.ts` (giáo viên: `teacher@highlandenglish.vn`, tên "Cô Hằng"). Không in mật khẩu ra log/commit.

---

## 7. NHÂN VẬT & BỐI CẢNH SEED (12 nhân vật)

| Nhân vật | Dân tộc | Vai trò |
|---|---|---|
| Ya Đin | K'Ho | trẻ, nữ 10t |
| H'Brih | K'Ho | người lớn, nữ 28t |
| Pơ Mai | Mạ | trẻ, nữ 9t |
| Ama K'Bram | Mạ | già làng, nam 68t |
| N'Thao | M'Nông | trẻ, nam 10t |
| Y Điớp | M'Nông | người lớn, nữ 27t |
| H'Linh | H'Mông | trẻ, nữ 9t |
| Y Blô | H'Mông | người lớn, nam 31t |
| Lường Khánh | Tày | trẻ, nữ 10t |
| Kpă Điêu | Tày | người lớn, nam 33t |
| A Linh | Nùng | trẻ, nam 11t |
| Bà Đinh Thị Hoa | Nùng | người cao tuổi, nữ 65t |

**Vấn đề cần soát (văn hóa & nhất quán):**
- Nhiều tên mang **phong cách đặt tên của dân tộc khác**: tiền tố `H'`/`Y`/`Kpă`/`Ama` quen thuộc ở Ê Đê/Gia Rai/M'Nông; chúng đang gắn cho H'Mông/Tày/Nùng. Tên Tày/Nùng/H'Mông thường theo họ + tên đệm (Nông Văn…, Lường…, Sùng/Giàng/Vàng…). Cần đề xuất bộ tên phù hợp và **để khách xác nhận** (không tự đổi hàng loạt khi chưa được duyệt, vì preset/kịch bản/video đã dùng tên hiện tại).
- `data/villageMap.ts` nhắc các nhân vật **không có trong DB**: "Sùng Mỷ", "Lâm Bảo", "Bà Then Lan". Truyện làng dùng ngôi thứ ba nên không crash, nhưng nên thống nhất với bộ nhân vật.
- Seed từng có lỗi gán nhầm `ethnicGroupId` (đã sửa A Linh → nung). Hãy kiểm tra lại dữ liệu **thực tế trong DB** (có thể DB còn bản ghi cũ do `upsert update:{}`).
- Backgrounds dùng trong preset: `costume`, `morning_village`, `forest_entrance`, `big_tree`, `birds`, `market_morning`, `cloth_stall`, `vegetable_stall`, `bargain`, `festival_ground`, `dance`, `harvest`. **[CẦN XÁC MINH]** tất cả key này có trong seed/DB và có `imageUrl`.

---

## 8. PIPELINE SINH BÀI HỌC (phần quan trọng nhất cần cải thiện)

### 8.1 Luồng hiện tại (`app/api/lessons/generate/route.ts`)
1. Nhận `{topic, templateKey, ethnicGroupId, characterIds, backgroundIds, titleVi?, level, panelBackgroundKeys?}`.
2. Đọc DB: nhân vật, bối cảnh (theo id + theo key cho preset), `EthnicGroup`.
3. Dựng `cultureBlock` từ `EthnicGroup` + `LEVEL_SPEC` (3 cấp) + `TEMPLATES` (hướng dẫn từng panel).
4. Gọi LLM **một lần** lấy JSON (`titleVi/En, descriptionVi, vocabulary, quiz, missions, panels[]`). `max_tokens: 9000`, `temperature: 0.72`. Parse bằng cắt `{...}` rồi `JSON.parse` (không schema validation, không retry sửa lỗi).
5. Tạo `Lesson` DRAFT, rồi **tuần tự** từng panel: chọn background (ưu tiên `panelBackgroundKeys[i]` → `backgroundIndex` của LLM → xoay vòng), gọi `generateComicPanel`, upload kết quả lên Supabase.
6. Cập nhật Lesson `PUBLISHED`, ghi `AIGenerationLog`.

### 8.2 Pipeline ảnh panel (`lib/imageGen.ts → generateComicPanel`)
1. Tải ảnh nền (`imageUrl`) + ảnh nhân vật (`characterImageUrl`, tối đa 3).
2. `sharp`: resize nền về 896×512; mỗi nhân vật cao ~62% khung, **xóa nền trắng bằng ngưỡng RGB > 235 → alpha 0**, đặt sát đáy ở trái/phải (1 nv: x=20%; 2 nv: 8% và 56%).
3. Upload ảnh ghép lên Supabase → URL.
4. FLUX Kontext image→image (28 steps) với `stylePrompt` ("Transform into anime style… keep characters in exact positions…") + `zoomHint` chọn theo `seed % 6`.
5. Fallback: text→image FLUX.1.1-pro (20 steps) → Pollinations. `togetherGenerate` retry 503/429 tối đa 3 lần (3s/6s/12s).
6. Không gửi `negative_prompt` (FLUX bỏ qua).

### 8.3 Triệu chứng chất lượng đã quan sát (kèm bằng chứng từ các phiên trước)
**Hình ảnh**
- **Nhân vật không nhất quán giữa các panel** (mặt, quần áo đổi). FLUX không có "trí nhớ nhân vật"; reference chỉ ảnh hưởng gián tiếp.
- Khi Kontext lỗi (503) hoặc thiếu ảnh nhân vật/nền, **rơi về text→image** ⇒ mất hoàn toàn nhân vật đã chọn; panel 1, 5, 6 từng trông như "một phim khác".
- Ảnh ghép sharp **trông như dán**: viền trắng/halo, ngưỡng 235 có thể xóa nhầm trang phục sáng màu, không có bóng/tỉ lệ/hòa màu; Kontext vẫn có thể vẽ lại mặt và trang phục.
- Nhiều panel dùng chung 1 nền → nhàm; đã vá một phần bằng `panelBackgrounds` trong preset và `zoomHint`, **chưa đánh giá lại có hệ thống**.
- Panel sinh **tuần tự** ⇒ 6–8 ảnh mất vài phút; khó theo dõi tiến trình; rủi ro timeout/sập giữa chừng để lại Lesson DRAFT mồ côi.
- Chi phí: Kontext ~$0.04/ảnh ⇒ 6 panel ≈ $0.24+/bài, chưa kể sinh lại.

**Nội dung/kiến thức**
- **Vi phạm cấp độ**: truyện chọn Starter (4–8 từ/câu) nhưng câu 10–14 từ, có mệnh đề phụ.
- **Từ vựng không nằm trong lời thoại** (ví dụ `matrilineal`, tên dân tộc bị đưa vào vocab).
- **LLM bịa nhân vật** ngoài danh sách (ví dụ "Mr. K'Ho").
- **Dịch Việt máy móc/sai xưng hô**; **phiên âm tên riêng** ("Ba Dinh Thi Hoa" thay vì "Bà Đinh Thị Hoa"); rò rỉ từ trong `topic` vào lời thoại ("hươu nai").
- Kiến thức văn hóa **nông, chung chung**; chỉ dựa vào vài dòng `EthnicGroup` ⇒ truyện dễ lặp ý, ít chi tiết thật. Chưa có kiểm duyệt chuyên gia.
- Chưa có **bước kiểm tra tự động** sau khi sinh (độ dài câu theo cấp, vocab ⊂ dialogue, tên nhân vật hợp lệ, không có ký tự CJK, JSON đúng schema, quiz có đáp án đúng/nhiễu hợp lý, không lặp câu).
- Đã vá bằng prompt (ASCII, `charNames`, rule vocabulary, tên riêng giữ nguyên), nhưng **chưa có số liệu đo** trước/sau.

### 8.4 Hướng cải thiện đáng cân nhắc (agent tự đánh giá, đề xuất, rồi chờ duyệt)
**Ảnh**
- Dùng Kontext theo đúng thế mạnh: **chỉnh sửa theo chỉ dẫn với tham chiếu nhân vật**, ví dụ sinh panel đầu rồi dùng panel đó/ảnh nhân vật làm tham chiếu cho panel sau; hoặc truyền ảnh nhân vật thật vào thay vì chỉ ghép tay. Kiểm chứng bằng thí nghiệm nhỏ trước khi áp dụng.
- Cải thiện ghép ảnh: tách nền đúng nghĩa (mask + feather thay vì ngưỡng cứng; hoặc sinh nhân vật nền trong suốt/nền đồng màu dễ tách), thêm bóng đổ, hòa màu/độ sáng với nền, đặt nhân vật theo vị trí/tỉ lệ hợp lý theo `action`.
- **Đừng để rơi im lặng về text→image** khi mất nhân vật: ưu tiên retry/giảm bậc có kiểm soát, ghi cờ `degraded` vào panel và hiển thị cho giáo viên ("ảnh này chưa dùng nhân vật, nhấn Vẽ lại").
- Song song hóa có giới hạn (concurrency 2–3), cập nhật tiến trình theo panel (polling/SSE) hoặc chuyển thành job bất đồng bộ; xử lý Lesson DRAFT mồ côi.
- Với **demo thi**: cân nhắc "bộ truyện mẫu được tuyển chọn thủ công" (ảnh chất lượng cao, lưu cố định vào Supabase, `source=SAMPLE`) song song với tính năng sinh live — để buổi quay video không phụ thuộc may rủi của AI.
- Tính năng nhỏ nhưng có giá trị: cho giáo viên **ghim seed/khóa nhân vật**, xem trước bố cục trước khi tốn tiền sinh ảnh cuối.

**Kiến thức/nội dung**
- Chuyển sang **sinh nhiều bước có kiểm soát**: (1) lập dàn ý/learning objectives theo cấp độ, (2) viết lời thoại, (3) tạo vocab **từ chính lời thoại** (có thể trích bằng code thay vì nhờ LLM), (4) tạo quiz bám lời thoại, (5) validator + vòng tự sửa (repair loop) có giới hạn lần thử.
- **Validator bằng code** (zod + hàm kiểm tra): đếm từ/câu theo `LEVEL_SPEC`, vocab ⊂ dialogue, tên nhân vật ∈ danh sách, regex chặn CJK, quiz `answer` hợp lệ, không trùng câu, tên riêng giữ nguyên đúng dấu trong cả EN và VI.
- **Làm giàu nguồn văn hóa**: mở rộng `EthnicGroup` thành dữ liệu có cấu trúc (mục từ + nghĩa EN + ví dụ + mức độ phù hợp theo level + nguồn/trạng thái xác minh). Có thể bổ sung mục "câu chuyện dân gian/phong tục" ngắn để LLM bám vào. **Mọi nội dung mới phải gắn cờ "chờ khách xác minh"**.
- **Giá trị sư phạm**: mẫu câu trọng tâm mỗi bài, từ vựng có IPA/ví dụ, ôn tập cách quãng, quiz đa dạng (không chỉ chọn đáp án), gợi ý hoạt động cho giáo viên. Chỉ đề xuất những gì thật sự nâng chất lượng và làm được trong thời gian ngắn.
- Chuyển `WORD_DICT` của EthnicModal thành **dữ liệu cấu trúc nằm trong `culture` data** (mục từ có `vi`, `en`, `meaning`, `usage`) thay vì khớp chuỗi cứng.

---

## 9. VILLAGE MAP ("Learn English Through My Village")

- Trang `/village` (công khai): ảnh nền `public/images/village-map.jpg`, 6 nút tròn đặt theo `%` (x,y), label tên điểm, lưới 6 card phía dưới, modal 3 tab: **Câu chuyện** (4 panel ngôi thứ ba, EN nổi bật + VI, nút TTS) → **Từ vựng** → **Quiz + funFact song ngữ**; hoàn thành → `POST /api/village/progress` → +XP, confetti.
- 6 điểm (id → dân tộc, tọa độ %, XP): `kho_weaving` K'Ho (13.0, 68.0, 25) · `ma_forest` Mạ (20.0, 32.0, 25) · `mnong_elephant` M'Nông (43.5, 26.0, 30) · `hmong_textile` H'Mông (75.5, 32.0, 25) · `tay_stilthouse` Tày (83.5, 68.8, 25) · `nung_music` Nùng (49.5, 73.8, 30).
- Cấu trúc điểm: `story[{panelId, illustrationHint, en, vi}]`, `vocabulary`, `quiz{question_en, options[], answer}`, `funFact{en, vi}`. `illustrationHint` **chưa được dùng** (dành cho gen ảnh minh họa).

**Nhược điểm cần xử lý:**
- Modal **chỉ có chữ**, chưa có hình (đã thảo luận 3 hướng: gen ảnh theo `illustrationHint`; crop vùng bản đồ làm banner bằng `background-position` + `background-size`; hoặc 1 ảnh cover/điểm — **chưa chọn/triển khai**).
- **Cả 6 quiz đều có `answer: 0`** (đáp án đúng luôn là lựa chọn đầu) ⇒ lộ đáp án. Cần xáo trộn khi hiển thị hoặc lưu hợp lý; nên có thêm câu hỏi, không chỉ 1 câu.
- Nội dung ngắn (4 panel × 2 câu), funFact chung chung, một số chi tiết văn hóa cần khách xác minh (ví dụ gắn M'Nông–voi–cồng chiêng với Đắk Nông; các khẳng định về H'Mông/Tày/Nùng trong bối cảnh Đắk Nông).
- Tiến độ lưu bằng `MissionAttempt` cần một `lessonId` hợp lệ: route lấy **bài SAMPLE đầu tiên làm placeholder** ⇒ nếu DB chưa có bài SAMPLE thì POST thất bại 500. Cân nhắc bảng riêng `VillageProgress(userId, pointId, completedAt, xpEarned)` (thêm bằng `db push`, **hỏi người dùng trước** vì ảnh hưởng DB thật) hoặc ít nhất xử lý lỗi êm. `GET` luôn trả `xpEarned: 0`.
- Label/nút trên bản đồ từng che chi tiết ảnh; tọa độ đã chỉnh một lần, nên kiểm tra lại trên mobile/màn hình hẹp.
- Giáo viên có thể xem bản đồ nhưng không có tiến độ; chưa có thống kê "học sinh đã khám phá điểm nào" cho giáo viên.

---

## 10. DỮ LIỆU VĂN HÓA (`data/culture.ts` → bảng `EthnicGroup`)

- Mỗi nhóm có: `description, costume[], festivals[], instruments[], crafts[], cuisine[], locations[], architecture`.
- **Không nhất quán ngôn ngữ**: `architecture` (và vài mục) viết tiếng Anh trong khi các trường khác tiếng Việt.
- Phần H'Mông/Tày/Nùng đang liệt kê **địa danh miền Bắc** (Hà Giang, Cao Bằng, Lạng Sơn…) kèm `"Đắk Nông"` thêm vào đầu; cần diễn đạt lại cho đúng ngữ cảnh "cộng đồng sinh sống tại Đắk Nông" mà **không bịa** số liệu/di cư.
- Một số chi tiết nên được rà (đã có ghi chú từ bản rà soát trước): "Lễ đâm trâu" của Mạ đang để nhãn trung tính *Traditional Buffalo Offering Ceremony*; K'Ho mục địa danh nên dùng Lạc Dương/Đam Rông/Di Linh; tránh những cụm khó dịch (ưu tiên *Traditional brocade clothing*, *Silver necklace*, *Indigo headscarf*, *Traditional loincloth*).
- **Mọi chỉnh sửa nội dung văn hóa phải được ghi vào danh sách "chờ khách xác minh"** (file `docs/CULTURE_REVIEW.md`). Không khẳng định tuyệt đối khi không chắc; ưu tiên cách diễn đạt trung tính, không rập khuôn, không phóng đại đặc điểm ngoại hình theo dân tộc.

---

## 11. CÁC ĐIỂM YẾU — THỨ TỰ ƯU TIÊN

**P0 — rủi ro ngày thi**
1. Cơ chế **giữ Supabase không bị pause** + health-check.
2. **Chất lượng ảnh panel** & độ nhất quán nhân vật (mục 8.3–8.4).
3. **Chất lượng nội dung/cấp độ** + validator (mục 8.3–8.4).
4. Cấu hình AI/env nhất quán, báo lỗi rõ ràng (mục 3).

**P1**
5. Village Map: hình minh họa trong modal, quiz không lộ đáp án, tiến độ bền vững, tọa độ responsive.
6. Chuẩn hóa dữ liệu văn hóa + WORD_DICT cấu trúc; rà tên nhân vật (cần khách duyệt).
7. Trải nghiệm tạo bài: tiến trình theo panel, xử lý DRAFT mồ côi, chặn chi phí vô tình (rate-limit/xác nhận trước khi sinh nhiều ảnh), `maxDuration` của route.

**P2**
8. Mobile, hiệu năng ảnh (ảnh nén, `next/image`, lazy), trường hợp mạng yếu vùng cao.
9. Truy cập (accessibility): cỡ chữ, tương phản, TTS lỗi/không hỗ trợ.
10. Adventure Map (chỉ khi còn thời gian và khách muốn).
11. Test tự động tối thiểu cho validator và route quan trọng.

---

## 12. CÁCH LÀM VIỆC (BẮT BUỘC THEO PHASE)

### 12.1 Phase 0 — Định hướng (chỉ đọc)
Đọc HANDOFF.md, `package.json`, `prisma/schema.prisma`, `middleware.ts`, `auth.ts`, `lib/imageGen.ts`, `app/api/lessons/generate/route.ts`, `components/comic/StoryCreator.tsx`, `data/culture.ts`, `data/villageMap.ts`, `prisma/seed.ts`. Tóm tắt lại hiểu biết (≤ 15 dòng) và liệt kê mọi mục **[CẦN XÁC MINH]** đã tìm ra câu trả lời.

### 12.2 Phase 1 — Chạy thử
1. Cài đặt, tạo `.env.local` từ `.env.example` (hỏi người dùng giá trị; **không đoán, không in secret**).
2. Xác định DB đang trỏ tới đâu và **dev/prod có dùng chung một DB Supabase hay không**. Nếu chung ⇒ coi mọi ghi DB là ghi vào production.
3. `npx tsc --noEmit`, lint, `next build`. Ghi lại lỗi có sẵn (đừng sửa lan man ở bước này).
4. Chạy `npx prisma validate && npx prisma generate`. **Không `db push`/seed lên DB thật khi chưa hỏi.**
5. Chạy dev, thử luồng theo từng vai trò: Khách → Học sinh (đọc truyện, quiz, game, Làng của tôi, tiến độ) → Giáo viên (nhân vật, bối cảnh, tạo bài bằng preset, sửa bài, sinh lại 1 panel) → Admin.
6. Kiểm tra dữ liệu DB: số `EthnicGroup` và slug, nhân vật/bối cảnh có ảnh hay không, có bản ghi cũ `ede/giarai/bana` không, có bài SAMPLE không.

### 12.3 Ngân sách & an toàn (BẮT BUỘC)
- **Ngân sách sinh ảnh khi thử nghiệm: tối đa ~20 ảnh trước khi hỏi người dùng**, ghi lại chi phí ước tính từng thí nghiệm. Ưu tiên thí nghiệm nhỏ (1–2 panel) bằng script riêng trong `scripts/`.
- Không chạy `DELETE`/`TRUNCATE`/`db push --force-reset`/seed lại trên DB thật khi chưa có xác nhận rõ ràng. Với thay đổi schema: đề xuất → chờ duyệt → `db push` → báo lại.
- Không commit secret; không in key. Nếu thấy key trong lịch sử/chat/log, nhắc người dùng **xoay (rotate)** key đó.
- Mỗi thay đổi lớn nằm trên **nhánh riêng**; commit nhỏ, thông điệp rõ. Deploy lên Vercel là `git push main` ⇒ **không push `main` khi chưa được phép**.
- Windows: khi cần người dùng chạy lệnh DB, đưa **file `.sql` + lệnh `--file`**, không dùng chuỗi SQL inline.

### 12.4 Phase 2 — Audit (xuất `docs/AUDIT.md`)
Với mỗi điểm yếu ở mục 8–11: **bằng chứng** (lệnh đã chạy, đầu ra, đường dẫn ảnh/đoạn lời thoại), **nguyên nhân gốc**, **mức độ**, **ước lượng công + chi phí**. Gồm các số đo cơ bản: tỉ lệ câu vượt giới hạn từ theo cấp độ, % vocab không có trong lời thoại, % tên nhân vật lạ, số panel rơi về text→image, thời gian sinh một bài, chi phí một bài. Chạy ít nhất 3 bài mẫu ở 3 cấp độ để lấy số đo (trong ngân sách 12.3).

### 12.5 Phase 3 — Đề xuất
Đưa 2–3 phương án cho phần **ảnh** và 2–3 cho phần **nội dung**, kèm đánh đổi (chất lượng / chi phí / thời gian / rủi ro), **một phương án khuyến nghị**, và danh sách việc theo thứ tự P0 → P1. **Dừng chờ người dùng duyệt.**

### 12.6 Phase 4 — Triển khai
Làm theo thứ tự đã duyệt. Mỗi mục: sửa → `tsc`/lint/build → thử luồng liên quan → ghi chú ngắn. Giữ UI tiếng Việt, thân thiện trẻ em 9–13 tuổi, an toàn nội dung.

### 12.7 Phase 5 — Kiểm chứng & bàn giao
- Chạy lại bộ số đo Phase 2 và so sánh trước/sau.
- Cập nhật `docs/CHANGELOG.md`, `docs/CULTURE_REVIEW.md` (mọi nội dung cần khách xác minh).
- Liệt kê **tài liệu bàn giao bị ảnh hưởng và cần chỉnh lại**: báo cáo dự thi (`Highland_English_Horizon_Ban_Giao_Lan2_v6.docx`, giọng học sinh/giáo viên Đắk Nông), kịch bản video (`..._Kich_Ban_Video_v3.docx`), hướng dẫn sử dụng. Không tự sửa file `.docx` nếu không được yêu cầu; chỉ nêu cần đổi gì.
- Báo cáo cuối: đã làm gì, chưa làm gì, rủi ro còn lại, việc người dùng phải làm thủ công (env Vercel + Redeploy, `db push`, seed, đổi key…).

---

## 13. TIÊU CHÍ HOÀN THÀNH

- Ảnh: nhân vật chọn xuất hiện **nhận diện được và nhất quán** giữa các panel của cùng bài (đánh giá bằng mắt qua ≥ 3 bài, ghi lại); không còn "rơi im lặng" về ảnh không có nhân vật; mỗi bài thường có ≥ 2 bối cảnh/góc nhìn khác nhau khi giáo viên chọn nhiều nền.
- Nội dung: ≥ 95% câu thoại đúng giới hạn từ theo cấp độ; 100% vocab nằm trong lời thoại; 0 nhân vật lạ; 0 ký tự CJK; tên riêng đúng dấu ở cả EN/VI; JSON luôn hợp lệ hoặc tự sửa.
- Village Map: có hình minh họa; quiz không lộ đáp án; lưu tiến độ không phụ thuộc bài SAMPLE; hoạt động trên màn hình hẹp.
- Vận hành: có cơ chế chống pause Supabase; cấu hình AI một nơi, báo lỗi rõ; `next build` sạch; không còn tham chiếu 3 dân tộc cũ.
- Mọi thứ cần khách xác minh được gom trong một file duy nhất.

---

## 14. NHỮNG ĐIỀU TUYỆT ĐỐI KHÔNG LÀM

- Không đưa Ê Đê/Gia Rai/Ba Na trở lại; không đổi danh sách 6 dân tộc.
- Không dùng `prisma migrate`; không reset DB.
- Không tạo lại FK từ `Lesson`/`ComicBackground`/`User` tới `EthnicGroup`.
- Không xóa tính năng đang có để "gọn code".
- Không để key/secret xuất hiện trong repo, log, hay câu trả lời.
- Không tự khẳng định thông tin văn hóa chưa kiểm chứng; không rập khuôn hay phóng đại đặc điểm ngoại hình theo dân tộc.
- Không push `main` hoặc deploy khi chưa được người dùng cho phép.
