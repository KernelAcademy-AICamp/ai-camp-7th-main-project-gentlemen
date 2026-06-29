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
      <body>{children}</body>
    </html>
  );
}
