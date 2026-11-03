import { createClient, isSupabaseConfigured } from "./supabase/client";
import type { Routine } from "./routineStore";

/**
 * 내 루틴을 계정(profiles.routines)에 저장하고 불러온다.
 * Supabase 에 supabase/schema.sql 의 routines 칸이 아직 없으면 조용히 실패하고,
 * 이 브라우저 안에서만 동작한다.
 */

export type RoutineProfile = { userId: string; routines: unknown };

export async function loadRoutineProfile(): Promise<RoutineProfile | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("routines")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (error || !data) return null;
    return { userId: auth.user.id, routines: data.routines };
  } catch {
    return null;
  }
}

export async function saveRoutineProfile(
  userId: string,
  routines: readonly Routine[],
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await createClient()
      .from("profiles")
      .update({ routines })
      .eq("id", userId);
    return !error;
  } catch {
    return false;
  }
}
