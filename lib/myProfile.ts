import { useCallback, useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "./supabase/client";

/** 내 정보 중 화면에서 쓰는 것들 */
export type MyProfile = {
  userId: string;
  email: string | null;
  nickname: string | null;
  /** 'YYYY-MM-DD'. 아직 안 정했으면 null */
  enlistDate: string | null;
  dischargeDate: string | null;
};

const CHANGED = "chedansil:profile-changed";

/** 내 정보가 바뀌었다고 화면들에 알린다. (전역일을 저장한 뒤 D-day 를 바로 새로 그리려고) */
export function notifyProfileChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGED));
}

/**
 * 로그인한 사람의 정보를 불러온다. 로그인하지 않았으면 null.
 * 날짜 칸은 supabase/schema.sql 을 실행하기 전에는 없으므로 따로 읽고, 실패하면 null 로 둔다.
 */
export async function loadMyProfile(): Promise<MyProfile | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;

    const { data: base } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", auth.user.id)
      .maybeSingle();

    const { data: dates } = await supabase
      .from("profiles")
      .select("enlist_date, discharge_date")
      .eq("id", auth.user.id)
      .maybeSingle();

    return {
      userId: auth.user.id,
      email: auth.user.email ?? null,
      nickname: base?.nickname ?? null,
      enlistDate: dates?.enlist_date ?? null,
      dischargeDate: dates?.discharge_date ?? null,
    };
  } catch {
    return null;
  }
}

/** 입대일·전역일을 저장한다. 성공하면 true. */
export async function saveServiceDates(
  userId: string,
  enlistDate: string,
  dischargeDate: string,
): Promise<boolean> {
  try {
    const { error } = await createClient()
      .from("profiles")
      .update({ enlist_date: enlistDate, discharge_date: dischargeDate })
      .eq("id", userId);
    if (error) return false;
    notifyProfileChanged();
    return true;
  } catch {
    return false;
  }
}

/** 내 정보를 불러와 주는 훅. loading 이 끝나기 전에는 profile 이 null 이다. */
export function useMyProfile(): { profile: MyProfile | null; loading: boolean } {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setProfile(await loadMyProfile());
    setLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;
    loadMyProfile().then((p) => {
      if (!alive) return;
      setProfile(p);
      setLoading(false);
    });
    const onChanged = () => {
      refresh();
    };
    window.addEventListener(CHANGED, onChanged);
    return () => {
      alive = false;
      window.removeEventListener(CHANGED, onChanged);
    };
  }, [refresh]);

  return { profile, loading };
}
