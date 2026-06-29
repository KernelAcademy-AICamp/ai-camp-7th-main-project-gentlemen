import Link from "next/link";
import { PricingPlans } from "./_plans";

/** 요금제 — 와이어프레임 page-pricing. 월/연 토글 + 플랜 3종 + 비교표. */
const COMPARE = [
  ["인스타 계정 연동", "1개", "3개", "무제한"],
  ["AI 기획·제작", "기본", "무제한", "무제한"],
  ["DM 리드마그넷", "100건", "1,000건", "무제한"],
  ["예약 발행", "—", "✓", "✓"],
  ["콘텐츠 성과 분석", "—", "✓", "✓"],
  ["우선 고객 지원", "—", "—", "✓"],
];

export default function PricingPage() {
  return (
    <div className="wrap section">
      <div className="sec-head center">
        <span className="eyebrow">요금제</span>
        <h2>지금은 베타, 모두 무료</h2>
        <p className="lead">베타 기간 동안 모든 플랜을 무료로 운영합니다. 정식 출시 후 아래 요금제로 전환돼요.</p>
      </div>

      <PricingPlans />

      <div style={{ marginTop: 56 }}>
        <div className="sec-head center" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 22 }}>플랜 비교</h3>
        </div>
        <div className="tbl-wrap" style={{ maxWidth: 760, margin: "0 auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>기능</th>
                <th>베이직</th>
                <th>프로</th>
                <th>프리미엄</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row) => (
                <tr key={row[0]}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                  <td style={{ fontWeight: 700 }}>{row[2]}</td>
                  <td>{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="center" style={{ fontSize: 13, color: "var(--ink3)", marginTop: 16 }}>
          요금 관련 궁금한 점은{" "}
          <Link href="/contact" style={{ color: "var(--accent-deep)", fontWeight: 600 }}>
            문의하기
          </Link>
          에서 확인하세요.
        </p>
      </div>
    </div>
  );
}
