import type { Story, LessonDTO, Panel } from "@/types";

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
    ethnic_culture: lesson.topic,
    color: lesson.color,
    emoji: lesson.emoji,
    description_vi: lesson.descriptionVi,
    vocabulary: lesson.vocabulary,
    panels,
    quiz: lesson.quiz,
    missions: lesson.missions,
  };
}
