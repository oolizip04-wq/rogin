import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "체단실",
  description: "우리 부대 체단실 기구에 맞는 운동법",
  // 아이폰에서 홈 화면에 추가했을 때 앱처럼 열리게 한다.
  appleWebApp: { capable: true, title: "체단실", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 노치(카메라 구멍) 아래까지 화면을 쓰되, 글자는 안전한 영역 안에 놓는다.
  viewportFit: "cover",
  themeColor: "#101722",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
