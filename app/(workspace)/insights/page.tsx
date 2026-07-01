import Link from "next/link";

/**
 * 콘텐츠 성과 · 인스타 인사이트 — 와이어프레임 view-insights.
 * 계정 지표 + 게시물 지표 테이블 + DM 자체 카운트. 04:00 갱신 표기.
 * 더미값(1차 초안). 추후 channel_insights_daily / post_insights 로 교체.
 */
export default function InsightsPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>인스타 인사이트</h1>
          <div style={{ marginTop: 6, fontSize: 13, color: "var(--ink3)" }}>
            업데이트 2026.09.10 04:00:00{" "}
            <button className="btn ghost sm">↻ 새로고침</button>
          </div>
        </div>
      </div>

      <div className="card-title" style={{ marginBottom: 12 }}>
        계정 지표
      </div>
      <div className="ins-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 8 }}>
        <div className="stat-card">
          <div className="k">총 팔로워</div>
          <div className="v">248</div>
        </div>
        <div className="stat-card">
          <div className="k">주간 순증</div>
          <div className="v">+31</div>
        </div>
        <div className="stat-card" style={{ opacity: 0.6 }}>
          <div className="k">팔로워 유입</div>
          <div className="v" style={{ fontSize: 18 }}>
            🔒 100명부터
          </div>
        </div>
        <div className="stat-card" style={{ opacity: 0.6 }}>
          <div className="k">팔로워 이탈</div>
          <div className="v" style={{ fontSize: 18 }}>
            🔒 100명부터
          </div>
        </div>
      </div>

      <div className="card-title" style={{ margin: "8px 0 12px" }}>
        게시물 지표 (발행 이후 누적)
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>게시물</th>
              <th>조회</th>
              <th>도달</th>
              <th>저장</th>
              <th>공유</th>
              <th>좋아요</th>
              <th>댓글</th>
              <th>프로필 방문</th>
              <th>기여 팔로우</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <b>라떼아트 비하인드</b>
              </td>
              <td>3,210</td>
              <td>2,480</td>
              <td>142</td>
              <td>38</td>
              <td>196</td>
              <td>24</td>
              <td>88</td>
              <td>+12</td>
            </tr>
            <tr>
              <td>
                <b>시그니처 3종</b>
              </td>
              <td>2,640</td>
              <td>1,920</td>
              <td>98</td>
              <td>21</td>
              <td>154</td>
              <td>17</td>
              <td>61</td>
              <td>+7</td>
            </tr>
            <tr>
              <td>
                <b>오픈 1주년 안내</b>
              </td>
              <td>1,880</td>
              <td>1,510</td>
              <td>54</td>
              <td>12</td>
              <td>121</td>
              <td>9</td>
              <td>43</td>
              <td>+4</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, color: "var(--ink3)" }}>DM 리드마그넷 발송 (자체 카운트)</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>32건</div>
        </div>
        <Link href="/automation" className="btn line sm">
          자동화 설정
        </Link>
      </div>
    </>
  );
}
