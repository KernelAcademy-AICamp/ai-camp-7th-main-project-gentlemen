import { Gnb } from "./_components/gnb";
import { Footer } from "./_components/footer";
import { AuthModalProvider } from "./_components/auth-modal";

/**
 * 홍보 사이트 레이아웃 (와이어프레임 #site) — GNB + 본문 + 푸터.
 * AuthModalProvider 로 감싸 어디서든 로그인/회원가입 팝업을 띄운다(화면흐름 L1/L2 모달).
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthModalProvider>
      <Gnb />
      <main>{children}</main>
      <Footer />
    </AuthModalProvider>
  );
}
