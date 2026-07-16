"use client";

import Link from "next/link";
import { Plus, ChevronDown, Menu, Grid3x3, SquarePlay, UserRound, Search, House } from "lucide-react";
import { CardCanvas } from "@/components/workspace/CardCanvas";
import type { CardNews, IgAccount } from "@/lib/workspace/types";

/**
 * 인스타 프로필 폰 미리보기 — 연동된 계정의 프로필 피드를 인스타 형식 그대로, 폰 화면처럼 보여준다.
 * · 현재(테스터/미연동): 우리가 가진 데이터(핸들·팔로워 + KUP로 만든 카드들)를 인스타 그리드로 렌더.
 *   가짜 수치는 넣지 않는다 — '팔로잉'처럼 모르는 값은 "—".
 * · 정식 연동 시: /api/ig/profile 의 실데이터(profile_picture_url·media_url·followers)로 교체 예정(준실시간).
 *   실제 인스타는 라이브 스트림 API가 없어, 화면 열 때 + 주기 새로고침이 표준.
 */

const PHONE_W = 320; // 폰 콘텐츠 폭(px) — 그리드 셀 px 고정 → 카드 썸네일 스케일 계산 기준
const GRID_GAP = 1.5;
const CELL = (PHONE_W - GRID_GAP * 2) / 3; // 3열 셀 한 변(px)

// 카드 첫 장을 정사각 썸네일로 — CardCanvas(1080)를 CELL 크기로 축소. 최근 콘텐츠 미니 미리보기와 공용.
export function CardThumb({ card, handle, size = CELL }: { card: CardNews; handle: string; size?: number }) {
  const page = card.pages[0];
  if (!page) return <div style={{ width: size, height: size, background: card.brandColor || "var(--tds-brand-100)" }} />;
  return (
    <div style={{ width: size, height: size, position: "relative", overflow: "hidden", background: "#fff" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1080, transform: `scale(${size / 1080})`, transformOrigin: "top left" }}>
        <CardCanvas page={page} index={0} total={card.pages.length} themeKey={card.theme} niche="" handle={handle} brandColor={card.brandColor} ratio="1:1" />
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="text-center leading-tight">
      <div className="text-[13px] font-bold text-neutral-900">{n}</div>
      <div className="text-[11px] text-neutral-600">{label}</div>
    </div>
  );
}

