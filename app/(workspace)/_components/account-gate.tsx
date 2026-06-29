"use client";

import { useState } from "react";
import { useAccount, type Brief } from "../_state/account";

/**
 * 계정/온보딩 게이트 — 상태에 따라 워크스페이스 진입을 막는다.
 *   disconnected → 연동 안내(ConnectGate)
 *   connected    → 온보딩 입력(OnboardingGate)
 *   ready        → 실제 화면(children)
 * "와이어프레임의 채워진 화면"은 ready 일 때만 보인다 = 실제 앱 동작.
 */
export function RequireAccount({ children }: { children: React.ReactNode }) {
  const { status } = useAccount();

  if (status === "loading") {
    return <div style={{ padding: 48, color: "var(--ink3)", fontSize: 14 }}>불러오는 중…</div>;
  }
  if (status === "disconnected") return <ConnectGate />;
  if (status === "connected") return <OnboardingGate />;
  return <>{children}</>;
}

/** 빈 상태 + 계정 연동 (와이어프레임 emptyApp). 연동은 스텁(추후 IG OAuth). */
function ConnectGate() {
  const { connect } = useAccount();
  return (
    <div className="empty-hero" style={{ maxWidth: 560, margin: "48px auto", textAlign: "center" }}>
      <div className="empty-ic" style={{ width: 64, height: 64, borderRadius: 16, background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: "var(--ink3)", margin: "0 auto 20px" }}>
        ＋
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800 }}>인스타 계정을 연동하고 시작하세요</h2>
      <p style={{ color: "var(--ink2)", marginTop: 8 }}>계정을 연동하면 AI가 기획부터 제작·발행·성과까지 도와줘요.</p>
      <button className="btn primary" style={{ marginTop: 20 }} onClick={connect}>
        인스타그램 계정 연동하기
      </button>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 28, textAlign: "left" }}>
        {[
          ["기획", "AI가 주차별 콘텐츠 추천"],
          ["제작", "카드뉴스 초안 자동 생성"],
          ["성과", "인사이트·팔로워 챌린지"],
        ].map(([b, s]) => (
          <div key={b} className="card" style={{ padding: 16 }}>
            <b>{b}</b>
            <span style={{ display: "block", fontSize: 13, color: "var(--ink3)", marginTop: 4 }}>{s}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13, color: "var(--ink3)", marginTop: 24 }}>
        🔒 공식 연동(OAuth)을 사용해요. 비밀번호는 보관하지 않아요.
        <br />
        <span style={{ fontSize: 12 }}>(지금은 데모 스텁 — 누르면 연동된 것으로 처리)</span>
      </p>
    </div>
  );
}

/** 온보딩 입력 → 컨셉 확정 (와이어프레임 브리프 입력). 입력값은 추후 channel_configs 로. */
function OnboardingGate() {
  const { completeOnboarding } = useAccount();
  const [brief, setBrief] = useState<Brief>({
    topic: "",
    target: "",
    tone: "",
    cadence: "주 2회",
    avoid: "",
  });

  const canSubmit = brief.topic.trim().length > 0 && brief.target.trim().length > 0;
  const set = (k: keyof Brief) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setBrief((b) => ({ ...b, [k]: e.target.value }));

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="page-head">
        <div>
          <h1>계정 컨셉을 잡을게요</h1>
          <p>이 정보로 AI가 모든 콘텐츠의 톤·주제를 일관되게 유지해요. (최초 1회)</p>
        </div>
      </div>
      <div className="card">
        <div className="card-title">브리프 입력</div>
        <div className="field">
          <label>계정 주제·컨셉 *</label>
          <input className="inp" value={brief.topic} onChange={set("topic")} placeholder="예) 홈카페 데일리 · 감성 사진 위주" />
        </div>
        <div className="field">
          <label>주요 타겟 *</label>
          <input className="inp" value={brief.target} onChange={set("target")} placeholder="예) 20·30 홈카페 입문자" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="field">
            <label>톤앤매너</label>
            <input className="inp" value={brief.tone} onChange={set("tone")} placeholder="예) 따뜻하고 잔잔한" />
          </div>
          <div className="field">
            <label>주 게시 횟수</label>
            <select className="inp" value={brief.cadence} onChange={set("cadence")}>
              <option>주 1회</option>
              <option>주 2회</option>
              <option>주 3회</option>
              <option>주 4회</option>
              <option>주 5회</option>
            </select>
          </div>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>피하고 싶은 주제 (선택)</label>
          <input className="inp" value={brief.avoid} onChange={set("avoid")} placeholder="예) 과도한 할인·광고 느낌" />
        </div>
        <div style={{ textAlign: "right", marginTop: 16 }}>
          <button className="btn primary" disabled={!canSubmit} onClick={() => completeOnboarding(brief)}>
            컨셉 확정하고 시작하기 →
          </button>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "var(--ink3)", marginTop: 12, textAlign: "center" }}>
        확정하면 워크스페이스로 들어가요. (입력값은 추후 컨셉 저장소 channel_configs 로 연결)
      </p>
    </div>
  );
}

/** 데모용: 연동 해제하고 흐름을 처음부터 다시 보기. (개발/시연 전용) */
export function DemoReset() {
  const { status, reset } = useAccount();
  if (status === "loading" || status === "disconnected") return null;
  return (
    <button
      onClick={reset}
      style={{ marginLeft: 10, fontSize: 11, textDecoration: "underline", background: "none", border: "none", color: "var(--ink2)", cursor: "pointer" }}
    >
      데모 초기화(연동 해제)
    </button>
  );
}
