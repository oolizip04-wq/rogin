"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchNotifications, markAllRead, type NotificationsResult } from "@/lib/notificationsApi";

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** 내 알림 목록. 화면을 열면 모두 읽음으로 바꾸고, 이번에 처음 보는 알림은 강조해서 보여 준다. */
export default function NotificationList() {
  const [result, setResult] = useState<NotificationsResult | null>(null);

  useEffect(() => {
    let alive = true;
    fetchNotifications().then((r) => {
      if (!alive) return;
      setResult(r);
      if (r.status === "ok" && r.rows.some((n) => !n.is_read)) void markAllRead();
    });
    return () => {
      alive = false;
    };
  }, []);

  if (result === null) {
    return (
      <p>
        <small>불러오는 중...</small>
      </p>
    );
  }
  if (result.status === "not-logged-in") {
    return (
      <p>
        로그인하면 알림을 받을 수 있습니다. <Link href="/login">로그인</Link>
      </p>
    );
  }
  if (result.status === "failed") {
    return (
      <p>
        <small>알림을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</small>
      </p>
    );
  }
  if (result.rows.length === 0) {
    return (
      <p>
        <small>아직 알림이 없습니다. 내 글에 댓글이 달리면 여기에 알려 드려요.</small>
      </p>
    );
  }

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {result.rows.map((n) => (
        <li key={n.id} style={{ marginBottom: 10 }}>
          <Link
            href={n.link}
            style={{
              display: "block",
              padding: "12px 14px",
              background: n.is_read ? "var(--paper-2)" : "var(--cream)",
              border: `1px solid ${n.is_read ? "#c9c3a6" : "var(--rust)"}`,
            }}
          >
            <span style={{ fontWeight: n.is_read ? 600 : 800, wordBreak: "keep-all" }}>{n.message}</span>
            <br />
            <small style={{ color: "#6f6b52" }}>{formatTime(n.created_at)}</small>
          </Link>
        </li>
      ))}
    </ul>
  );
}
