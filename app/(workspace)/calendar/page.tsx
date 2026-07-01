/**
 * 콘텐츠 관리 · 캘린더 — 와이어프레임 view-calendar.
 * 발행 일정·임시저장을 달력으로. 와이어프레임의 buildCal()을 결정적 렌더로 재현.
 * 더미 일정(1차 초안). 추후 schedules / decks(임시저장)로 교체.
 */
const EVENTS: Record<number, { cls: string; text: string }[]> = {
  3: [{ cls: "done", text: "시그니처 3종" }],
  8: [{ cls: "done", text: "라떼아트 비하인드" }],
  12: [{ cls: "ready", text: "주말 한정 디저트" }],
  15: [{ cls: "done", text: "원두 꿀팁" }],
  22: [{ cls: "ready", text: "겨울 음료 예고" }],
};

// i = -2..30 (앞 2칸은 전월 흐림)
const CELLS = Array.from({ length: 33 }, (_, idx) => {
  const day = idx - 2;
  const dim = day < 1;
  return { day, dim, num: dim ? 30 + day : day, evs: EVENTS[day] ?? [] };
});

export default function CalendarPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>콘텐츠 관리 · 캘린더</h1>
          <p>발행 일정과 임시저장을 달력으로 관리해요.</p>
        </div>
        <div className="acts">
          <div className="seg">
            <button className="on">관련 게시물</button>
            <button>임시저장</button>
          </div>
        </div>
      </div>
      <div className="cal">
        <div className="cal-head">
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="cal-grid">
          {CELLS.map((c, i) => (
            <div key={i} className={`cal-cell${c.dim ? " dim" : ""}`}>
              <div className="num">{c.num}</div>
              {!c.dim &&
                c.evs.map((e, j) => (
                  <div key={j} className={`cal-ev ${e.cls}`}>
                    {e.text}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
