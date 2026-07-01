import Link from "next/link";

/** 홍보 사이트 공통 푸터. */
export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "40px 0", marginTop: 32 }}>
      <div
        className="wrap"
        style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, fontSize: 13, color: "var(--ink3)" }}
      >
        <div>
          <span className="logo" style={{ fontSize: 16 }}>
            <span className="mark">K</span>KUP
          </span>
          <span style={{ marginLeft: 10 }}>AI 인스타 카드뉴스 · 베타</span>
        </div>
        <nav style={{ display: "flex", gap: 16 }}>
          <Link href="/pricing">요금제</Link>
          <Link href="/contact">문의</Link>
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">이용약관</Link>
        </nav>
      </div>
    </footer>
  );
}
