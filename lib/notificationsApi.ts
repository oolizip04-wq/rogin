import { createClient, isSupabaseConfigured } from "./supabase/client";

export type NotificationRow = {
  id: string;
  kind: "post_comment" | "comment_reply";
  message: string;
  link: string;
  created_at: string;
  is_read: boolean;
};

const CHANGED = "chedansil:notifications-changed";

/** 알림이 바뀌었다고 상단 종에 알린다. */
export function notifyNotificationsChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGED));
}
export const NOTIFICATIONS_CHANGED_EVENT = CHANGED;

/** 안 읽은 알림 수. 로그인하지 않았거나 실패하면 null. */
export async function fetchUnreadCount(): Promise<number | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await supabase.rpc("unread_notification_count");
    if (error || typeof data !== "number") return null;
    return data;
  } catch {
    return null;
  }
}

export type NotificationsResult =
  | { status: "ok"; rows: NotificationRow[] }
  | { status: "not-logged-in" }
  | { status: "failed" };

export async function fetchNotifications(): Promise<NotificationsResult> {
  if (!isSupabaseConfigured) return { status: "failed" };
  try {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return { status: "not-logged-in" };
    const { data, error } = await supabase.rpc("list_notifications");
    if (error || !Array.isArray(data)) return { status: "failed" };
    return { status: "ok", rows: data as NotificationRow[] };
  } catch {
    return { status: "failed" };
  }
}

export async function markAllRead(): Promise<void> {
  try {
    await createClient().rpc("mark_notifications_read");
    notifyNotificationsChanged();
  } catch {
    // 읽음 표시가 실패해도 화면은 그대로 둔다.
  }
}
