import type { Metadata } from "next";
import ProfileSetup from "@/components/ProfileSetup";

export const metadata: Metadata = { title: "처음 설정 · 체단실" };

// 소셜 로그인 직후 한 번: 닉네임과 입대일·전역일을 정한다.
export default function WelcomePage() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "32px 20px", width: "100%" }}>
      <ProfileSetup />
    </main>
  );
}
