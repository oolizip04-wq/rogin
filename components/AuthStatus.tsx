"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await createClient().auth.signOut();
    setEmail(null);
  }

  // 깜빡임을 줄이기 위해 확인이 끝나기 전에는 아무것도 보여주지 않는다.
  if (!ready) return null;

  if (!email) {
    return <Link href="/login">로그인</Link>;
  }

  return (
    <span>
      {email}{" "}
      <button type="button" onClick={handleLogout}>
        로그아웃
      </button>
    </span>
  );
}
