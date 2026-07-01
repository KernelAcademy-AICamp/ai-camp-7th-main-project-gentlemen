import type { Metadata } from "next";
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
        {/* Airbnb Cereal 대체 서체 Inter(DESIGN-airbnb.md 권장). 한글은 Pretendard(wireframe.css). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* 랜딩(홈) 디스플레이 서체 Bricolage Grotesque + 본문 Pretendard */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
