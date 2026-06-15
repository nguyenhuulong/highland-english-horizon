"use client";

import { useState, useRef, useCallback } from "react";

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).filter(Boolean);
}

function similarityScore(target: string, transcript: string) {
  const a = normalize(target);
  const b = normalize(transcript);
  if (!a.length) return 0;
  let matches = 0;
  const bCopy = [...b];
  for (const word of a) {
    const idx = bCopy.indexOf(word);
    if (idx !== -1) {
      matches++;
      bCopy.splice(idx, 1);
    }
  }
  return Math.round((matches / a.length) * 100);
}

interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionEventLike extends Event {
  results: { [index: number]: { [index: number]: SpeechRecognitionResultLike } };
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export default function SpeakChallenge({
  sentenceEn, sentenceVi, onComplete,
}: { sentenceEn: string; sentenceVi: string; onComplete: (score: number, transcript: string) => void }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  const start = useCallback(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev) => {
      const text = ev.results[0][0].transcript;
      setTranscript(text);
      const s = similarityScore(sentenceEn, text);
      setScore(s);
      onComplete(s, text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setScore(null);
    setTranscript("");
    setListening(true);
    rec.start();
  }, [sentenceEn, onComplete]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  if (!supported) {
    return (
      <div style={{ padding: 14, background: "var(--surface)", borderRadius: 12, fontSize: "0.85rem", color: "var(--text-muted)" }}>
        🎙️ Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói. Hãy thử trên Chrome.
      </div>
    );
  }

  return (
    <div style={{ padding: 16, background: "var(--surface)", borderRadius: 12, border: "1.5px solid var(--border)" }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{sentenceEn}</div>
      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 12 }}>{sentenceVi}</div>
      <button
        onClick={listening ? stop : start}
        style={{
          padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer",
          background: listening ? "#F44336" : "var(--primary)", color: "white", fontWeight: 700,
          fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 8,
        }}
      >
        {listening ? "⏹ Dừng ghi âm" : "🎙️ Bắt đầu nói"}
      </button>
      {transcript && (
        <div style={{ marginTop: 12, fontSize: "0.88rem" }}>
          <div style={{ color: "var(--text-muted)" }}>Bạn đã nói: <strong style={{ color: "var(--text)" }}>{transcript}</strong></div>
          {score != null && (
            <div style={{ marginTop: 6, fontWeight: 800, color: score >= 70 ? "var(--secondary)" : "var(--accent)" }}>
              Điểm phát âm: {score}/100 {score >= 80 ? "🌟" : score >= 50 ? "👍" : "💪 Cố lên!"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
