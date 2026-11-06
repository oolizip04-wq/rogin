import type { Metadata } from "next";
import Link from "next/link";
import AuthStatus from "@/components/AuthStatus";
import CommunityHome from "@/components/CommunityHome";

export const metadata: Metadata = { title: "커뮤니티 · 체단실" };

export default function CommunityPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>커뮤니티</h1>
        <AuthStatus />
      </header>
      <p>
        <Link href="/workout">← 운동 시작</Link>
      </p>
      <p>
        <small>부대별 체단실 갤러리를 찾아 들어가거나, 없으면 새로 만들어 보세요. 방장은 없고 모두가 같은 권한입니다.</small>
      </p>
      <CommunityHome />
    </main>
  );
}
