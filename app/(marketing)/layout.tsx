import { Gnb } from "./_components/gnb";
import { Footer } from "./_components/footer";

/**
 * 홍보 사이트 레이아웃 (와이어프레임 #site) — GNB + 본문 + 푸터.
 * 홈/기능/요금제/FAQ/약관이 이 셸 안에 렌더된다. (로그인/워크스페이스는 별도 레이아웃)
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Gnb />
      <main>{children}</main>
      <Footer />
    </>
  );
}
