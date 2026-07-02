"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bridgeSupabaseSession } from "@/lib/workspace/supabase-bridge";
import { createSession, newUser } from "@/lib/workspace/auth";
import { mutateDB } from "@/lib/workspace/db";

/**
 * 로그인 서버 액션 — 세션 발급은 Supabase Auth가 담당.
 * 로그인 성공 후 워크스페이스 파일DB로 브릿지(supabase-bridge.ts) → /app 진입.
 */

/** 구글 OAuth 시작 → 구글 동의 화면 → /auth/callback 에서 세션 교환 + 브릿지 */
export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  if (data?.url) redirect(data.url);
}

/** Supabase 세션 확보 후 워크스페이스 진입 — 설문 강제 없이 홈으로(설문은 홈에서 유도) */
async function enterWorkspace(): Promise<never> {
  const { ok } = await bridgeSupabaseSession();
  if (!ok) redirect(`/login?error=${encodeURIComponent("세션을 만들지 못했어요")}`);
  redirect("/app/home");
}

/** 이메일/비번 로그인 */
export async function signInWithPassword(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  await enterWorkspace();
}

/** 이메일/비번 가입 (로컬은 자동 확인 → 바로 세션) */
export async function signUpWithPassword(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  await enterWorkspace();
}

/**
 * 비회원으로 둘러보기 — Supabase 없이 파일DB 게스트 세션만 발급(화면 구경용).
 * Supabase가 안 떠 있어도 워크스페이스를 볼 수 있게 하는 폴백.
 */
export async function continueAsGuest() {
  const guest = newUser({
    email: `guest_${Date.now().toString(36)}@kup.local`,
    name: "게스트",
    guest: true,
  });
  await mutateDB((d) => d.users.push(guest));
  await createSession(guest.id);
  redirect("/app/home");
}
