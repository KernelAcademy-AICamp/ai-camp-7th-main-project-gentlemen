"use client";

import { useState } from "react";

/**
 * 워크스페이스 헤더 프로필 메뉴 (와이어프레임 profModal 간소화).
 * 아바타 클릭 → 드롭다운(계정 정보 + 로그아웃). 로그아웃 시 /auth/signout → 홈("/")으로.
 * TODO: 마이페이지(A2)·요금제(A3) 항목은 해당 화면 생기면 연결.
 */
export function ProfileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button className="avatar" aria-label="프로필" onClick={() => setOpen((v) => !v)}>
        로
      </button>

      {open && (
        <>
          {/* 바깥 클릭 닫기 */}
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              width: 220,
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: 10,
              boxShadow: "0 6px 20px rgba(0,0,0,.10)",
              padding: 8,
              zIndex: 50,
            }}
          >
            <div style={{ padding: "8px 10px 12px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>로미</div>
              <div style={{ fontSize: 12, color: "var(--ink3)" }}>romi@email.com</div>
            </div>

            <div style={{ padding: "6px 10px", fontSize: 13, color: "var(--ink3)" }}>마이페이지 (준비 중)</div>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                style={{ width: "100%", textAlign: "left", padding: "9px 10px", border: "none", background: "none", fontSize: 14, color: "var(--ink)", cursor: "pointer", borderRadius: 7 }}
              >
                로그아웃
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
