"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { signInWithGoogle, signInWithPassword, signUpWithPassword } from "@/app/login/actions";

/**
 * 로그인/회원가입 모달 (화면흐름 L1/L2 — 별도 페이지가 아니라 팝업).
 * 홍보 사이트 어디서든 "로그인"·"시작하기" 누르면 이 팝업이 뜬다.
 * 내용은 /login 페이지와 동일한 서버 액션(구글·이메일)을 재사용.
 */
const INP: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--border2)",
  borderRadius: 6,
  padding: "10px 13px",
  fontSize: 14,
  background: "#fff",
};

const Ctx = createContext<{ open: () => void; close: () => void } | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Ctx.Provider value={{ open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
      {isOpen && <AuthModalOverlay onClose={() => setIsOpen(false)} />}
    </Ctx.Provider>
  );
}

export function useAuthModal() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuthModal must be used within <AuthModalProvider>");
  return c;
}

/** 모달을 여는 버튼 (Link 대신). 홍보 페이지 곳곳에서 사용. */
export function AuthButton({ className, children }: { className?: string; children: ReactNode }) {
  const { open } = useAuthModal();
  return (
    <button type="button" className={className} onClick={open}>
      {children}
    </button>
  );
}

function AuthModalOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
    >
      <div style={{ background: "#fff", borderRadius: 14, padding: 32, width: "min(94vw, 400px)", position: "relative" }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          style={{ position: "absolute", top: 14, right: 16, border: "none", background: "none", fontSize: 18, color: "var(--ink3)", cursor: "pointer" }}
        >
          ✕
        </button>

        <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: "center" }}>Kup 시작하기</h2>
        <p style={{ textAlign: "center", color: "var(--ink3)", fontSize: 14, marginTop: 6, marginBottom: 22 }}>
          구글 계정으로 1초 만에 시작하세요
        </p>

        <form action={signInWithGoogle}>
          <button type="submit" className="btn line block" style={{ gap: 8 }}>
            <span style={{ color: "#4285F4", fontWeight: 800 }}>G</span> 구글로 계속하기
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0", color: "var(--ink3)", fontSize: 12 }}>
          <span style={{ height: 1, flex: 1, background: "var(--border)" }} />또는 이메일 (개발·테스트용)
          <span style={{ height: 1, flex: 1, background: "var(--border)" }} />
        </div>

        <form style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input name="email" type="email" required placeholder="이메일" style={INP} />
          <input name="password" type="password" required minLength={6} placeholder="비밀번호 (6자 이상)" style={INP} />
          <div style={{ display: "flex", gap: 8 }}>
            <button formAction={signInWithPassword} className="btn line block">
              로그인
            </button>
            <button formAction={signUpWithPassword} className="btn primary block">
              가입
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
