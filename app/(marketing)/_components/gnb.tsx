"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthButton } from "./auth-modal";

/**
 * 홍보 사이트 GNB (와이어프레임 .gnb). 모바일 햄버거 토글.
 * 로그인/시작하기는 /login(구글·이메일)로 연결 (회원가입도 거기서).
 */
const NAV = [
  { href: "/features", label: "주요 기능" },
  { href: "/pricing", label: "요금제" },
  { href: "/contact", label: "문의하기" },
];

export function Gnb() {
  const [open, setOpen] = useState(false);

  return (
    <header className="gnb">
      <div className="gnb-inner">
        <Link href="/" className="logo">
          <span className="mark">K</span>KUP
        </Link>
        <nav className="gnb-nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="gnb-cta">
          <AuthButton className="btn ghost">로그인</AuthButton>
          <AuthButton className="btn primary">시작하기</AuthButton>
        </div>
        <button className="gnb-burger" onClick={() => setOpen((v) => !v)} aria-label="메뉴">
          ☰
        </button>
      </div>
      {open && (
        <div className="mob-menu show">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
          <AuthButton className="btn line">로그인</AuthButton>
          <AuthButton className="btn primary">시작하기</AuthButton>
        </div>
      )}
    </header>
  );
}
