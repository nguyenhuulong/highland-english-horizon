"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { useProgress } from "@/lib/hooks";
import { lessonToStory } from "@/lib/lesson";
import StoryCard from "@/components/ui/StoryCard";

import type { Level, LessonDTO, Story } from "@/types";

const FILTERS = [
  { label: "Tất cả", value: "all" },
  { label: "🌱 Starter", value: "1" },
  { label: "🌿 Basic", value: "2" },
  { label: "🌳 Intermediate", value: "3" },
];

export default function LibraryPage() {
  const [filter, setFilter] = useState("all");
  const [stories, setStories] = useState<Story[]>([]);

  const { getStoryProgress } = useProgress();
  const { status } = useSession();

  const isGuest = status !== "authenticated";

  useEffect(() => {
    fetch("/api/lessons")
      .then((r) => r.json())
      .then((data) => {
        const lessons: LessonDTO[] = data.lessons || [];

        console.log(
          "Lesson IDs:",
          lessons.map((l) => l.id)
        );

        setStories(lessons.map(lessonToStory));
      })
      .catch((err) => {
        console.error("Failed to load lessons:", err);
      });
  }, []);

  const filtered =
    filter === "all"
      ? stories
      : stories.filter(
        (s) => s.level === (parseInt(filter) as Level)
      );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      <h1 style={{ marginBottom: 8 }}>
        {isGuest ? "📚 Bài học mẫu" : "📚 Thư viện bài học"}
      </h1>

      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
        {isGuest
          ? "Khám phá các bài học mẫu được xây dựng từ văn hóa các dân tộc Việt Nam."
          : "Chọn bài học phù hợp trình độ và chủ đề bạn muốn khám phá."}
      </p>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: "8px 18px",
              borderRadius: 20,
              border: `2px solid ${filter === f.value
                  ? "var(--primary)"
                  : "var(--border)"
                }`,
              background:
                filter === f.value
                  ? "var(--primary)"
                  : "var(--bg-card)",
              color:
                filter === f.value
                  ? "white"
                  : "var(--text-light)",
              fontWeight: 700,
              fontSize: "0.87rem",
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "var(--font-body)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 24px",
            color: "var(--text-muted)",
          }}
        >
          <div
            style={{
              fontSize: "4rem",
              marginBottom: 16,
              opacity: 0.5,
            }}
          >
            📚
          </div>

          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.2rem",
              fontWeight: 700,
            }}
          >
            Chưa có bài học nào
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(260px,1fr))",
            gap: 20,
          }}
        >
          {filtered.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              progress={getStoryProgress(story.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}