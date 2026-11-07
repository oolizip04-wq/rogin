import type { Metadata } from "next";
import NotificationList from "@/components/NotificationList";

export const metadata: Metadata = { title: "알림 · 체단실" };

export default function NotificationsPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 16, width: "100%" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>알림</h1>
      <NotificationList />
    </main>
  );
}
