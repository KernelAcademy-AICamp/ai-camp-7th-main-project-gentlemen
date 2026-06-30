import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/workspace/auth";
import { Gnb } from "./_components/gnb";
import { Footer } from "./_components/footer";
import { AuthModalProvider } from "./_components/auth-modal";

/**
 * 홍보 사이트 레이아웃 (와이어프레임 #site) — GNB + 본문 + 푸터.
 * 로그인 상태를 읽어 GNB/CTA를 분기(로그인 시 "워크스페이스로"·"로그아웃").
 * Supabase 불가 시에도 홍보페이지는 떠야 하므로 try/catch (로그아웃으로 간주).
 */
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
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
  // Supabase 세션이 없어도 워크스페이스(파일DB) 세션이 있으면 로그인으로 인식(게스트 포함)
  if (!loggedIn) {
    try {
      loggedIn = !!(await getCurrentUser());
    } catch {
      /* noop */
    }
  }

  return (
    <AuthModalProvider loggedIn={loggedIn}>
      {/* .mkt = 와이어프레임 전역 스타일 스코프(워크스페이스 누수 방지) */}
      <div className="mkt">
        <Gnb loggedIn={loggedIn} />
        <main>{children}</main>
        <Footer />
      </div>
    </AuthModalProvider>
  );
}
