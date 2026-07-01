import Link from "next/link";

/**
 * AI 콘텐츠 · 검수·발행 — 와이어프레임 view-review (차별화 핵심: 발행 내장 검수 게이트).
 * 미리보기 + 검수 체크리스트(ai_flags/risk) + 발행 설정(예약/지금). 승인해야 발행.
 * 더미값(1차 초안). 추후 deck의 ai_flags/risk_level 바인딩 + 고위험 하드게이트.
 */
export default function ReviewPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>최종 검수·업로드</h1>
          <p>작업 중 · 가을 신메뉴 소개 · 업로드 전 마지막 확인이에요.</p>
        </div>
      </div>
      <div className="editor" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        <div className="ed-preview">
          <span className="ai-badge">✦ AI 생성물 (편집됨)</span>
          <div className="slide" style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24, marginTop: 12, textAlign: "center" }}>
            <div className="s-cover" style={{ height: 180, background: "var(--grad)", borderRadius: 8, marginBottom: 16 }} />
            <b>가을, 새로 나왔어요</b>
            <p style={{ color: "var(--ink2)", fontSize: 14 }}>이번 가을 신메뉴 3종을 소개합니다</p>
          </div>
          <div className="thumbs" style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {["1", "2", "3", "4", "5"].map((n, i) => (
              <span
                key={n}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 7,
                  border: "1px solid var(--border2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  background: i === 0 ? "var(--accent-soft)" : "#fff",
                }}
              >
                {n}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">검수 체크리스트</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span style={{ color: "var(--accent-deep)" }}>✓</span>출처 확인 (인용·이미지 권리)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span style={{ color: "var(--accent-deep)" }}>✓</span>민감 표현(권유·강요) 점검
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span style={{ color: "var(--accent-deep)" }}>✓</span>AI 생성물 표기 누락 없음
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">발행 설정</div>
            <div className="field">
              <label>발행 방식</label>
              <div className="seg">
                <button className="on">예약 발행</button>
                <button>지금 발행</button>
              </div>
            </div>
            <div className="field">
              <label>예약 일시</label>
              <input className="inp" defaultValue="2026-09-12  09:00" />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button className="btn line block">거절</button>
              <Link href="/kanban" className="btn primary block">
                승인하고 업로드
              </Link>
            </div>
            <p className="hint" style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "var(--ink3)" }}>
              승인 시 예약 시간에 자동 발행돼요.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
