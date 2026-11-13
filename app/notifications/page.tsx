import type { Metadata } from "next";
import NotificationList from "@/components/NotificationList";

export const metadata: Metadata = { title: "알림 · 체단실" };

export default function NotificationsPage() {
  return (
    <main className="app-page">
      <p className="page-eyebrow">NOTIFICATIONS</p>
      <h1 className="page-title">알림</h1>
      <p className="page-sub">내 글에 달린 댓글을 여기서 확인해요.</p>
      <NotificationList />
    </main>
  );
}
