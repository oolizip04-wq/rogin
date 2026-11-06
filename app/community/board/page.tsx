import type { Metadata } from "next";
import { Suspense } from "react";
import GalleryBoard from "@/components/GalleryBoard";

export const metadata: Metadata = { title: "갤러리 · 체단실" };

export default function BoardPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <Suspense fallback={null}>
        <GalleryBoard />
      </Suspense>
    </main>
  );
}
