import type { Story, LessonDTO } from "@/types";

export function lessonToStory(lesson: LessonDTO): Story {
  return {
    id: lesson.id,
    title: { vi: lesson.titleVi, en: lesson.titleEn },
    level: lesson.level,
    ethnic_culture: lesson.topic,
    color: lesson.color,
    emoji: lesson.emoji,
    description_vi: lesson.descriptionVi,
    vocabulary: lesson.vocabulary,
    panels: lesson.panels,
    quiz: lesson.quiz,
    missions: lesson.missions,
  };
}
