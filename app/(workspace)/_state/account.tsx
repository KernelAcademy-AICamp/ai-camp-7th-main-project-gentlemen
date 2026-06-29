"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * 계정/온보딩 상태 레이어 (프론트 세션 상태).
 *
 * ⚠️ 지금은 localStorage 스텁이다 — 백엔드 없이 "연동 전 → 연동 → 온보딩 → 사용" 흐름을
 *    실제 상태로 돌려보기 위함. 추후 이 훅의 내부만 실제로 교체:
 *      - status/handle → Supabase Auth 세션 + channels.status
 *      - connect()     → IG OAuth 플로우 (/api/ig/...)
 *      - brief/concept → channel_configs (온보딩 설문 → 컨셉 잠금)
 *    화면(소비자)은 useAccount() 인터페이스만 보므로 교체해도 안 바뀐다.
 */

export type Brief = {
  topic: string;
  target: string;
  tone: string;
  cadence: string;
  avoid: string;
};

export type AccountStatus = "loading" | "disconnected" | "connected" | "ready";

type AccountState = {
  status: AccountStatus;
  handle: string | null;
  brief: Brief | null;
  /** 계정 연동(스텁: 실제로는 IG OAuth) */
  connect: () => void;
  /** 온보딩 완료 → 컨셉 확정 */
  completeOnboarding: (brief: Brief) => void;
  /** 데모용 초기화(연동 해제) */
  reset: () => void;
};

const KEY = "kup_account_v1";
const Ctx = createContext<AccountState | null>(null);

type Persisted = { status: AccountStatus; handle: string | null; brief: Brief | null };

export function AccountProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>({ status: "loading", handle: null, brief: null });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Persisted;
        setState({ status: p.status ?? "disconnected", handle: p.handle ?? null, brief: p.brief ?? null });
      } else {
        setState({ status: "disconnected", handle: null, brief: null });
      }
    } catch {
      setState({ status: "disconnected", handle: null, brief: null });
    }
  }, []);

  function persist(next: Persisted) {
    setState(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* 저장 실패는 무시(세션만 잃음) */
    }
  }

  const value: AccountState = {
    ...state,
    connect: () => persist({ status: "connected", handle: "@my_cafe_daily", brief: state.brief }),
    completeOnboarding: (brief) =>
      persist({ status: "ready", handle: state.handle ?? "@my_cafe_daily", brief }),
    reset: () => persist({ status: "disconnected", handle: null, brief: null }),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAccount(): AccountState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAccount must be used within <AccountProvider>");
  return ctx;
}
