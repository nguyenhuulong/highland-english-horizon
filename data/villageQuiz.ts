// Câu hỏi bổ sung cho Village Map (bám sát lời kể trong story từng điểm) + hàm xáo trộn đáp án.
// Tách file riêng để không động vào data/villageMap.ts (nội dung chờ khách xác minh).
import type { MapQuiz, VillageMapPoint } from "@/data/villageMap";

export const VILLAGE_EXTRA_QUIZ: Record<string, MapQuiz[]> = {
  kho_weaving: [
    { question_en: "Who walks through the forest with Ya Đin?", options: ["Her mother", "Her teacher", "A market seller", "A traveler"], answer: 0 },
    { question_en: "What does the thread move across at home?", options: ["A loom", "A river", "A drum", "A basket"], answer: 0 },
  ],
  ma_forest: [
    { question_en: "What does Ama K'Bram teach Pơ Mai to observe?", options: ["Leaves, roots, and flowers", "Clouds and stars", "Boats and cars", "Coins and books"], answer: 0 },
    { question_en: "What do they hear in the forest?", options: ["Birds", "A school bell", "A radio", "A train"], answer: 0 },
  ],
  mnong_elephant: [
    { question_en: "What does N'Thao see near the festival ground?", options: ["An elephant", "A tiger", "A boat", "A bear"], answer: 0 },
    { question_en: "What begins to sound across the village?", options: ["The gongs", "A siren", "A piano", "A car horn"], answer: 0 },
  ],
  hmong_textile: [
    { question_en: "Who does Sùng Mỷ visit the market with?", options: ["Her father", "Her teacher", "Her cousin", "A tourist"], answer: 0 },
    { question_en: "What does each careful stitch need?", options: ["Time and patience", "Snow and ice", "Loud music", "Fast machines"], answer: 0 },
  ],
  tay_stilthouse: [
    { question_en: "What does Lường Khánh help her grandmother do?", options: ["Clean the stilt house", "Cook for a festival", "Build a boat", "Plant trees"], answer: 0 },
    { question_en: "What stretches beyond the wooden stairs?", options: ["Green rice fields", "A big city", "A sandy beach", "A snowy hill"], answer: 0 },
  ],
  nung_music: [
    { question_en: "Who watches his grandmother perform Then music?", options: ["Lâm Bảo", "N'Thao", "Ya Đin", "Pơ Mai"], answer: 0 },
    { question_en: "What does Lâm Bảo want to learn one day?", options: ["The tính lute", "To drive a bus", "To paint a boat", "To fly a kite"], answer: 0 },
  ],
};

/** Tất cả câu hỏi của một điểm; thứ tự đáp án được xáo trộn nên đáp án đúng không còn luôn ở vị trí đầu. */
export function getShuffledQuizzes(point: VillageMapPoint): MapQuiz[] {
  const all = [point.quiz, ...(VILLAGE_EXTRA_QUIZ[point.id] ?? [])];
  return all.map(q => {
    const correct = q.options[q.answer];
    const opts = [...q.options];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return { question_en: q.question_en, options: opts, answer: opts.indexOf(correct) };
  });
}
