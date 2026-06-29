import Link from "next/link";

/** 주요 기능 — 와이어프레임 page-features. 기능 4개 상세. */
const FEATURES = [
  { tag: "01 · 계정 연동", h: "여러 인스타 계정을 한 곳에서", ic: "🔗", lbl: "계정 연동·전환 화면", p: "운영 중인 계정이 여러 개여도 따로 로그인할 필요 없어요. KUP 안에서 계정을 전환하며 기획·제작·발행을 관리해요. 연동은 인스타 공식 OAuth로, 비밀번호는 보관하지 않아요." },
  { tag: "02 · AI 기획·제작", h: "주제만 정하면 카드뉴스 초안까지", ic: "✦", lbl: "AI 카드뉴스 제작 데모", p: "주제와 톤을 입력하면 AI가 구성과 문구를 제안하고, 템플릿과 브랜드 컬러를 반영한 카드뉴스 초안을 만들어요. 모든 결과물엔 ‘AI 생성물’이 표기되고, 편집을 거치면 해제됩니다." },
  { tag: "03 · 검수·예약 발행", h: "올리기 전, 내가 최종 확인", ic: "✓", lbl: "검수·승인·예약 발행 화면", p: "발행 전 출처와 민감 표현을 점검하고, 사용자 승인을 받아요. 승인하면 원하는 시간에 맞춰 예약 발행됩니다. 사람이 마지막을 확인하는 휴먼 인 더 루프 방식이에요." },
  { tag: "04 · 성과·성장 플랜", h: "인사이트를 보고, 다음을 제안받아요", ic: "↗", lbl: "콘텐츠 성과·인사이트 대시보드", p: "도달·저장·공유·팔로워 유입 같은 인스타 인사이트를 한눈에 모아 보고, 성과를 바탕으로 다음 콘텐츠 방향을 제안해요. 업로드 꾸준함은 기여 그래프로 시각화돼요." },
];

export default function FeaturesPage() {
  return (
    <div className="wrap section">
      <div className="sec-head center">
        <span className="eyebrow">주요 기능</span>
        <h2>기획부터 성장까지, 한 흐름으로</h2>
        <p className="lead">반복되는 일은 AI가 맡고, 중요한 결정은 항상 내가 합니다.</p>
      </div>

      {FEATURES.map((f, i) => (
        <div
          key={f.tag}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 40,
            alignItems: "center",
            margin: "48px 0",
            direction: i % 2 === 1 ? "rtl" : "ltr",
          }}
        >
          <div style={{ direction: "ltr" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: "var(--ink3)", marginBottom: 10 }}>{f.tag}</div>
            <h3 style={{ fontSize: 24, marginBottom: 10 }}>{f.h}</h3>
            <p style={{ color: "var(--ink2)" }}>{f.p}</p>
          </div>
          <div className="ph" style={{ minHeight: 200, direction: "ltr" }}>
            <span className="ic">{f.ic}</span>
            <span className="lbl">{f.lbl}</span>
          </div>
        </div>
      ))}

      <div style={{ textAlign: "center", marginTop: 48 }}>
        <Link href="/login" className="btn primary lg">
          무료로 시작하기
        </Link>
      </div>
    </div>
  );
}
