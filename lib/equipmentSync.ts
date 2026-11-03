import { createClient, isSupabaseConfigured } from "./supabase/client";

/**
 * 고른 기구를 계정(profiles 테이블)에 저장하고 불러온다.
 * Supabase 에 supabase/schema.sql 의 equipment_ids, equipment_set 칸이 아직 없으면
 * 모든 함수가 조용히 실패하고, 이 브라우저 안에서만 동작한다.
 */

export type EquipmentProfile = {
  userId: string;
  ids: string[];
  /** 한 번이라도 '운동 시작하기'로 기구 선택을 마쳤는지 */
  confirmed: boolean;
};

export async function loadEquipmentProfile(): Promise<EquipmentProfile | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("equipment_ids, equipment_set")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (error || !data) return null;
    return {
      userId: auth.user.id,
      ids: Array.isArray(data.equipment_ids) ? data.equipment_ids : [],
      confirmed: data.equipment_set === true,
    };
  } catch {
    return null;
  }
}

/** 기구 목록을 계정에 저장한다. confirmed 를 true 로 주면 '기구 선택 완료'로 표시한다. */
export async function saveEquipmentProfile(
  userId: string,
  ids: readonly string[],
  confirmed?: boolean,
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const patch: { equipment_ids: string[]; equipment_set?: boolean } = {
      equipment_ids: [...ids],
    };
    if (confirmed) patch.equipment_set = true;
    const { error } = await createClient()
      .from("profiles")
      .update(patch)
      .eq("id", userId);
    return !error;
  } catch {
    return false;
  }
}

/** 로그인한 직후 어디로 보낼지. 기구를 한 번 골랐던 계정은 바로 운동 시작으로 간다. */
export async function nextPathAfterLogin(): Promise<"/workout" | "/equipment"> {
  const profile = await loadEquipmentProfile();
  return profile?.confirmed ? "/workout" : "/equipment";
}
