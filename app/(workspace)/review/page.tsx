"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";

/**
 * AI 콘텐츠 · 최종 검수·업로드 — 발행 전 검수 게이트(휴먼인더루프).
 * 4단계 판정(🟢 통과 / 🟡 검토 / 🔴 경고 / ⚫ 차단) · 필수통과 2 + 품질 5축 · 확인 항목(플래그).
 * 지금은 와이어프레임(더미 상태). 추후 deck.review(축·플래그·판정)에 바인딩.
 * 상단 상태 토글은 미리보기용 — 실데이터 연결 시 제거.
 */

type Status = "ok" | "warn" | "fail";
type VKey = "green" | "yellow" | "red" | "black";

const C = {
  pass: "#2E9E5B",
  passBg: "#E7F7EC",
  yellow: "#B98900",
  yellowBg: "#FCF4D6",
  red: "#C0392B",
  redBg: "#FBE9E7",
  grayBg: "#ECECEC",
  border2: "#BFBFBF",
};

const AXIS_SYM: Record<Status, string> = { ok: "✓", warn: "!", fail: "✕" };
const AXIS_BG: Record<Status, string> = { ok: C.pass, warn: C.yellow, fail: C.red };

type Flag = { title: string; loc: string; txt: string; why: string; fix: string; color: string };

type State = {
  icon: string;
  label: string;
  risk: string;
  sub: string;
  bg: string;
  border: string;
  reg: [Status, string];
  comp: [Status, string];
  flag: Flag | null;
  consent: boolean;
  legal: boolean;
  pub: { mode: "enabled" | "consent" | "blocked"; label: string; hint: string };
};

const STATES: Record<VKey, State> = {
  green: {
    icon: "🟢",
    label: "통과 가능",
    risk: "없음",
    sub: "모든 항목을 충족했어요 — 바로 발행할 수 있어요.",
    bg: C.passBg,
    border: "#BFE6CC",
    reg: ["ok", "규제 위반이 없어요"],
    comp: ["ok", ""],
    flag: null,
    consent: false,
    legal: false,
    pub: { mode: "enabled", label: "승인하고 업로드", hint: "승인 시 예약 시간에 자동 발행돼요." },
  },
  yellow: {
    icon: "🟡",
    label: "검토 권장",
    risk: "낮음",
    sub: "필수 항목은 모두 충족됐어요 — 발행 가능. 아래 1건만 확인해 주세요.",
    bg: C.yellowBg,
    border: "#EAD9A0",
    reg: ["ok", "규제 위반이 없어요"],
    comp: ["warn", "본문이 다소 추상적이에요"],
    flag: {
      title: "⚑ 확인 1건",
      loc: "[슬라이드 3 · 완전성]",
      txt: "\"맛있어요, 꼭 드셔보세요\"",
      why: "내용이 짧고 추상적이에요. 구체적인 맛·특징이 있으면 더 좋아요.",
      fix: "고소한 헤이즐넛 풍미가 특징이에요",
      color: C.yellow,
    },
    consent: false,
    legal: false,
    pub: { mode: "enabled", label: "승인하고 업로드", hint: "확인 후 승인하면 예약 시간에 발행돼요." },
  },
  red: {
    icon: "🔴",
    label: "경고",
    risk: "높음",
    sub: "규제에 저촉될 수 있는 표현이 있어요. 수정을 권장하지만, 발행 여부는 회원님이 정할 수 있어요.",
    bg: C.redBg,
    border: "#F0C9C3",
    reg: ["warn", "근거 없는 우위 표현이 있어요"],
    comp: ["ok", ""],
    flag: {
      title: "🔴 경고 1건",
      loc: "[슬라이드 2 · 규제]",
      txt: "\"여기보다 싼 곳, 절대 없어요\"",
      why: "근거 없는 최저가 단정은 표시광고법에 저촉될 수 있어요.",
      fix: "합리적인 가격대로 즐기실 수 있어요",
      color: C.red,
    },
    consent: true,
    legal: false,
    pub: { mode: "consent", label: "승인하고 업로드", hint: "책임 동의 후 발행할 수 있어요." },
  },
  black: {
    icon: "⚫",
    label: "차단",
    risk: "위반",
    sub: "법령에 저촉될 수 있어 발행할 수 없어요. 회원님 계정을 지키기 위한 조치예요 — 아래를 수정해 주세요.",
    bg: C.grayBg,
    border: "var(--border)",
    reg: ["fail", "효과를 단정한 표현이 있어요"],
    comp: ["ok", ""],
    flag: {
      title: "⚫ 발행 불가 1건",
      loc: "[슬라이드 2 · 규제]",
      txt: "\"이 음료 마시면 무조건 살 빠져요\"",
      why: "효능·효과 단정은 발행할 수 없어요 (의료법·표시광고법).",
      fix: "가볍게 즐기기 좋은 가을 음료예요",
      color: C.red,
    },
    consent: false,
    legal: true,
    pub: { mode: "blocked", label: "⚫ 발행 불가 (법령 위반)", hint: "법적 위반 항목을 수정해야 발행할 수 있어요." },
  },
};

