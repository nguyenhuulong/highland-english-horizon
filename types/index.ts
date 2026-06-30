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
  generatedImageUrl?: string;
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

export type AppRole = "STUDENT" | "TEACHER" | "ADMIN";

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

// ===== Comic System Types =====

export type CharacterRole = "child" | "adult" | "elder";
export type CharacterGender = "male" | "female";
export type BackgroundCategory =
  | "village"
  | "forest"
  | "market"
  | "festival"
  | "house"
  | "school";

export interface PanelV2 extends Panel {
  characters?: string[];
  backgroundKey?: string;
  generatedImageUrl?: string;
  characterAction?: string;
}

// ===== Comic Studio v2 Types =====

export type StoryStatus = "draft" | "generating" | "ready" | "published";

export type StoryTemplateKey =
  | "INTRO_4"
  | "DIALOGUE_6"
  | "ADVENTURE_6"
  | "FESTIVAL_8"
  | "MARKET_6"
  | "FESTIVAL_6"
  | "EXPLORE_8";

export interface StoryTemplate {
  key: StoryTemplateKey;
  nameVi: string;
  nameEn: string;
  panelCount: number;
  description: string;
  structure: { label: string; hint: string }[];
}

export interface ComicStoryPanel {
  id: number;
  backgroundId: string;
  backgroundImageUrl?: string;
  generatedImageUrl?: string;
  action: string;
  characterIds: string[];
  dialogue: {
    characterId: string;
    characterName: string;
    en: string;
    vi: string;
  }[];
}

export interface ComicStoryDTO {
  id: string;
  title: string;
  titleEn: string;
  topic: string;
  templateKey: StoryTemplateKey;
  status: StoryStatus;
  ethnicGroupId?: string | null;
  authorId: string;
  panels: ComicStoryPanel[];
  vocabulary: { en: string; vi: string }[];
  quiz: QuizQuestion[];
  characterIds: string[];
  backgroundIds: string[];
  lessonId?: string | null;
  createdAt: string;
}

// Extended DTOs with image fields
export interface ComicCharacterDTO {
  id: string;
  name: string;
  nameEn: string;
  role: CharacterRole;
  gender: CharacterGender;
  ethnicGroupId?: string | null;
  descriptionVi: string;
  descriptionEn: string;
  costumePrompt: string;
  appearancePrompt: string;
  referenceImageUrl?: string | null;
  characterImageUrl?: string | null;
  thumbnailEmoji: string;
  isActive: boolean;
}

export interface ComicBackgroundDTO {
  id: string;
  key: string;
  nameVi: string;
  nameEn: string;
  category: BackgroundCategory;
  ethnicGroupId?: string | null;
  prompt: string;
  referenceImageUrl?: string | null;
  imageUrl?: string | null;
  thumbnailEmoji: string;
  isActive: boolean;
}
