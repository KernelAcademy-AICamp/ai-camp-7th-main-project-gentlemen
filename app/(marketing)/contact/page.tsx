import { Faq } from "./_faq";

/** 문의하기 / FAQ — 와이어프레임 page-contact. */
export default function ContactPage() {
  return (
    <div className="wrap section">
      <div className="sec-head center">
        <span className="eyebrow">문의하기</span>
        <h2>자주 묻는 질문</h2>
        <p className="lead">계정·가입·서비스 이용 관련 궁금한 점을 모았어요.</p>
      </div>

      <Faq />

      <div
        style={{ maxWidth: 720, margin: "40px auto 0", textAlign: "center", background: "var(--bg2)", borderRadius: "var(--radius-lg)", padding: 32 }}
      >
        <h3 style={{ fontSize: 18 }}>오류를 발견하셨나요?</h3>
        <p style={{ color: "var(--ink2)", margin: "8px 0 20px", fontSize: 14 }}>
          구글폼으로 접수해 주시면 빠르게 확인할게요. 접수 내역은 통계로 정리해 서비스 개선에 활용됩니다.
        </p>
        <a className="btn primary" href="https://forms.gle/example" target="_blank" rel="noopener noreferrer">
          구글폼으로 오류 접수하기 ↗
        </a>
      </div>
    </div>
  );
}