const DEMO: { key: VKey; label: string }[] = [
  { key: "green", label: "🟢 통과" },
  { key: "yellow", label: "🟡 검토" },
  { key: "red", label: "🔴 경고" },
  { key: "black", label: "⚫ 차단" },
];

function Axis({ status, name, required, desc }: { status: Status; name: string; required?: boolean; desc?: string }) {
  const descColor = status === "warn" ? C.yellow : status === "fail" ? C.red : "var(--ink3)";
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--bg3)", fontSize: 14 }}>
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 800,
          color: "#fff",
          background: AXIS_BG[status],
          marginTop: 1,
        }}
      >
        {AXIS_SYM[status]}
      </span>
      <div>
        <div style={{ fontWeight: 600 }}>
          {name}
          {required && <span style={{ fontSize: 11, color: "var(--ink3)", marginLeft: 5 }}>필수</span>}
        </div>
        {desc && <div style={{ fontSize: 12, color: descColor, marginTop: 1, fontWeight: status === "ok" ? 400 : 600 }}>{desc}</div>}
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const [verdict, setVerdict] = useState<VKey>("yellow");
  const [consent, setConsent] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const s = STATES[verdict];

  const pubDisabled = s.pub.mode === "blocked" || (s.pub.mode === "consent" && !consent);
  const select = (k: VKey) => {
    setVerdict(k);
    setConsent(false);
    setLegalOpen(false);
  };

  const sect: CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: ".04em",
    color: "var(--ink3)",
    textTransform: "uppercase",
    marginBottom: 4,
  };
  const flagBg = verdict === "black" ? C.grayBg : verdict === "red" ? C.redBg : C.yellowBg;
  const flagBorder = verdict === "black" ? C.border2 : s.flag?.color ?? "var(--border)";

  return (
    <>
      <div className="page-head">
        <div>
          <h1>최종 검수·업로드</h1>
          <p>작업 중 · 가을 신메뉴 소개 · 카드뉴스 5장 · 업로드 전 마지막 확인이에요.</p>
        </div>
      </div>

      {/* 미리보기용 상태 토글 (실데이터 연결 시 제거) */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          background: "#fff",
          border: "1px dashed var(--border2)",
          borderRadius: "var(--radius)",
          padding: "10px 14px",
          marginBottom: 16,
          fontSize: 13,
        }}
      >
        <span style={{ color: "var(--ink3)", fontWeight: 700 }}>DEMO</span> 판정 전환 →
        {DEMO.map((d) => (
          <button
            key={d.key}
            onClick={() => select(d.key)}
            className="btn"
            style={{
              padding: "6px 13px",
              fontSize: 13,
              background: verdict === d.key ? "var(--grad)" : "#fff",
              color: verdict === d.key ? "#fff" : "var(--ink2)",
              borderColor: verdict === d.key ? "var(--grad)" : "var(--border2)",
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="editor" style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 20, alignItems: "start" }}>
        {/* 미리보기 */}
        <div className="ed-preview">
          <span className="ai-badge">✦ AI 생성물 (편집됨)</span>
          <div
            className="slide"
            style={{
              background: "#fff",
              border: `1px solid ${s.flag ? s.flag.color : "var(--border)"}`,
              borderRadius: "var(--radius-lg)",
              padding: 24,
              marginTop: 12,
              textAlign: "center",
              boxShadow: s.flag ? `0 0 0 3px ${s.bg}` : "none",
            }}
          >
            <div className="s-cover" style={{ height: 180, background: "var(--grad)", borderRadius: 8, marginBottom: 16 }} />
            <b>가을, 새로 나왔어요</b>
            <p style={{ color: "var(--ink2)", fontSize: 14 }}>이번 가을 신메뉴 3종을 소개합니다</p>
          </div>
          <div className="thumbs" style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {["1", "2", "3", "4", "5"].map((n, i) => (
              <span
                key={n}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 7,
                  border: "1px solid var(--border2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  background: i === 0 ? "var(--accent-soft)" : "#fff",
                }}
              >
                {n}
              </span>
            ))}
          </div>
        </div>

        {/* 검수 결과 */}
        <div>
          {/* 종합 판정 */}
          <div style={{ borderRadius: "var(--radius-lg)", padding: "16px 18px", marginBottom: 14, border: `1px solid ${s.border}`, background: s.bg }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 17, fontWeight: 800 }}>
              <span>{s.icon}</span>
              <span>{s.label}</span>
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "var(--ink2)" }}>위험도 {s.risk}</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink2)", marginTop: 7 }}>{s.sub}</div>
          </div>

          {/* 확인 항목(플래그) — 맨 위 */}
          <div className="card" style={{ marginBottom: 14, border: `1px solid ${s.flag ? flagBorder : "var(--border)"}`, background: s.flag ? flagBg : "#fff" }}>
            {s.flag ? (
              <>
                <div className="card-title">{s.flag.title}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.flag.color, fontFamily: "monospace" }}>{s.flag.loc}</div>
                <div style={{ fontSize: 14, fontWeight: 600, margin: "4px 0" }}>{s.flag.txt}</div>
                <div style={{ fontSize: 13, color: "var(--ink2)" }}>{s.flag.why}</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>
                  수정 제안: <b>{s.flag.fix}</b>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button className="btn" style={{ fontSize: 12, padding: "7px 11px" }}>✏ 직접 수정</button>
                  <button className="btn" style={{ fontSize: 12, padding: "7px 11px" }}>🔄 이 슬라이드 재생성</button>
                </div>
              </>
            ) : (
              <>
                <div className="card-title">⚑ 확인할 항목 없음</div>
                <div style={{ fontSize: 13, color: "var(--ink3)", textAlign: "center", padding: "6px 0" }}>모든 점검을 통과했어요 ✅</div>
              </>
            )}
          </div>

          {/* 법적 근거 토글 (⚫ 차단) — 발행불가 박스 바로 아래 */}
          {s.legal && (
            <div style={{ border: "1px solid var(--border)", background: "#fff", borderRadius: "var(--radius)", padding: "12px 14px", marginBottom: 14, fontSize: 12 }}>
              <div onClick={() => setLegalOpen((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, cursor: "pointer" }}>
                ⚖️ 왜 차단됐나요? 법적 근거 보기 <span style={{ marginLeft: "auto", color: "var(--ink3)" }}>{legalOpen ? "▲" : "▼"}</span>
              </div>
              {legalOpen && (
                <div style={{ color: "var(--ink2)", fontSize: 12, lineHeight: 1.7, marginTop: 9 }}>
                  이 콘텐츠는 아래 법령에 저촉될 수 있어 발행이 제한돼요.
                  <br />· <b>표시·광고의 공정화에 관한 법률</b> — 거짓·과장 광고 금지
                  <br />· <b>의료법 / 건강기능식품법</b> — 효능·효과 단정 금지
                  <br />또한 인스타그램 정책상 계정이 제재될 수 있어, <b>계정 보호</b>를 위해 차단해요.
                </div>
              )}
            </div>
          )}

          {/* 필수 통과 */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={sect}>🔒 필수 통과</div>
            <Axis status="ok" name="사실 정확성" required desc="메뉴·가격을 지어내지 않았어요" />
            <Axis status={s.reg[0]} name="규제 안전성" required desc={s.reg[1]} />
          </div>

          {/* 품질 점검 */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={sect}>📊 품질 점검</div>
            <Axis status="ok" name="톤·브랜드" />
            <Axis status="ok" name="요청 준수" />
            <Axis status={s.comp[0]} name="완전성" desc={s.comp[1] || undefined} />
            <Axis status="ok" name="형식" />
            <Axis status="ok" name="사용자 경험" />
          </div>

          {/* 책임 동의 (🔴 경고) */}
          {s.consent && (
            <div className="card" style={{ marginBottom: 14, border: `1px solid ${C.red}`, background: C.redBg }}>
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, cursor: "pointer", lineHeight: 1.5 }}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0, accentColor: C.red }}
                />
                <span>
                  <b>⚠️ 안내된 위험을 확인했어요.</b> 그대로 발행해 발생하는 문제의 책임이 <b>회원 본인</b>에게 있음에 동의합니다.
                </span>
              </label>
            </div>
          )}

          {/* 발행 설정 */}
          <div className="card">
            <div style={sect}>발행 설정</div>
            <div className="field">
              <label>발행 방식</label>
              <div className="seg">
                <button className="on">예약 발행</button>
                <button>지금 발행</button>
              </div>
            </div>
            <div className="field">
              <label>예약 일시</label>
              <input className="inp" defaultValue="2026-09-12  09:00" />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button className="btn line block">거절</button>
              {pubDisabled ? (
                <button className="btn primary block" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                  {s.pub.label}
                </button>
              ) : (
                <Link href="/kanban" className="btn primary block" style={{ textAlign: "center" }}>
                  {s.pub.label}
                </Link>
              )}
            </div>
            <p className="hint" style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "var(--ink3)" }}>
              {s.pub.hint}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
