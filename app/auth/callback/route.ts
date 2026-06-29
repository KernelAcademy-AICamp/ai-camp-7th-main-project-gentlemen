import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth/이메일 콜백 — 외부 로그인(구글) 또는 코드 기반 로그인이 끝난 뒤 돌아오는 곳.
 * Supabase가 준 code 를 세션으로 교환(쿠키 기록)하고 워크스페이스로 보낸다.
 * 구글·이메일(매직링크) 공통 진입점.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  // 코드 없음/교환 실패 → 로그인으로 되돌림
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("로그인에 실패했어요")}`);
}
