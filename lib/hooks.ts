"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { AllProgress, Settings, Story, StoryProgress } from "@/types";

const PROGRESS_KEY = "heh_progress";
const SETTINGS_KEY = "heh_settings";

const DEFAULT_SETTINGS: Settings = {
  lang: "both",
  theme: "light",
  ttsEnabled: true,
};

function syncToServer(body: Record<string, unknown>) {
  fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});
}

// ---- useProgress ----
export function useProgress() {
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const [progress, setProgress] = useState<AllProgress>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) {
        setProgress(JSON.parse(raw));
      }
    } catch {}
  }, []);
  const markRead = useCallback(
    (storyId: string) => {
      setProgress((prev) => {
        const next = {
          ...prev,
          [storyId]: { ...prev[storyId], read: true, readAt: Date.now() },
        };
        try {
          localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
      if (isAuthed) syncToServer({ lessonId: storyId, action: "read" });
    },
    [isAuthed]
  );

  const saveQuizScore = useCallback(
    (storyId: string, score: number, total: number) => {
      setProgress((prev) => {
        const next = {
          ...prev,
          [storyId]: {
            ...prev[storyId],
            quizScore: score,
            quizTotal: total,
            quizAt: Date.now(),
          },
        };
        try {
          localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
      if (isAuthed) syncToServer({ lessonId: storyId, action: "quiz", score, total });
    },
    [isAuthed]
  );

  const saveMatchScore = useCallback((storyId: string, score: number) => {
    setProgress((prev) => {
      const next = {
        ...prev,
        [storyId]: { ...prev[storyId], matchScore: score },
      };
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    if (isAuthed) syncToServer({ lessonId: storyId, action: "match", score });
  }, [isAuthed]);

  const savePronunciationScore = useCallback((storyId: string, score: number, sentenceEn: string, transcript: string) => {
    setProgress((prev) => {
      const next = {
        ...prev,
        [storyId]: { ...prev[storyId], pronScore: score },
      };
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    if (isAuthed) syncToServer({ lessonId: storyId, action: "pronunciation", score, sentenceEn, transcript });
  }, [isAuthed]);

  const getStoryProgress = useCallback(
    (storyId: string): StoryProgress => progress[storyId] || {},
    [progress]
  );

  const getStoriesRead = useCallback(
    (stories: Story[]) =>
      stories.filter((s) => progress[s.id]?.read).length,
    [progress]
  );

  const getTotalWords = useCallback(
    (stories: Story[]) =>
      stories.reduce(
        (sum, s) => sum + (progress[s.id]?.read ? s.vocabulary.length : 0),
        0
      ),
    [progress]
  );

  return {
    progress,
    markRead,
    saveQuizScore,
    saveMatchScore,
    savePronunciationScore,
    getStoryProgress,
    getStoriesRead,
    getTotalWords,
  };
}

// ---- useSettings ----
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const toggleTheme = useCallback(
    () =>
      updateSettings({ theme: settings.theme === "light" ? "dark" : "light" }),
    [settings.theme, updateSettings]
  );

  return { settings, updateSettings, toggleTheme };
}

// ---- useTTS ----
export function useTTS(enabled: boolean) {
  const speak = useCallback(
    (text: string) => {
      if (!enabled || typeof window === "undefined" || !window.speechSynthesis)
        return;
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "en-US";
      utt.rate = 0.85;
      utt.pitch = 1;
      window.speechSynthesis.speak(utt);
    },
    [enabled]
  );

  return { speak };
}

// ---- useOnlineStatus ----
export function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);

    update();

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}
