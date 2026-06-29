"use client";

import { useState } from "react";
import { AuthButton } from "../_components/auth-modal";

/** 요금제 플랜 + 월/연 토글 (와이어프레임 setBilling). 연 결제 -30%. */
const PLANS = [
  { name: "베이직", m: "₩0", y: "₩0", desc: "개인이 가볍게 시작", featured: false, cta: "무료로 시작", href: "/login", feats: ["인스타 계정 1개 연동", "AI 기획·제작 기본", "DM 리드마그넷 100건", "기본 성과 요약"] },
  { name: "프로", m: "₩9,900", y: "₩6,930", desc: "꾸준히 성장하는 운영자", featured: true, cta: "프로 선택하기", href: "/login", feats: ["인스타 계정 3개 연동", "AI 제작 무제한", "DM 리드마그넷 1,000건", "콘텐츠 성과 분석", "예약 발행"] },
  { name: "프리미엄", m: "₩19,900", y: "₩13,930", desc: "제한 없이 운영", featured: false, cta: "프리미엄 선택하기", href: "/login", feats: ["계정 무제한 연동", "DM 리드마그넷 무제한", "전체 성과·성장 플랜", "우선 고객 지원"] },
];

/** 세그먼트 토글 버튼 스타일 (활성=흰 배경+그림자). #ws .seg 가 마케팅엔 안 먹어 인라인으로. */
function segBtn(active: boolean): React.CSSProperties {
  return {
    border: "none",
    background: active ? "#fff" : "transparent",
    color: active ? "var(--ink)" : "var(--ink2)",
    padding: "8px 18px",
    borderRadius: 7,
    fontSize: 14,
    fontWeight: 600,
    boxShadow: active ? "0 1px 2px rgba(0,0,0,.08)" : "none",
    cursor: "pointer",
  };
}

export function PricingPlans() {
  const [billing, setBilling] = useState<"month" | "year">("month");

  return (
    <>
      <div style={{ textAlign: "center", margin: "24px 0 32px" }}>
        <div style={{ display: "inline-flex", background: "var(--bg3)", borderRadius: 9, padding: 4, gap: 2 }}>
          <button onClick={() => setBilling("month")} style={segBtn(billing === "month")}>
            월 결제
          </button>
          <button onClick={() => setBilling("year")} style={segBtn(billing === "year")}>
            연 결제 <span style={{ color: "var(--accent-deep)", fontWeight: 700 }}>-30%</span>
          </button>
        </div>
      </div>

      <div className="plans">
        {PLANS.map((p) => (
          <div key={p.name} className={`plan${p.featured ? " featured" : ""}`}>
            {p.featured && <div className="badge">가장 인기</div>}
            <div className="pname">{p.name}</div>
            <div className="price">
              {billing === "month" ? p.m : p.y}
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
            <AuthButton className={`btn ${p.featured ? "primary" : "line"} block`}>{p.cta}</AuthButton>
          </div>
        ))}
      </div>
    </>
  );
}
