"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BellIcon } from "@/components/icons";
import { NOTIFICATIONS_CHANGED_EVENT, fetchUnreadCount } from "@/lib/notificationsApi";
import { showsChrome } from "@/lib/nav";

/** 화면 맨 위 막대: 앱 이름과 알림 종(안 읽은 알림 수). 알림을 누르면 알림 화면으로 간다. */
export default function TopBar() {
  const path = usePathname() ?? "";
  const visible = showsChrome(path);
  const [unread, setUnread] = useState<number | null>(null);

  // 화면을 옮길 때, 알림이 바뀔 때, 1분마다 안 읽은 수를 다시 확인한다.
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    const refresh = () => {
      fetchUnreadCount().then((n) => {
        if (alive) setUnread(n);
      });
    };
    refresh();
    const timer = setInterval(refresh, 60_000);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    };
  }, [visible, path]);

  if (!visible) return null;

  const count = unread ?? 0;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 52,
        padding: "0 16px",
        background: "var(--hero)",
        color: "var(--cream)",
      }}
    >
      <Link href="/workout" style={{ fontSize: 20, fontWeight: 800, letterSpacing: 0.5 }}>
        체단실
      </Link>
      <Link
        href="/notifications"
        aria-label={count > 0 ? `알림 ${count}개` : "알림"}
        style={{ position: "relative", display: "grid", placeItems: "center", width: 44, height: 44 }}
      >
        <BellIcon width={26} height={26} />
        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 4,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              borderRadius: 8,
              background: "var(--rust)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 800,
              lineHeight: "16px",
              textAlign: "center",
            }}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    </header>
  );
}
