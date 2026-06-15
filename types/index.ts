// ===== K'Ho English Horizon — Types =====

export type Level = 1 | 2 | 3;
export type LangMode = "both" | "vi" | "en";
export type Theme = "light" | "dark";
export type GameMode = "match" | "quiz";

export interface BilingualText {
  vi: string;
  en: string;
}

export interface Vocabulary {
  en: string;
  vi: string;
  audio?: string;
}

export interface Dialogue {
  character: string;
  vi: string;
  en: string;
}

export interface Panel {
  id: number;
  bg: string;
  scene: string;
  dialogue: Dialogue[];
}

export interface QuizQuestion {
  question_en: string;
  options: string[];
  answer: number; // index
}

export interface Story {
  id: string;
  title: BilingualText;
  level: Level;
  ethnic_culture: string;
  color: string;
  emoji: string;
  description_vi: string;
  vocabulary: Vocabulary[];
  panels: Panel[];
  quiz: QuizQuestion[];
  missions?: CulturalMission[];
}

export interface StoryProgress {
  read?: boolean;
  readAt?: number;
  quizScore?: number;
  quizTotal?: number;
  quizAt?: number;
  matchScore?: number;
  pronScore?: number;
}

export interface AllProgress {
  [storyId: string]: StoryProgress;
}

export interface Settings {
  lang: LangMode;
  theme: Theme;
  ttsEnabled: boolean;
}

// Creator types
export interface CreatorDialogue {
  char: string;
  vi: string;
  en: string;
}

export interface CreatorPanel {
  id: number;
  scene: string;
  dialogues: CreatorDialogue[];
}

export interface Badge {
  id: string;
  icon: string;
  name: string;
  earned: boolean;
}

// ===== Highland English Horizon — Platform types =====

export type AppRole = "STUDENT" | "TEACHER" | "ADMIN" | "SUPER_ADMIN";

export type LessonStatus = "DRAFT" | "PUBLISHED";
export type LessonSource = "MANUAL" | "AI" | "SAMPLE";

export interface CulturalMission {
  id: string;
  type: "select" | "match" | "info";
  title: string;
  prompt: string;
  options?: { id: string; label: string; emoji?: string; correct?: boolean }[];
  pairs?: { left: string; right: string }[];
  fact?: string;
}

export interface CulturalGroupData {
  id?: string;
  slug: string;
  nameVi: string;
  nameEn: string;
  emoji: string;
  description: string;
  costume: string[];
  festivals: string[];
  instruments: string[];
  crafts: string[];
  cuisine: string[];
  locations: string[];
  architecture: string;
}

export interface LessonDTO {
  id: string;
  titleVi: string;
  titleEn: string;
  topic: string;
  level: Level;
  ageGroup: number;
  color: string;
  emoji: string;
  descriptionVi: string;
  vocabulary: Vocabulary[];
  panels: Panel[];
  quiz: QuizQuestion[];
  missions: CulturalMission[];
  status: LessonStatus;
  source: LessonSource;
  ethnicGroupId?: string | null;
  classId?: string | null;
  authorId?: string;
  createdAt?: string;
}

export interface AILessonInput {
  topic: string;
  ethnicGroup: string;
  ageGroup: number;
  vocabulary: string[];
  objective: string;
  level: Level;
}

export interface ClassDTO {
  id: string;
  name: string;
  joinCode: string;
  teacherId: string;
  memberCount: number;
  createdAt: string;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  ethnicGroup?: string | null;
  ageGroup?: number | null;
  avatar: string;
  xp: number;
  createdAt: string;
}
