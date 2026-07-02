import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/workspace/auth";
import { AuthModalProvider } from "@/app/(marketing)/_components/auth-modal";

/**
 * 랜딩(홈) 레이아웃 — 자체 헤더/푸터를 쓰므로 마케팅 GNB/Footer는 얹지 않는다.
 * 로그인 상태를 읽어 AuthModalProvider로 감싼다(원래 로그인 팝업 재사용).
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
  return (
    <>
      {/* 랜딩 디스플레이 서체 Bricolage Grotesque (Pretendard는 wireframe.css에서 로드) */}
      <link
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&display=swap"
        rel="stylesheet"
      />
      <AuthModalProvider loggedIn={loggedIn}>{children}</AuthModalProvider>
    </>
  );
}
