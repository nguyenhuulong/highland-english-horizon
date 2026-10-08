import type { Story, LessonDTO, Panel } from "@/types";

const ETHNIC_LABELS = ["K'Ho", "Mạ", "M'Nông", "H'Mông", "Tày", "Nùng"];

/** `topic` của bài AI là câu mô tả dài → chỉ hiện tên dân tộc (hoặc cụm ngắn) trên thẻ. */
export function ethnicLabel(topic: string): string {
  const t = topic.trim();
  if (t.length <= 24) return t;
  const hit = ETHNIC_LABELS.find(e => t.includes(e));
  return hit ?? t.slice(0, 22).trimEnd() + "…";
}

export function lessonToStory(lesson: LessonDTO): Story {
  const panels: Panel[] = (lesson.panels || []).map(p => ({
    id: p.id,
    bg: p.bg || "#FFF3E0",
    scene: p.scene || "morning_village",
    dialogue: p.dialogue || [],
    generatedImageUrl: p.generatedImageUrl,
  }));

  return {
    id: lesson.id,
    title: { vi: lesson.titleVi, en: lesson.titleEn },
    level: lesson.level,
    ethnic_culture: ethnicLabel(lesson.topic),
    color: lesson.color,
    emoji: lesson.emoji,
    description_vi: lesson.descriptionVi,
    vocabulary: lesson.vocabulary,
    panels,
    quiz: lesson.quiz,
    missions: lesson.missions,
  };
}
