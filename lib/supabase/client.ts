import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** 환경변수가 채워져 있는지. 비어 있으면 로그인 화면에서 안내 문구를 보여준다. */
export const isSupabaseConfigured = Boolean(url && anonKey);

export function createClient() {
  return createBrowserClient(url!, anonKey!);
}