export function IgProfilePreview({
  handle,
  displayName,
  bio,
  followers,
  cards,
  connected,
}: {
  handle: string;
  displayName: string;
  bio: string;
  followers: number;
  cards: CardNews[];
  connected: boolean;
  account?: IgAccount;
}) {
  const posts = cards.length;
  // 게시물 그리드 — KUP로 만든 카드 첫 장. 9칸을 채우되 부족하면 은은한 자리로.
  const gridCards = cards.slice(0, 12);
  const fillers = Math.max(0, 9 - gridCards.length);

  return (
    <div className="flex flex-col items-center">
      {/* 폰 프레임 */}
      <div className="rounded-[42px] bg-neutral-900 p-2.5 shadow-[0_30px_60px_-30px_rgba(0,0,0,.5)]" style={{ width: PHONE_W + 20 }}>
        <div className="rounded-[34px] bg-white overflow-hidden" style={{ width: PHONE_W }}>
          {/* 상태바 */}
          <div className="flex items-center justify-between px-5 pt-2.5 pb-1 text-[11px] font-semibold text-neutral-900">
            <span>9:41</span>
            <span className="flex items-center gap-1 text-neutral-800">
              <span className="inline-block w-3.5 h-2 rounded-[2px] border border-neutral-800" />
              <span>5G</span>
              <span className="inline-block w-4 h-2 rounded-[2px] border border-neutral-800" />
            </span>
          </div>
          {/* 인스타 상단바 */}
          <div className="flex items-center justify-between px-3.5 py-2">
            <Plus size={20} strokeWidth={2} className="text-neutral-900" />
            <span className="flex items-center gap-1 text-[15px] font-semibold text-neutral-900">
              {handle} <ChevronDown size={15} strokeWidth={2.5} />
            </span>
            <Menu size={20} strokeWidth={2} className="text-neutral-900" />
          </div>
          {/* 프로필 행 */}
          <div className="flex items-center gap-4 px-4 pt-1 pb-3">
            <span className="shrink-0 rounded-full p-[2.5px]" style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}>
              <span className="grid place-items-center w-[68px] h-[68px] rounded-full bg-white text-[22px] font-bold text-neutral-500 ring-2 ring-white overflow-hidden">
                {handle.replace(/^@/, "").charAt(0).toUpperCase() || "K"}
              </span>
            </span>
            <div className="flex-1 flex items-center justify-around">
              <Stat n={String(posts)} label="게시물" />
              <Stat n={followers.toLocaleString()} label="팔로워" />
              <Stat n={connected ? "—" : "—"} label="팔로잉" />
            </div>
          </div>
          {/* 이름 + 바이오 */}
          <div className="px-4 pb-3">
            <div className="text-[13px] font-semibold text-neutral-900">{displayName}</div>
            {bio && <div className="text-[12px] text-neutral-700 leading-snug mt-0.5 whitespace-pre-line">{bio}</div>}
            <div className="text-[12px] text-neutral-500 mt-0.5">{handle}</div>
          </div>
          {/* 액션 버튼 */}
          <div className="flex gap-1.5 px-4 pb-3">
            <div className="flex-1 text-center text-[12px] font-semibold text-neutral-900 bg-neutral-100 rounded-lg py-1.5">프로필 편집</div>
            <div className="flex-1 text-center text-[12px] font-semibold text-neutral-900 bg-neutral-100 rounded-lg py-1.5">프로필 공유</div>
          </div>
          {/* 탭바 */}
          <div className="flex border-t border-neutral-200">
            <div className="flex-1 grid place-items-center py-2 border-b-2 border-neutral-900">
              <Grid3x3 size={20} strokeWidth={2} className="text-neutral-900" />
            </div>
            <div className="flex-1 grid place-items-center py-2 border-b-2 border-transparent">
              <SquarePlay size={20} strokeWidth={1.8} className="text-neutral-400" />
            </div>
            <div className="flex-1 grid place-items-center py-2 border-b-2 border-transparent">
              <UserRound size={20} strokeWidth={1.8} className="text-neutral-400" />
            </div>
          </div>
          {/* 게시물 그리드 */}
          {posts === 0 && fillers === 9 ? (
            <div className="grid place-items-center text-center px-6 py-10 gap-1" style={{ minHeight: 180 }}>
              <div className="text-[13px] font-semibold text-neutral-900">아직 게시물이 없어요</div>
              <div className="text-[12px] text-neutral-500">KUP로 첫 카드뉴스를 만들면 여기에 미리보기로 채워져요.</div>
            </div>
          ) : (
            <div className="grid grid-cols-3" style={{ gap: GRID_GAP }}>
              {gridCards.map((c) => (
                <CardThumb key={c.id} card={c} handle={handle} />
              ))}
              {Array.from({ length: fillers }).map((_, i) => (
                <div key={`f${i}`} style={{ width: CELL, height: CELL }} className="bg-neutral-100" />
              ))}
            </div>
          )}
          {/* 하단 네비 */}
          <div className="flex items-center justify-around border-t border-neutral-200 py-2.5 text-neutral-900">
            <House size={20} strokeWidth={1.9} />
            <Search size={20} strokeWidth={1.9} />
            <SquarePlay size={20} strokeWidth={1.9} />
            <span className="w-5 h-5 rounded-full border-2 border-neutral-900" />
          </div>
        </div>
      </div>
      {/* 캡션 */}
      <p className="text-xs text-muted text-center mt-3 max-w-[280px]">
        {connected
          ? "연동 계정 프로필 미리보기예요. 정식 연동 시 실제 인스타 피드로 실시간 반영돼요."
          : "미리보기예요 — KUP로 만든 카드가 게시물처럼 보여요. "}
        {!connected && (
          <Link href="/app/accounts" className="text-coral font-medium whitespace-nowrap">계정 연동하기 →</Link>
        )}
      </p>
    </div>
  );
}
