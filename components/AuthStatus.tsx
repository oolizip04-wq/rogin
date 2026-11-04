"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { notifyProfileChanged, useMyProfile } from "@/lib/myProfile";

/** 화면 위쪽에 로그인 상태를 보여 준다. 로그인했으면 이메일 대신 닉네임을 보여 준다. */
export default function AuthStatus() {
  const router = useRouter();
  const { profile, loading } = useMyProfile();

  // 다른 곳에서 로그인·로그아웃하면 바로 다시 불러온다.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const { data: sub } = createClient().auth.onAuthStateChange(() => notifyProfileChanged());
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await createClient().auth.signOut();
    notifyProfileChanged();
    router.refresh();
  }

  // 깜빡임을 줄이기 위해 확인이 끝나기 전에는 아무것도 보여주지 않는다.
  if (loading) return null;

  if (!profile) {
    return <Link href="/login">로그인</Link>;
  }

  return (
    <span>
      <strong>{profile.nickname ?? profile.email ?? "내 계정"}</strong>{" "}
      <button type="button" onClick={handleLogout}>
        로그아웃
      </button>
    </span>
  );
}
