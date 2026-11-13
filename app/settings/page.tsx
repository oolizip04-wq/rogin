import type { Metadata } from "next";
import MyInfo from "@/components/MyInfo";

export const metadata: Metadata = { title: "설정 · 체단실" };

export default function SettingsPage() {
  return (
    <main className="app-page">
      <MyInfo />
    </main>
  );
}
