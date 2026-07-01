import Link from "next/link";

/**
 * 홈(대시보드) — 와이어프레임 view-dashboard.
 * 주간 현황 스탯 + 콘텐츠 흐름 + 최근 콘텐츠 + 빠른 시작.
 * 데이터는 와이어프레임 더미값(1차 초안). 추후 실제 decks/insights 로 교체.
 */
export default function DashboardPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>안녕하세요, 로미님 👋</h1>
          <p>이번 주 콘텐츠 현황이에요.</p>
        </div>
        <div className="acts">
          <Link href="/plan" className="btn line">
            새 기획
          </Link>
          <Link href="/create" className="btn primary">
            카드뉴스 만들기
          </Link>
        </div>
      </div>

      <div className="grid-stats">
        <div className="stat-card">
          <div className="k">총 팔로워</div>
          <div className="v">248</div>
          <div className="d">주간 +31</div>
        </div>
        <div className="stat-card">
          <div className="k">이번 주 발행</div>
          <div className="v">5</div>
          <div className="d">지난주 +2</div>
        </div>
        <div className="stat-card">
          <div className="k">예약 대기</div>
          <div className="v">1</div>
          <div className="d" style={{ color: "var(--ink3)" }}>
            9/12 발행 예정
          </div>
        </div>
        <div className="stat-card">
          <div className="k">DM 발송</div>
          <div className="v">
            32<span style={{ fontSize: 14, color: "var(--ink3)" }}>/100</span>
          </div>
          <div className="d" style={{ color: "var(--ink3)" }}>
            베이직 한도
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="card-title">이번 주 콘텐츠 흐름</div>
          <div className="flow">
            <div className="flow-step">
              <span className="fs-n">3</span>기획
            </div>
            <span className="flow-arrow">→</span>
            <div className="flow-step">
              <span className="fs-n">2</span>제작
            </div>
            <span className="flow-arrow">→</span>
            <div className="flow-step">
              <span className="fs-n">1</span>검수
            </div>
            <span className="flow-arrow">→</span>
            <div className="flow-step on">
              <span className="fs-n">5</span>발행
            </div>
          </div>
          <div className="card-title" style={{ marginTop: 8 }}>
            최근 콘텐츠{" "}
            <Link href="/kanban" className="more">
              전체 보기
            </Link>
          </div>
          <div className="crow">
            <div className="thumb" />
            <div className="body">
              <b>가을 신메뉴 카드뉴스</b>
              <span>AI 초안 · 제작 중</span>
            </div>
            <span className="status-pill sp-make">제작 중</span>
          </div>
          <div className="crow">
            <div className="thumb" />
            <div className="body">
              <b>원두 보관 꿀팁 3가지</b>
              <span>검수 대기</span>
            </div>
            <span className="status-pill sp-review">검수</span>
          </div>
          <div className="crow">
            <div className="thumb" />
            <div className="body">
              <b>주말 한정 디저트</b>
              <span>9/12 09:00 예약</span>
            </div>
            <span className="status-pill sp-ready">예약</span>
          </div>
          <div className="crow">
            <div className="thumb" />
            <div className="body">
              <b>라떼아트 비하인드</b>
              <span>9/8 발행됨</span>
            </div>
            <span className="status-pill sp-done">완료</span>
          </div>
        </div>

        <div className="card">
          <div className="card-title">빠른 시작</div>
          <div className="qa">
            <Link href="/plan" className="qa-btn">
              <span className="ic">≣</span>AI로 콘텐츠 기획하기
            </Link>
            <Link href="/create" className="qa-btn">
              <span className="ic">✦</span>카드뉴스 제작하기
            </Link>
            <Link href="/insights" className="qa-btn">
              <span className="ic">↗</span>이번 주 성과 보기
            </Link>
          </div>
          <div className="card-title" style={{ marginTop: 22 }}>
            이번 주 현황
          </div>
          <div className="wkstat">
            <div className="wk-row" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
              <span style={{ color: "var(--ink2)" }}>제작 중</span>
              <span style={{ fontWeight: 700 }}>2건</span>
            </div>
            <div className="wk-row" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
              <span style={{ color: "var(--ink2)" }}>검수 대기</span>
              <span style={{ fontWeight: 700 }}>1건</span>
            </div>
            <div className="wk-row" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
              <span style={{ color: "var(--ink2)" }}>예약 발행</span>
              <span style={{ fontWeight: 700 }}>1건</span>
            </div>
            <div className="wk-row" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14 }}>
              <span style={{ color: "var(--ink2)" }}>이번 주 발행 완료</span>
              <span style={{ fontWeight: 700 }}>3건</span>
            </div>
          </div>
          <div className="wk-next" style={{ marginTop: 14, fontSize: 13, color: "var(--ink2)" }}>
            <span style={{ fontWeight: 700 }}>다음 예약</span> 9/12 09:00 · 주말 한정 디저트
          </div>
        </div>
      </div>
    </>
  );
}
