/**
 * 콘텐츠 성과 · 팔로워 챌린지 — 와이어프레임 view-challenge.
 * 팔로워 마일스톤 + 연속 발행 + 기여 그래프(잔디). buildContribGH()를 결정적 렌더로 재현.
 * 더미값(1차 초안). 추후 challenge_logs 로 교체.
 */

const WEEKS = 52;

// 결정적 잔디 레벨(0~4) — Math.random 대신 인덱스 해시(서버/클라 동일).
function level(i: number): number {
  const h = (i * 1103515245 + 12345) & 0x7fffffff;
  const r = (h % 1000) / 1000;
  if (r < 0.45) return 0;
  if (r < 0.62) return 1;
  if (r < 0.78) return 2;
  if (r < 0.9) return 3;
  return 4;
}

// 52주 그리드 + 월 라벨(고정 기준일)
const END = new Date(2026, 8, 13);
const START = (() => {
  const s = new Date(END);
  s.setDate(END.getDate() - (WEEKS * 7 - 1));
  s.setDate(s.getDate() - s.getDay());
  return s;
})();

const COLUMNS = Array.from({ length: WEEKS }, (_, w) => {
  const ws = new Date(START);
  ws.setDate(START.getDate() + w * 7);
  return { month: ws.getMonth(), days: Array.from({ length: 7 }, (_, d) => level(w * 7 + d)) };
});

let prevMonth = -1;
const MONTH_LABELS = COLUMNS.map((c) => {
  const label = c.month !== prevMonth ? `${c.month + 1}월` : "";
  prevMonth = c.month;
  return label;
});

export default function ChallengePage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>팔로워 달성 챌린지</h1>
          <p>팔로워 100명 단위 목표를 달성하고, 업로드 꾸준함을 쌓아요.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="gami-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="card-title" style={{ margin: 0 }}>
              팔로워 마일스톤
            </div>
            <p style={{ fontSize: 14, color: "var(--ink2)", marginTop: 6 }}>
              다음 목표 <b style={{ color: "var(--accent-deep)" }}>300명</b>까지 <b>52명</b> 남았어요 🎯
            </p>
          </div>
          <div>
            <div style={{ fontSize: 34, fontWeight: 800, textAlign: "right" }}>248</div>
            <div style={{ fontSize: 12, color: "var(--ink3)", textAlign: "right" }}>현재 팔로워</div>
          </div>
        </div>
        <div className="ms-prog" style={{ margin: "18px 0" }}>
          <div style={{ height: 8, background: "var(--bg3)", borderRadius: 999 }}>
            <span style={{ display: "block", height: "100%", width: "24.8%", background: "var(--accent)", borderRadius: 999 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink3)", marginTop: 6 }}>
            <span>0</span>
            <span style={{ fontWeight: 700, color: "var(--accent-deep)" }}>300명 목표</span>
            <span>1,000명</span>
          </div>
        </div>
        <div className="ms-badges" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { n: "100", s: "달성", ic: "✓", cls: "done" },
            { n: "200", s: "달성", ic: "✓", cls: "done" },
            { n: "300", s: "진행 중", ic: "48%", cls: "now" },
            { n: "400", s: "잠김", ic: "🔒", cls: "lock" },
            { n: "500", s: "잠김", ic: "🔒", cls: "lock" },
            { n: "1,000", s: "최종", ic: "🏁", cls: "gold lock" },
          ].map((b) => (
            <div key={b.n} className={`ms-badge ${b.cls}`} style={{ textAlign: "center", flex: 1, minWidth: 80, padding: "12px 8px", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
              <div style={{ fontSize: 18 }}>{b.ic}</div>
              <b style={{ display: "block" }}>{b.n}</b>
              <span style={{ fontSize: 12, color: "var(--ink3)" }}>{b.s}</span>
            </div>
          ))}
        </div>
        <p className="hint" style={{ marginTop: 18, fontSize: 13, color: "var(--ink3)" }}>
          100명마다 새 배지를 획득해요 · 현재 <b>2개</b> 달성
        </p>
      </div>

      <div className="grid-stats" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="stat-card">
          <div className="k">현재 연속 발행</div>
          <div className="v">6일🔥</div>
        </div>
        <div className="stat-card">
          <div className="k">이번 달 발행</div>
          <div className="v">14건</div>
        </div>
        <div className="stat-card">
          <div className="k">최장 릴레이</div>
          <div className="v">11일</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">기여 그래프</div>
        <div className="gh-graph">
          <div className="gh-top" style={{ display: "flex" }}>
            {MONTH_LABELS.map((m, i) => (
              <div key={i} className="gh-m" style={{ flex: 1, fontSize: 10, color: "var(--ink3)" }}>
                {m}
              </div>
            ))}
          </div>
          <div className="gh-main" style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <div className="gh-wd" style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 9, color: "var(--ink3)" }}>
              {["", "월", "", "수", "", "금", ""].map((d, i) => (
                <span key={i} style={{ height: 11 }}>
                  {d}
                </span>
              ))}
            </div>
            <div className="gh-weeks" style={{ display: "flex", gap: 3, flex: 1 }}>
              {COLUMNS.map((c, w) => (
                <div key={w} className="gh-week" style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
                  {c.days.map((lv, d) => (
                    <div key={d} className={`gh-day${lv ? ` lv${lv}` : ""}`} style={{ aspectRatio: "1", borderRadius: 2, background: lv ? undefined : "var(--bg3)" }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="legend" style={{ marginTop: 10, fontSize: 12, color: "var(--ink3)" }}>
          1칸 = 하루 · 농도 = 발행 건수
        </div>
      </div>
    </>
  );
}
