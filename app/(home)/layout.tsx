import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/workspace/auth";
import { AuthModalProvider } from "@/app/(marketing)/_components/auth-modal";

/**
 * 랜딩(홈) 레이아웃 — 자체 헤더/푸터를 쓰므로 마케팅 GNB/Footer를 얹지 않는다.
 * 로그인 상태만 읽어 AuthModalProvider로 감싼다(헤더 CTA용).
 */
export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  let loggedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    loggedIn = !!user;
  } catch {
    loggedIn = false;
  }
  if (!loggedIn) {
    try {
      loggedIn = !!(await getCurrentUser());
    } catch {
      /* noop */
    }
  }
  return <AuthModalProvider loggedIn={loggedIn}>{children}</AuthModalProvider>;
}
