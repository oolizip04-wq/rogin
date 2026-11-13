import type { Metadata } from "next";
import CommunityHome from "@/components/CommunityHome";

export const metadata: Metadata = { title: "커뮤니티 · 체단실" };

export default function CommunityPage() {
  return (
    <main className="app-page">
      <p className="page-eyebrow">COMMUNITY</p>
      <h1 className="page-title">커뮤니티</h1>
      <p className="page-sub">부대별 체단실 갤러리를 찾아 들어가거나, 없으면 새로 만들어 보세요. 방장은 없고 모두가 같은 권한입니다.</p>
      <CommunityHome />
    </main>
  );
}
