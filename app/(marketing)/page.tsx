import Link from "next/link";
import { AuthButton } from "./_components/auth-modal";

/**
 * 홍보 홈 ("/") — 와이어프레임 page-home.
 * 히어로 + 가치제안 + 작동방식 + 지표 + 요금제 미리보기 + CTA.
 * 더미 수치(베타 예시) — 추후 실제 데이터로 교체.
 */
export default function HomePage() {
  return (
    <>
      {/* 히어로 */}
      <div className="wrap hero">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">AI 인스타그램 그로스 코파일럿</span>
            <h1>
              기획부터 발행, 성과까지
              <br />한 곳에서
            </h1>
            <p className="lead">흩어진 인스타 작업을 KUP 하나로, AI 초안을 내가 다듬어 올려요.</p>
            <div className="hero-actions">
              <AuthButton className="btn primary lg">무료로 시작하기</AuthButton>
              <Link href="/features" className="btn line lg">
                주요 기능 보기
              </Link>
            </div>
            <p className="hero-note">베타 기간 무료 · 카드 등록 없이 시작</p>
          </div>
          <div className="mock" aria-label="워크스페이스 미리보기">
            <div className="mock-top">
              <div className="dot" />
              <div className="meta">
                <b>@my_cafe_daily</b>이번 주 콘텐츠 흐름
              </div>
            </div>
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
            <div className="mock-perf" style={{ marginTop: 16 }}>
              <div className="spark" style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 64 }}>
                {[34, 50, 42, 66, 58, 88].map((h, i) => (
                  <span key={i} className={i === 5 ? "hi" : ""} style={{ height: `${h}%`, flex: 1 }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 가치제안 */}
      <div className="section alt">
        <div className="wrap">
          <div className="sec-head center">
            <h2>혼자 다 하지 마세요</h2>
            <p className="lead">기획·제작·발행·분석을 한 흐름으로. 반복은 AI가, 결정은 내가.</p>
          </div>
          <div className="grid4">
            {[
              ["⌗", "여러 계정 연동", "인스타 계정 여러 개를 한 곳에서. 계정마다 따로 로그인할 필요 없어요."],
              ["✦", "AI 기획·제작", "주제만 정하면 AI가 카드뉴스 초안까지. 브랜드 컬러도 그대로 반영해요."],
              ["✓", "검수·예약 발행", "올리기 전 내가 최종 확인. 원하는 시간에 맞춰 예약 발행돼요."],
              ["↗", "성과·성장 플랜", "인스타 인사이트를 모아 보고, 다음에 뭘 올릴지 제안받아요."],
            ].map(([ic, h, p]) => (
              <div key={h} className="fcard">
                <div className="ficon">{ic}</div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 작동방식 */}
      <div className="section">
        <div className="wrap">
          <div className="sec-head center">
            <h2>이렇게 작동해요</h2>
          </div>
          <div className="steps">
            {[
              ["기획", "주제와 톤만 정하면 AI가 카드뉴스 구성과 문구를 제안해요."],
              ["제작", "템플릿·브랜드 컬러로 초안을 생성하고, 그대로 편집해요."],
              ["발행·성과", "검수 후 예약 발행, 발행 뒤 인사이트로 성과를 확인해요."],
            ].map(([h, p]) => (
              <div key={h} className="step">
                <div className="num" />
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 지표 */}
      <div className="section alt tight">
        <div className="wrap">
          <div className="stats">
            {[
              ["+12%", "평균 주간 팔로워 증가"],
              ["70%", "콘텐츠 제작 시간 단축"],
              ["12,000+", "누적 발행 콘텐츠"],
            ].map(([big, cap]) => (
              <div key={cap} className="stat">
                <div className="big">{big}</div>
                <div className="cap">{cap}</div>
              </div>
            ))}
          </div>
          <p className="center" style={{ fontSize: 12, color: "var(--ink3)", marginTop: 8 }}>
            * 베타 참여자 기준 예시 수치 (실제 데이터로 교체 예정)
          </p>
        </div>
      </div>

      {/* 요금제 미리보기 */}
      <div className="section">
        <div className="wrap">
          <div className="sec-head center">
            <h2>요금제 미리보기</h2>
            <p className="lead">베타 기간엔 모든 플랜을 무료로 써볼 수 있어요.</p>
          </div>
          <div className="plans">
            {[
              { name: "베이직", price: "₩0", desc: "가볍게 시작", feats: ["계정 1개 연동", "AI 기획·제작 기본", "DM 리드마그넷 100건"], featured: false },
              { name: "프로", price: "₩9,900", desc: "꾸준히 성장", feats: ["계정 3개 연동", "AI 제작 무제한", "DM 1,000건 · 성과 분석"], featured: true },
              { name: "프리미엄", price: "₩19,900", desc: "제한 없이", feats: ["계정 무제한", "DM 무제한", "우선 지원"], featured: false },
            ].map((p) => (
              <div key={p.name} className={`plan${p.featured ? " featured" : ""}`}>
                {p.featured && <div className="badge">추천</div>}
                <div className="pname">{p.name}</div>
                <div className="price">
                  {p.price}
                  <small>/월</small>
                </div>
                <p className="pdesc">{p.desc}</p>
                <ul>
                  {p.feats.map((f) => (
                    <li key={f}>
                      <span className="ck">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/pricing" className={`btn ${p.featured ? "primary" : "line"} block`}>
                  자세히 보기
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="section tight">
        <div className="wrap">
          <div className="ctaband" style={{ textAlign: "center", padding: "48px 24px", background: "var(--bg2)", borderRadius: "var(--radius-lg)" }}>
            <h2>오늘 첫 콘텐츠, AI랑 같이</h2>
            <p className="lead" style={{ margin: "12px auto 24px" }}>카드 등록 없이 바로 시작할 수 있어요.</p>
            <AuthButton className="btn primary lg">무료로 시작하기</AuthButton>
          </div>
        </div>
      </div>
    </>
  );
}
