import Link from "next/link";

/**
 * 내 워크스페이스 · 계정 (허브) — 와이어프레임 view-hub.
 * 멀티계정 카드에서 워크스페이스로 진입 + 연동 추가·관리.
 * 더미 계정(1차 초안). 추후 channels 목록으로 교체.
 */
const ACCOUNTS = [
  { handle: "@my_cafe_daily", desc: "홈카페 · 데일리 감성 · 연동됨", followers: 248, weekly: 5, growth: "+31", on: true },
  { handle: "@cafe_dessert", desc: "디저트 · 신메뉴 위주 · 연동됨", followers: 96, weekly: 2, growth: "+8", on: false },
];

export default function HubPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>내 워크스페이스 · 계정</h1>
          <p>계정을 골라 워크스페이스로 들어가고, 여기서 연동을 추가·관리해요.</p>
        </div>
      </div>

      <div className="hub-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {ACCOUNTS.map((a) => (
          <div key={a.handle} className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--grad)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <b>{a.handle}</b>
                <span style={{ display: "block", fontSize: 12, color: "var(--ink3)" }}>{a.desc}</span>
              </div>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: a.on ? "var(--accent)" : "var(--border2)" }} />
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              {[
                [a.followers, "팔로워"],
                [a.weekly, "이번 주 발행"],
                [a.growth, "주간 순증"],
              ].map(([v, k]) => (
                <div key={k} style={{ flex: 1, background: "var(--bg2)", borderRadius: "var(--radius)", padding: "10px 12px" }}>
                  <b style={{ fontSize: 18 }}>{v}</b>
                  <span style={{ display: "block", fontSize: 12, color: "var(--ink3)" }}>{k}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href="/dashboard" className="btn primary sm">
                워크스페이스 열기
              </Link>
              <button className="btn line sm">계정 관리</button>
            </div>
          </div>
        ))}
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-deep)", fontWeight: 600, border: "1px dashed var(--border2)", minHeight: 180 }}>
          ＋ 새 인스타그램 계정 연동
        </div>
      </div>

      <div className="safe-note" style={{ marginTop: 20, fontSize: 13, color: "var(--ink2)", background: "var(--bg2)", borderRadius: "var(--radius-lg)", padding: 16 }}>
        🔒 인스타그램 공식 연동(OAuth)을 사용해요. KUP는 비밀번호를 보관하지 않으며, 권한은 콘텐츠 발행·인사이트 조회에만 쓰입니다.
      </div>
    </>
  );
}
