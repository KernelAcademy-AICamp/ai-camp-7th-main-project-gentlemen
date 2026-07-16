import type { Metadata } from "next";
import "./tokens.css"; // TDS 디자인 토큰(원시 --tds-* → 시맨틱 --kup-*). globals/wireframe/landing/marketing가 참조
import "./globals.css";
import "./wireframe.css"; // 와이어프레임 디자인 시스템(비주얼 SoT, 1차 초안)

export const metadata: Metadata = {
  title: "Kup",
  description: "갓 시작한 1인 인플루언서를 위한 인스타 카드뉴스 AI",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        {/* 서체는 Pretendard로 통일(wireframe.css CDN). 디스플레이용 Bricolage Grotesque는
            (home)/(marketing) 레이아웃에서 로드 — 아래 preconnect가 그 요청을 앞당긴다. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
