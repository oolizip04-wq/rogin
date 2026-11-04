import type { MetadataRoute } from "next";

/**
 * 폰에서 '홈 화면에 추가'를 하면 이 정보로 앱처럼 설치된다.
 * display: standalone 이라 주소창 없이 앱 화면으로 열린다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "체단실",
    short_name: "체단실",
    description: "우리 부대 체단실 기구에 맞는 운동법",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "ko",
    background_color: "#101722",
    theme_color: "#101722",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
