"use client";

import { useState } from "react";

/**
 * DM 리드마그넷 — 와이어프레임 view-automation.
 * 목록(한도+트리거) ↔ 트리거 추가 폼 전환. 더미값(1차 초안).
 * 추후 lead_magnets / dm_logs 연결, leadKeyword 는 deck 과 매칭.
 */
export default function AutomationPage() {
  const [setup, setSetup] = useState(false);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>DM 리드마그넷</h1>
          <p>게시물에 키워드를 걸어, 댓글 단 사람에게 자료를 자동 DM으로 보내요.</p>
        </div>
        <div className="acts">
          {!setup && (
            <button className="btn primary" onClick={() => setSetup(true)}>
              ＋ 트리거 추가
            </button>
          )}
        </div>
      </div>

      {!setup ? (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">이번 달 DM 발송 한도</div>
            <div className="usage" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <b style={{ fontSize: 20 }}>32</b>
              <div style={{ flex: 1, height: 8, background: "var(--bg3)", borderRadius: 999 }}>
                <i style={{ display: "block", height: "100%", width: "32%", background: "var(--accent)", borderRadius: 999 }} />
              </div>
              <span style={{ color: "var(--ink3)" }}>/ 100건 (베이직)</span>
            </div>
            <p className="hint" style={{ marginTop: 8, fontSize: 13, color: "var(--ink3)" }}>
              프로 1,000건 · 프리미엄 무제한. 한도는 매월 1일 초기화돼요.
            </p>
          </div>

          {[
            { kw: "레시피", title: "가을 음료 레시피 정리본", post: "📷 가을 신메뉴 카드뉴스 · 댓글 1개+ → DM", sent: 18, on: true },
            { kw: "쿠폰", title: "신규 방문 쿠폰", post: "📷 오픈 1주년 안내 · 댓글 1개+ → DM", sent: 14, on: false },
          ].map((r) => (
            <div key={r.kw} className="auto-row" style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "14px 16px", marginBottom: 10 }}>
              <span className="chip">{r.kw}</span>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 14 }}>{r.title}</b>
                <div style={{ fontSize: 12, color: "var(--ink3)" }}>{r.post}</div>
              </div>
              <span style={{ fontSize: 12, color: "var(--ink3)" }}>발송 {r.sent}</span>
              <span className={`toggle-sw${r.on ? "" : " off"}`} />
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-title">
            트리거 추가 <span className="more">게시물 하나에 키워드를 연결해요</span>
          </div>
          <div className="field">
            <label>① 대상 게시물 선택</label>
            <div className="post-pick" style={{ display: "flex", gap: 10 }}>
              {[
                { name: "가을 신메뉴 카드뉴스", date: "9/8 발행", checked: true },
                { name: "라떼아트 비하인드", date: "9/5 발행", checked: false },
                { name: "시그니처 3종", date: "9/1 발행", checked: false },
              ].map((p) => (
                <label key={p.name} className="post-opt" style={{ flex: 1, border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 10, display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                  <input type="radio" name="post" defaultChecked={p.checked} />
                  <span style={{ width: 32, height: 32, borderRadius: 6, background: "var(--grad)" }} />
                  <span style={{ fontSize: 12 }}>
                    {p.name}
                    <br />
                    <em style={{ color: "var(--ink3)" }}>{p.date}</em>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label>② 트리거 키워드</label>
              <input className="inp" placeholder="예) 레시피" />
            </div>
            <div className="field">
              <label>③ 보낼 자료 (링크)</label>
              <input className="inp" placeholder="drive.kup/recipe" />
            </div>
          </div>
          <div className="field">
            <label>④ 자동 응답 DM 문구</label>
            <textarea className="inp" rows={2} defaultValue="안녕하세요! 요청하신 자료 보내드려요 🙌 [링크]" />
          </div>
          <div className="dm-preview" style={{ background: "var(--bg2)", borderRadius: "var(--radius-lg)", padding: 14, marginTop: 4 }}>
            <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 6 }}>DM 미리보기</div>
            <div style={{ background: "var(--accent-soft)", borderRadius: 12, padding: "10px 14px", fontSize: 14, display: "inline-block" }}>
              안녕하세요! 요청하신 자료 보내드려요 🙌 drive.kup/recipe
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
            <button className="btn line" onClick={() => setSetup(false)}>
              취소
            </button>
            <button className="btn primary" onClick={() => setSetup(false)}>
              트리거 저장
            </button>
          </div>
        </div>
      )}
    </>
  );
}
