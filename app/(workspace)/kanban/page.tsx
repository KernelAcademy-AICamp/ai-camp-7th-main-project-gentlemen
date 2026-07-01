/**
 * 콘텐츠 관리 · 칸반 — 와이어프레임 view-kanban.
 * 제작 중 → 제작 완료 → 예약 업로드 → 업로드 완료 (decks.status 6단계 매핑).
 * 더미 카드(1차 초안). 추후 decks 데이터 + 드래그앤드롭으로 교체.
 */
export default function KanbanPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>콘텐츠 관리 · 칸반</h1>
          <p>제작부터 발행까지 콘텐츠 상태를 한눈에 봐요.</p>
        </div>
      </div>
      <div className="kanban">
        <div className="kcol">
          <div className="kcol-head">
            제작 중 <span className="cnt">2</span>
          </div>
          <div className="kcol-body">
            <div className="kcard">
              <div className="kc-tag">카드뉴스</div>
              <b>가을 신메뉴 소개</b>
              <div className="kc-foot">
                <span>5장</span>
              </div>
            </div>
            <div className="kcard">
              <div className="kc-tag">사진첨부형</div>
              <b>원두 보관 꿀팁</b>
              <div className="kc-foot">
                <span>4장</span>
              </div>
            </div>
          </div>
        </div>
        <div className="kcol">
          <div className="kcol-head">
            제작 완료 <span className="cnt">1</span>
          </div>
          <div className="kcol-body">
            <div className="kcard">
              <div className="kc-tag">카드뉴스</div>
              <b>라떼 메뉴 정리</b>
              <div className="kc-foot">
                <span>검수 대기</span>
                <span>4장</span>
              </div>
            </div>
          </div>
        </div>
        <div className="kcol">
          <div className="kcol-head">
            예약 업로드 <span className="cnt">1</span>
          </div>
          <div className="kcol-body">
            <div className="kcard">
              <div className="kc-tag">카드뉴스</div>
              <b>주말 한정 디저트</b>
              <div className="kc-foot">
                <span style={{ color: "var(--ink2)" }}>9/12 09:00</span>
                <span>3장</span>
              </div>
            </div>
          </div>
        </div>
        <div className="kcol">
          <div className="kcol-head">
            업로드 완료 <span className="cnt">3</span>
          </div>
          <div className="kcol-body">
            <div className="kcard">
              <div className="kc-tag">카드뉴스</div>
              <b>라떼아트 비하인드</b>
              <div className="kc-foot">
                <span style={{ color: "var(--ink2)" }}>9/8 발행</span>
                <span>5장</span>
              </div>
            </div>
            <div className="kcard">
              <div className="kc-tag">사진첨부형</div>
              <b>시그니처 3종</b>
              <div className="kc-foot">
                <span style={{ color: "var(--ink2)" }}>9/5 발행</span>
                <span>3장</span>
              </div>
            </div>
            <div className="kcard">
              <div className="kc-tag">카드뉴스</div>
              <b>오픈 1주년 안내</b>
              <div className="kc-foot">
                <span style={{ color: "var(--ink2)" }}>9/1 발행</span>
                <span>4장</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
