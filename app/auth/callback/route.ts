import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 소셜 로그인 후 돌아오는 주소. 받은 code 를 세션으로 바꿔 준다.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // 같은 사이트 안의 경로로만 이동시킨다 (외부 주소로 보내는 공격 방지).
  const next = searchParams.get("next") ?? "/exercises";
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/exercises";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
