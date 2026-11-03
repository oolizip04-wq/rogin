import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 소셜 로그인·이메일 인증 후 돌아오는 주소. 받은 code 를 세션으로 바꿔 준다.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // 같은 사이트 안의 경로로만 이동시킨다 (외부 주소로 보내는 공격 방지).
  const next = searchParams.get("next");
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : null;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (safeNext) return NextResponse.redirect(`${origin}${safeNext}`);

      // 기구를 이미 등록한 계정은 바로 운동 시작으로, 아니면 기구 선택으로 보낸다.
      let destination = "/equipment";
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("equipment_set, equipment_ids")
          .eq("id", auth.user.id)
          .maybeSingle();
        const hasEquipment =
          Array.isArray(profile?.equipment_ids) && profile.equipment_ids.length > 0;
        if (profile?.equipment_set === true || hasEquipment) destination = "/workout";
      }
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
