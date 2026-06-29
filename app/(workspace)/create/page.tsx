"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * AI 콘텐츠 · 제작 — 와이어프레임 view-create (카드 에디터 + 라이브 미리보기).
 * 더미 콘텐츠(1차 초안). 추후 generateDeck() 결과(deck JSON)를 로드/편집,
 * 렌더 미리보기는 lib/render 결과와 연결.
 */
const THEMES = [
  { name: "크림", sw: "#E9E9E9" },
  { name: "잉크", sw: "#2A2A2A" },
  { name: "코랄", sw: "#8a8a8a" },
  { name: "딥그린", sw: "#5f5f5f" },
  { name: "샌드", sw: "#cfcfcf" },
];

export default function CreatePage() {
  const [slide, setSlide] = useState(1);
  const [theme, setTheme] = useState(0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>카드뉴스 제작</h1>
          <p>작업 중 · 가을 신메뉴 소개 · 카드뉴스 5장</p>
        </div>
        <div className="acts">
          <span className="ai-badge">✦ AI 생성물</span>
          <button className="btn line">AI 초안 다시 생성</button>
          <Link href="/review" className="btn primary">
            검수로 보내기 →
          </Link>
        </div>
      </div>

      <div className="editor2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        <div className="ed-inputs" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="field">
              <label>제목 (저장용)</label>
              <input className="inp" defaultValue="가을 신메뉴 소개" />
            </div>
            <div className="field">
              <label>테마</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {THEMES.map((t, i) => (
                  <button
                    key={t.name}
                    onClick={() => setTheme(i)}
                    className="btn line sm"
                    style={{ fontWeight: i === theme ? 700 : 500, borderColor: i === theme ? "var(--accent)" : "var(--border2)" }}
                  >
                    <span style={{ width: 14, height: 14, borderRadius: 3, background: t.sw, display: "inline-block" }} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>브랜드 컬러</label>
              <input type="color" defaultValue="#8a8a8a" style={{ width: 48, height: 32, border: "1px solid var(--border2)", borderRadius: 6, background: "#fff" }} />
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setSlide(n)}
                  className="btn line sm"
                  style={{ width: 36, fontWeight: n === slide ? 700 : 500, borderColor: n === slide ? "var(--accent)" : "var(--border2)" }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="field">
              <label>{slide}장 헤드라인</label>
              <textarea className="inp" rows={2} defaultValue="가을, 새로 나왔어요" />
            </div>
            <div className="field" style={{ marginBottom: 8 }}>
              <label>본문</label>
              <textarea className="inp" rows={3} defaultValue="이번 가을 신메뉴 3종을 소개합니다" />
            </div>
            <p className="hint" style={{ fontSize: 12, color: "var(--ink3)" }}>
              💡 따뜻한 톤 · 큰 제목 + 시선 끄는 배경 추천
            </p>
          </div>

          <div className="card">
            <div className="field">
              <label>캡션</label>
              <textarea className="inp" rows={3} defaultValue="가을 신메뉴 3종, 지금 만나보세요 ☕ 저장해두고 방문할 때 참고하세요 🔖" />
            </div>
            <div className="field">
              <label>
                해시태그{" "}
                <span style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 400 }}>공백/쉼표로 구분</span>
              </label>
              <textarea className="inp" rows={2} defaultValue="#가을신메뉴 #홈카페 #카드뉴스 #카페추천 #신메뉴" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>CTA</label>
              <input className="inp" defaultValue="저장 유도" />
            </div>
          </div>
        </div>

        <div className="ed-live" style={{ position: "sticky", top: 80 }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--ink3)", marginBottom: 12 }}>
              <span>미리보기</span>
              <span>{slide} / 5</span>
            </div>
            <div className="slide-canvas" style={{ aspectRatio: "4 / 5", background: "var(--grad)", borderRadius: "var(--radius-lg)", padding: 24, color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.8 }}>
                <span>@my_cafe_daily</span>
                <span>{slide}/5</span>
              </div>
              <div>
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>홈카페 ✦</div>
                <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>가을, 새로 나왔어요</div>
                <div style={{ fontSize: 15, opacity: 0.9, marginTop: 10 }}>이번 가을 신메뉴 3종을 소개합니다</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, opacity: 0.8 }}>
                <span style={{ display: "flex", gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", opacity: n === slide ? 1 : 0.4 }} />
                  ))}
                </span>
                <span>넘기기 →</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
