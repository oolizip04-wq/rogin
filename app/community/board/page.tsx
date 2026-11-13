import type { Metadata } from "next";
import { Suspense } from "react";
import GalleryBoard from "@/components/GalleryBoard";

export const metadata: Metadata = { title: "갤러리 · 체단실" };

export default function BoardPage() {
  return (
    <main className="app-page">
      <Suspense fallback={null}>
        <GalleryBoard />
      </Suspense>
    </main>
  );
}
