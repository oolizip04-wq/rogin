import type { Metadata, Viewport } from "next";
import { Archivo_Black, Noto_Sans_KR } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import "./globals.css";

// 큰 숫자·영문 라벨용 굵은 글꼴과 한글 글꼴
const display = Archivo_Black({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const korean = Noto_Sans_KR({
  variable: "--font-kr",
  weight: ["400", "600", "700", "800", "900"],
  preload: false,
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
  themeColor: "#2a2e27",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${display.variable} ${korean.variable}`}>
      <body>
        <TopBar />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
