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
        {/* 워크스페이스 디스플레이 서체(Fraunces) — 이식. Pretendard는 wireframe.css에서 로드 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
