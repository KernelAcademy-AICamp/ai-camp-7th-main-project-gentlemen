"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * AI 콘텐츠 · 기획 — 와이어프레임 view-plan-list (4단계 위저드).
 * ① 브리프 → ② 계정 진단 → ③ 후보 추천 → ④ 기획 리스트.
 * 더미값(1차 초안). 추후 온보딩 설문/계정 분석/추천 생성에 연결.
 */
export default function PlanPage() {
  const [step, setStep] = useState(1);
  const STEPS = ["브리프", "계정 진단", "후보 추천", "기획 리스트"];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>AI 기획 리스트</h1>
          <p>브리프를 받아 계정을 진단하고, 주차별 후보에서 골라 기획을 채워요.</p>
        </div>
      </div>

      <div className="stepper4" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          return (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, flex: i < 3 ? 1 : "0 0 auto" }}>
              <button
                onClick={() => setStep(n)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: "none",
                  background: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  color: n === step ? "var(--accent-deep)" : "var(--ink3)",
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    background: n <= step ? "var(--grad)" : "var(--bg3)",
                    color: n <= step ? "#fff" : "var(--ink3)",
                  }}
                >
                  {n}
                </span>
                {label}
              </button>
              {i < 3 && <span style={{ flex: 1, height: 1, background: "var(--border)" }} />}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <div className="card">
          <div className="card-title">
            ① 브리프 입력 <span className="more">계정 컨셉을 잡는 단계 · 최초 1회</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label>계정 주제·컨셉</label>
              <input className="inp" defaultValue="홈카페 데일리 · 감성 사진 위주" />
            </div>
            <div className="field">
              <label>주요 타겟</label>
              <input className="inp" defaultValue="20·30 홈카페 입문자" />
            </div>
            <div className="field">
              <label>톤앤매너</label>
              <input className="inp" defaultValue="따뜻하고 잔잔한" />
            </div>
            <div className="field">
              <label>주 게시 횟수</label>
              <select className="inp" defaultValue="주 2회">
                <option>주 1회</option>
                <option>주 2회</option>
                <option>주 3회</option>
                <option>주 4회</option>
                <option>주 5회</option>
              </select>
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>피하고 싶은 주제 (선택)</label>
              <input className="inp" placeholder="예) 과도한 할인·광고 느낌" />
            </div>
          </div>
          <div style={{ textAlign: "right", marginTop: 8 }}>
            <button className="btn primary" onClick={() => setStep(2)}>
              계정 진단하기 →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <div className="card-title">
            ② 계정 진단 <span className="more">@my_cafe_daily의 기존 게시물을 분석했어요</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            {[
              ["주력 주제", "신메뉴 소개 · 라떼아트"],
              ["잘 되는 콘텐츠", "'꿀팁'류 (저장률 높음)"],
              ["약한 부분", "참여 유도(저장·댓글 CTA)"],
              ["게시 일관성", "양호 · 주 2회 적정"],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "var(--bg2)", borderRadius: "var(--radius)", padding: 14 }}>
                <span style={{ fontSize: 12, color: "var(--ink3)" }}>{k}</span>
                <b style={{ display: "block", marginTop: 4 }}>{v}</b>
              </div>
            ))}
          </div>
          <div style={{ background: "var(--accent-soft)", borderRadius: "var(--radius)", padding: 14, marginTop: 14, fontSize: 14 }}>
            일관성은 좋지만 참여 유도가 약해요. 저장률 높은 <b>꿀팁·정보형</b>을 늘리고, 게시물마다 <b>저장·댓글 유도</b>를 넣는 방향을 추천해요.
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <button className="btn line" onClick={() => setStep(1)}>
              ← 브리프 수정
            </button>
            <button className="btn primary" onClick={() => setStep(3)}>
              이 방향으로 추천받기 →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <div>
              <b>1주차 후보</b> · 주 2회 → <b>2개 선택</b>
            </div>
            <span className="more">지난주 성과·이전 게시물을 반영했어요</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            {[
              { chip: "카드뉴스", len: "5장", title: "원두 보관 꿀팁 5가지", why: "저장률 높은 꿀팁류 강화", checked: true },
              { chip: "사진첨부형", len: "4장", title: "가을 신메뉴 3종 소개", why: "주력 주제 · 신메뉴 시즌", checked: true },
              { chip: "카드뉴스", len: "3장", title: "홈카페 입문 도구", why: "타겟(입문자) 맞춤", checked: false },
              { chip: "카드뉴스", len: "6장", title: "라떼아트 비기너 가이드", why: "참여 유도(저장) 강화", checked: false },
              { chip: "사진첨부형", len: "4장", title: "주말 한정 디저트", why: "반응 좋았던 한정 메뉴", checked: false },
            ].map((r, i) => (
              <label key={i} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 14, display: "flex", gap: 10, cursor: "pointer", background: "#fff" }}>
                <input type="checkbox" defaultChecked={r.checked} />
                <div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <span className="chip">{r.chip}</span>
                    <span style={{ fontSize: 12, color: "var(--ink3)" }}>{r.len}</span>
                  </div>
                  <b>{r.title}</b>
                  <p style={{ fontSize: 12, color: "var(--ink3)", marginTop: 4 }}>왜? {r.why}</p>
                </div>
              </label>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <button className="btn line">↻ 추천 더 받기</button>
            <button className="btn primary" onClick={() => setStep(4)}>
              선택 완료 → 리스트 담기
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <div style={{ background: "var(--bg2)", borderRadius: "var(--radius)", padding: "10px 14px", marginBottom: 14, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            계정 컨셉: <b>홈카페 데일리 · 감성</b> · 주 2회
            <button className="btn ghost sm" onClick={() => setStep(1)}>
              컨셉 다시 잡기
            </button>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink2)", marginBottom: 8 }}>1주차</div>
            {[
              { chip: "카드뉴스", title: "원두 보관 꿀팁 5가지", sub: "표지 · 습도 · 햇빛 · 용기 · 마무리" },
              { chip: "사진첨부형", title: "가을 신메뉴 3종 소개", sub: "표지 · 신메뉴 3종 · 추천 조합" },
            ].map((r) => (
              <div key={r.title} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "12px 16px", marginBottom: 8 }}>
                <span className="chip">{r.chip}</span>
                <div style={{ flex: 1 }}>
                  <b>{r.title}</b>
                  <div style={{ fontSize: 12, color: "var(--ink3)" }}>{r.sub}</div>
                </div>
                <Link href="/create" className="btn primary sm">
                  제작하러 가기
                </Link>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn line" onClick={() => setStep(3)}>
              ＋ AI 추천 더 받기
            </button>
            <Link href="/create" className="btn line">
              ＋ 직접 기획 추가
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
