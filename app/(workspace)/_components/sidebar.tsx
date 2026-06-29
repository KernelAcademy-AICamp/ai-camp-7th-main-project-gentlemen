"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAccount } from "../_state/account";

/**
 * 워크스페이스 사이드바 (와이어프레임 #ws .wssidebar).
 * 홈 + 중첩 그룹(AI 콘텐츠/콘텐츠 관리/콘텐츠 성과) + DM.
 * 현재 경로(usePathname)로 활성 표시, 활성 자식이 있는 그룹은 펼친 채로 시작.
 */

type Item = { href: string; label: string };
type Group = { key: string; icon: string; label: string; items: Item[] };

const HOME: { href: string; icon: string; label: string } = { href: "/dashboard", icon: "⌂", label: "홈" };
const GROUPS: Group[] = [
  {
    key: "content",
    icon: "✦",
    label: "AI 콘텐츠",
    items: [
      { href: "/plan", label: "기획" },
      { href: "/create", label: "제작" },
      { href: "/review", label: "검수·발행" },
    ],
  },
  {
    key: "manage",
    icon: "▦",
    label: "콘텐츠 관리",
    items: [
      { href: "/kanban", label: "칸반 보기" },
      { href: "/calendar", label: "캘린더 보기" },
    ],
  },
  {
    key: "perf",
    icon: "◆",
    label: "콘텐츠 성과",
    items: [
      { href: "/insights", label: "인스타 인사이트" },
      { href: "/challenge", label: "팔로워 챌린지" },
    ],
  },
];
const AUTOMATION: { href: string; icon: string; label: string } = { href: "/automation", icon: "✉", label: "DM 리드마그넷" };

function NavGroup({ group, pathname }: { group: Group; pathname: string }) {
  const hasActive = group.items.some((i) => pathname === i.href);
  const [open, setOpen] = useState(hasActive);
  const show = open || hasActive;

  return (
    <>
      <a
        className={`nav-item nav-parent${show ? " open active" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <i>{group.icon}</i>
        {group.label}
        <span className="nav-caret" style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink3)" }}>
          ▾
        </span>
      </a>
      {show && (
        <div className="nav-sub open">
          {group.items.map((i) => (
            <Link key={i.href} href={i.href} className={`nav-item sub${pathname === i.href ? " active" : ""}`}>
              {i.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { status, handle } = useAccount();
  const connected = status === "connected" || status === "ready";

  return (
    <aside className="wssidebar">
      <div className="side-acct" style={{ marginBottom: 12 }}>
        <div
          style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", textTransform: "uppercase", padding: "4px 4px 8px" }}
        >
          연동 인스타 계정
        </div>
        <button className="acct-switch" style={{ width: "100%" }}>
          {connected ? (
            <>
              <span className="ava" />
              <span style={{ flex: 1, textAlign: "left" }}>{handle}</span>
              <span className="caret">▾</span>
            </>
          ) : (
            <span style={{ flex: 1, textAlign: "left", color: "var(--ink3)" }}>＋ 계정 연동하기</span>
          )}
        </button>
      </div>

      <nav>
        <Link href={HOME.href} className={`nav-item${pathname === HOME.href ? " active" : ""}`}>
          <i>{HOME.icon}</i>
          {HOME.label}
        </Link>
        {GROUPS.map((g) => (
          <NavGroup key={g.key} group={g} pathname={pathname} />
        ))}
        <Link href={AUTOMATION.href} className={`nav-item${pathname === AUTOMATION.href ? " active" : ""}`}>
          <i>{AUTOMATION.icon}</i>
          {AUTOMATION.label}
        </Link>
      </nav>

      <div className="side-upsell">
        <b>프로로 업그레이드</b>
        <p>계정 3개 · DM 1,000건 · 콘텐츠 성과 분석</p>
        <button className="btn primary sm block">업그레이드</button>
      </div>
    </aside>
  );
}
