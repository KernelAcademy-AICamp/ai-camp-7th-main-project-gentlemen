import Link from "next/link";
import { Sidebar } from "./_components/sidebar";
import { AccountProvider } from "./_state/account";
import { RequireAccount, DemoReset } from "./_components/account-gate";
import { ProfileMenu } from "./_components/profile-menu";

/**
 * 워크스페이스 셸 (와이어프레임 #ws) — 로그인 후 모든 작업이 얹히는 단일 셸.
 * AccountProvider 가 연동/온보딩 상태를 들고, RequireAccount 가 그 상태에 따라
 * 연동 전 → 온보딩 → 실제 화면(children) 순으로 게이트한다.
 *
 * TODO(인증): 세션 확인 → 미로그인 시 / 로 리다이렉트 (화면흐름 L1/L2).
 */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="ws">
      <AccountProvider>
        <div className="ribbon">
          [ 뼈대 ] 와이어프레임 기반 · 상태 기반 흐름(연동 전→온보딩→사용)
          <DemoReset />
        </div>
        <div className="app">
          <header className="wsheader">
            <div className="wsh-left">
              <Link href="/dashboard" className="logo">
                <span className="mark">K</span>KUP
              </Link>
            </div>
            <div className="wsh-right">
              <span className="plan-badge">베이직</span>
              <ProfileMenu />
            </div>
          </header>
          <Sidebar />
          <main className="wsmain">
            <RequireAccount>{children}</RequireAccount>
          </main>
        </div>
      </AccountProvider>
    </div>
  );
}
