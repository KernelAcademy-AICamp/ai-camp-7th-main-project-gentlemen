/**
 * 템플릿 둘러보기 — 와이어프레임 view-templates.
 * 브랜드 컬러가 자동 반영되는 카드뉴스 템플릿. (MVP 범위는 SPEC 대조 필요 — 우선 자리 확보)
 */
const TEMPLATES = [
  { name: "미니멀 화이트", meta: "심플 · 5장" },
  { name: "볼드 타이포", meta: "강조형 · 4장" },
  { name: "포토 프레임", meta: "사진형 · 6장" },
  { name: "파스텔 카드", meta: "심플 · 5장" },
  { name: "그리드 포토", meta: "사진형 · 4장" },
  { name: "하이라이트", meta: "강조형 · 3장" },
  { name: "매거진", meta: "강조형 · 6장" },
  { name: "소프트 그레이", meta: "심플 · 4장" },
];

export default function TemplatesPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>템플릿 둘러보기</h1>
          <p>브랜드 컬러가 자동 반영되는 카드뉴스 템플릿이에요.</p>
        </div>
        <div className="acts">
          <div className="seg">
            <button className="on">전체</button>
            <button>심플</button>
            <button>강조형</button>
            <button>사진형</button>
          </div>
        </div>
      </div>
      <div className="tpl-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {TEMPLATES.map((t) => (
          <div key={t.name} className="card" style={{ padding: 12 }}>
            <div className="ph" style={{ minHeight: 160 }}>
              <span className="lbl">템플릿 미리보기</span>
            </div>
            <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
              {t.name}
              <span style={{ color: "var(--ink3)", fontWeight: 400, fontSize: 12 }}>{t.meta}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
