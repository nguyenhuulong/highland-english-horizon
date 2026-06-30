# 🌄 Highland English Horizon

Nền tảng học tiếng Anh dành cho học sinh dân tộc thiểu số vùng Tây Nguyên thông qua truyện tranh tương tác, trò chơi giáo dục và học liệu được tạo tự động bằng AI.

## Trạng thái triển khai

Repo này là bản nâng cấp từ phiên bản MVP ban đầu (landing page, thư viện truyện, reader song ngữ, trò chơi từ vựng, tiến độ cục bộ) lên kiến trúc đầy đủ theo đặc tả ở phần [Đặc tả dự án](#-đặc-tả-dự-án) bên dưới:

- ✅ Hệ thống tài khoản & **phân quyền (RBAC)**: Guest / Student / Teacher / Admin / Super Admin (NextAuth v5 + Prisma).
- ✅ **AI Lesson Generator**: giáo viên nhập chủ đề, nhóm dân tộc, độ tuổi, từ vựng, mục tiêu → AI sinh truyện tranh song ngữ, từ vựng, đố vui, nhiệm vụ văn hóa. Hỗ trợ mọi provider tương thích OpenAI API (**Groq free, Gemini free, OpenRouter free, Ollama local, OpenAI...**) — không bắt buộc dùng Anthropic.
- ✅ **Cultural Knowledge Base**: dữ liệu văn hóa 6 dân tộc (K'Ho, Mạ, M'Nông, H'Mông, Tày, Nùng) làm bối cảnh cho AI và hiển thị trên trang chủ.
- ✅ **Cultural Missions** tích hợp vào hành trình đọc truyện (Stage "Khám phá văn hóa").
- ✅ **Speak Challenge**: ghi âm, nhận diện giọng nói (Web Speech API), chấm điểm phát âm.
- ✅ **Gamification**: XP, huy hiệu (badges), bản đồ học tập (Learning Map).
- ✅ **Dashboards** riêng cho từng vai trò: Student, Teacher (lớp học, AI Generator, quản lý bài học), Admin (người dùng, bài học, dữ liệu văn hóa), Super Admin (tổng quan hệ thống).
- ✅ Cơ sở dữ liệu PostgreSQL + Prisma ORM, vẫn giữ trải nghiệm offline/Guest qua dữ liệu mẫu (`data/stories.ts`) + localStorage.

## Cài đặt & chạy thử

### 1. Cài dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

Sao chép `.env.example` thành `.env` và điền giá trị:

```bash
cp .env.example .env
```

- `DATABASE_URL`: chuỗi kết nối PostgreSQL.
- `AUTH_SECRET`: chạy `npx auth secret` để sinh ngẫu nhiên.
- `AI_BASE_URL` / `AI_MODEL` / `AI_API_KEY`: cấu hình provider AI cho AI Lesson Generator. Xem `.env.example` để chọn provider **miễn phí** (Groq, Gemini, OpenRouter, Ollama local...) hoặc trả phí (OpenAI).

### 3. Khởi tạo cơ sở dữ liệu

```bash
npm run db:push    # tạo schema từ prisma/schema.prisma
npm run db:seed    # seed dữ liệu văn hóa, badges, tài khoản demo, bài học mẫu
```

### 4. Chạy ứng dụng

```bash
npm run dev
```

### Tài khoản demo (sau khi seed, mật khẩu chung: `Highland@2026`)

| Vai trò | Email |
| --- | --- |
| Học sinh | `student@highlandenglish.vn` |
| Giáo viên | `teacher@highlandenglish.vn` |
| Quản trị viên | `admin@highlandenglish.vn` |
| Ban tổ chức (Super Admin) | `superadmin@highlandenglish.vn` |

## Cấu trúc dự án (phần mở rộng)

```
auth.ts                     # NextAuth v5 config (Credentials + JWT)
proxy.ts                    # Bảo vệ route /dashboard theo vai trò
prisma/schema.prisma         # Mô hình dữ liệu: User, Class, Lesson, EthnicGroup, Badge, ...
prisma/seed.ts                # Seed dữ liệu mẫu
lib/ai.ts                     # Gọi AI (Groq/Gemini/OpenRouter/Ollama/OpenAI...) để sinh bài học
lib/gamification.ts          # XP & huy hiệu
lib/rbac.ts                  # Hằng số & helper phân quyền
data/culture.ts               # Cultural Knowledge Base (6 dân tộc)
data/badges.ts                # Định nghĩa huy hiệu mặc định
app/api/...                  # Route Handlers: auth, register, lessons, ai, classes, users, culture, progress, missions
app/dashboard/                # Bảng điều khiển theo vai trò (student/teacher/admin/super-admin)
app/(auth)/login|register     # Trang đăng nhập / đăng ký
components/dashboard/         # AI Lesson Generator, quản lý lớp/bài học/người dùng/văn hóa
components/missions/          # Cultural Mission card
components/speak/             # Speak Challenge (Web Speech API)
components/companion/         # AI Learning Companion (mascot)
```

---

# 📋 Đặc tả dự án

> Phần dưới đây là bản README mô tả ý tưởng/đặc tả ban đầu của dự án, được giữ lại làm tài liệu tham chiếu.

## Vision

Highland English Horizon là nền tảng hỗ trợ học tiếng Anh dành cho học sinh dân tộc thiểu số vùng Tây Nguyên thông qua truyện tranh tương tác, trò chơi giáo dục và học liệu được tạo tự động bằng AI.

Dự án hướng đến việc giải quyết một số khó khăn thực tế của học sinh dân tộc thiểu số:

* Thiếu hứng thú với nội dung học tiếng Anh truyền thống.
* Khó tiếp cận môi trường luyện nói tiếng Anh.
* Nội dung học tập chưa gắn với văn hóa và đời sống địa phương.
* Giáo viên mất nhiều thời gian để xây dựng học liệu hấp dẫn.

Thông qua AI và công nghệ web hiện đại, hệ thống giúp giáo viên nhanh chóng tạo ra các bài học tiếng Anh mang đậm bản sắc văn hóa Tây Nguyên, đồng thời tạo môi trường học tập sinh động, gần gũi và dễ tiếp cận cho học sinh.

---

## Project Goals

### Đối với học sinh

* Tăng hứng thú học tiếng Anh.
* Tăng khả năng ghi nhớ từ vựng thông qua hình ảnh và ngữ cảnh quen thuộc.
* Tăng sự tự tin khi luyện nghe và luyện nói.
* Hiểu thêm về văn hóa dân tộc và cộng đồng địa phương.

### Đối với giáo viên

* Giảm thời gian soạn bài.
* Tự động hóa việc tạo học liệu.
* Dễ dàng xây dựng các bài học phù hợp với từng nhóm học sinh.
* Theo dõi tiến độ học tập của lớp học.

---

## Core Innovation

### AI Lesson Generator

Đây là tính năng sáng tạo trung tâm của hệ thống.

Giáo viên chỉ cần nhập:

* Chủ đề bài học.
* Nhóm dân tộc mục tiêu.
* Độ tuổi học sinh.
* Danh sách từ vựng.
* Mục tiêu bài học.

AI sẽ tự động tạo:

* Truyện tranh tiếng Anh.
* Hội thoại song ngữ.
* Audio đọc truyện (Text-to-Speech).
* Câu hỏi đọc hiểu.
* Mini games.
* Bài luyện nói.
* Nhiệm vụ khám phá văn hóa.

---

## AI Comic Builder — Workflow

```
Teacher Input
  ↓
AI Story Generator
  ↓
AI Character/Comic Prompt Generator
  ↓
AI Audio Generator (TTS)
  ↓
AI Quiz Generator
  ↓
Publish Lesson
```

## Cultural Knowledge Base

Hệ thống cung cấp kho dữ liệu văn hóa phục vụ AI cho các nhóm dân tộc: **K'Ho, Mạ, M'Nông, H'Mông, Tày, Nùng**, bao gồm trang phục truyền thống, lễ hội, nhạc cụ, nghề truyền thống, địa danh, kiến trúc, ẩm thực. AI sử dụng dữ liệu này để tạo nội dung gần gũi với học sinh và hạn chế sinh nội dung không phù hợp.

---

## Learning Journey: Read → Understand → Play → Speak

### Stage 1 — Read
Đọc truyện tranh tương tác: song ngữ Anh – Việt, Text-To-Speech, highlight từ đang đọc, giải nghĩa từ vựng nhanh.

### Stage 2 — Understand
AI tạo bộ câu hỏi đọc hiểu, từ vựng, ngữ cảnh dựa trên nội dung truyện.

### Stage 3 — Play
Trò chơi học tập sinh tự động: Match Vocabulary, Fill In The Blank, Picture Selection, Quiz Challenge, Sentence Ordering.

### Stage 4 — Speak (Speak Challenge)
Học sinh luyện phát âm bằng cách đọc lại câu thoại: ghi âm, Speech Recognition, so khớp câu gốc, chấm điểm phát âm + feedback.

---

## Cultural Missions

Sau mỗi bài học, học sinh tham gia các nhiệm vụ khám phá văn hóa (chọn đúng nhạc cụ, ghép tên lễ hội với hình ảnh, nhận diện trang phục truyền thống, tìm hiểu ý nghĩa lễ hội...) — giúp học tiếng Anh qua ngữ cảnh quen thuộc và góp phần bảo tồn, lan tỏa giá trị văn hóa dân tộc.

---

## AI Learning Companion

Một nhân vật đồng hành xuyên suốt quá trình học: hướng dẫn học sinh, đưa lời khích lệ ("Great Job!", "Let's Try Again!", "You Completed Today's Lesson!"), thông báo tiến độ, tạo cảm giác thân thiện gần gũi.

---

## Gamification System

* **XP System**: nhận điểm khi hoàn thành bài học, mini game, nhiệm vụ văn hóa, luyện phát âm.
* **Achievement Badges**: Highlands Explorer, Culture Discoverer, English Story Reader, Pronunciation Star, ...
* **Learning Map**: hành trình học tập theo dạng bản đồ khám phá Tây Nguyên.

---

## User Management System (RBAC)

| Vai trò | Quyền hạn chính |
| --- | --- |
| **Guest** | Xem landing page, thông tin dự án, đọc bài học mẫu |
| **Student** | Đăng ký, tham gia lớp học, học bài, chơi game, luyện nói, theo dõi tiến độ |
| **Teacher** | Tạo lớp học, quản lý học sinh, tạo bài học bằng AI, quản lý truyện tranh, theo dõi kết quả |
| **Admin** | Quản lý giáo viên/học sinh, nội dung, dữ liệu văn hóa, AI Templates |
| **Super Admin** | Toàn quyền quản trị hệ thống, dữ liệu, người dùng, báo cáo tổng thể |

---

## Dashboards

* **Student Dashboard**: bài học đã hoàn thành, từ vựng đã học, huy hiệu, điểm XP, tiến độ luyện nói.
* **Teacher Dashboard**: danh sách lớp học, tiến độ học sinh, tỷ lệ hoàn thành bài học, thống kê kết quả.
* **Admin Dashboard**: tổng số người dùng, bài học, truyện tranh, thống kê sử dụng hệ thống.

---

## Technical Architecture

* **Frontend**: Next.js, TypeScript, TailwindCSS, ShadCN UI
* **Backend**: Next.js API Routes
* **Authentication & Authorization**: NextAuth (Auth.js v5), RBAC
* **Database**: PostgreSQL + Prisma ORM
* **Storage**: Supabase Storage (cho audio/ảnh do AI sinh — định hướng mở rộng)
* **AI Services**: Lesson/Story/Dialogue/Quiz/Comic Prompt/Audio/Cultural Mission Generation — qua bất kỳ provider tương thích OpenAI API (Groq, Gemini, OpenRouter, Ollama, OpenAI, Anthropic qua proxy tương thích...)

---

## Competition Innovation Summary

1. AI hỗ trợ giáo viên tạo học liệu tiếng Anh hoàn chỉnh chỉ từ một ý tưởng bài học.
2. Tự động tạo truyện tranh mang bối cảnh văn hóa Tây Nguyên.
3. Tự động tạo trò chơi học tập và câu hỏi đọc hiểu từ nội dung truyện.
4. Kết hợp học tiếng Anh với tìm hiểu văn hóa dân tộc thiểu số.
5. Tích hợp luyện phát âm và phản hồi tức thời cho học sinh.
6. Hệ thống Cultural Missions giúp học sinh học tiếng Anh thông qua các hoạt động khám phá văn hóa.
7. Phù hợp với điều kiện thực tế của trường học vùng sâu vùng xa, dễ triển khai và dễ mở rộng.


## Prompt ảnh

1. Nhân vật — Character Sheet 2D
- K'Ho girl — full body: 2D cartoon character sheet, front view, K'Ho ethnic minority girl, age 8, wearing traditional K'Ho woven dress with red and black geometric patterns, long black hair with simple headband, warm brown skin, big expressive eyes, friendly smile, flat color illustration, white background, anime-inspired style, clean line art, full body standing pose
- M'Nông boy: 2D cartoon character, full body front view, M'Nong ethnic minority boy age 9, wearing dark indigo traditional shirt with colorful embroidered collar, short black hair, barefoot, holding a small bamboo flute, flat illustration style, white background, children's book art style, clean lines, warm earthy colors
- Elderly K'Ho woman: 2D flat cartoon, full body, elderly K'Ho woman age 65, silver hair tied in traditional bun, wearing long traditional woven skirt with geometric patterns in red black and yellow, kind wrinkled face, weaving basket in hands, warm skin tone, children's storybook illustration style, white background, front view
- H'Mông girl: 2D cartoon character sheet, H'Mong ethnic minority girl age 7, colorful traditional H'Mong outfit with layered skirt in blue pink and green, silver jewelry necklace, black hair in braids, shy gentle expression, flat color art, white background, full body front and side view, clean line art

2. Bối cảnh — Scene / Background
- Nhà rông: 2D cartoon background, traditional K'Ho communal house "nha rong", tall pointed thatched roof reaching high, wooden stilts, surrounded by green jungle trees, warm afternoon sunlight, children's book illustration style, flat colors, no characters, wide establishing shot
- Ruộng bậc thang: 2D cartoon landscape background, terraced rice fields in Central Highlands Vietnam, green and golden rice paddies stepping down the mountain, misty morning atmosphere, simple flat illustration, children's storybook style, vibrant colors, no people
- Lễ hội cồng chiêng: 2D cartoon background, Central Highlands Vietnam gong festival at night, large bonfire in center, traditional gongs hanging on wooden frame, decorative banners with ethnic patterns, warm orange firelight glow, flat illustration style, children's book art, festive atmosphere
- Rừng Tây Nguyên: 2D cartoon jungle background, Central Highlands Vietnam tropical forest, tall ancient trees with thick roots, dappled sunlight through canopy, tropical plants and ferns, a small stream visible, peaceful atmosphere, flat color illustration, children's storybook style

3. Comic Panel — Cảnh truyện tranh
- Panel gặp gỡ: 2D comic panel, K'Ho girl and M'Nong boy meeting for the first time, standing in front of traditional nha rong house, both waving hello, speech bubbles empty, children's comic book style, flat colors, simple background, cute cartoon characters with ethnic traditional clothing
- Panel hoạt động: 2D children's comic panel, two ethnic minority children playing traditional bamboo instruments together near a river in Central Highlands Vietnam, happy expressions, afternoon light, flat illustration, simple background with jungle trees, cartoon style, warm earthy color palette

4. Negative prompts gợi ý (nếu API hỗ trợ)
realistic photo, 3D render, dark theme, scary, violent, adult content, western clothing, modern clothes, blurry, low quality, deformed hands, extra fingers

Lưu ý khi test
Consistency nhân vật — thêm cụm này vào cuối mỗi prompt về cùng một nhân vật để giữ nhất quán:
same character design as reference, consistent art style, model sheet
Style anchor — nếu muốn toàn bộ truyện cùng tone màu, thêm:
Studio Ghibli inspired, warm Southeast Asian color palette, soft cel shading
hoặc
flat vector art, bold outlines, vibrant colors, Cartoon Network style