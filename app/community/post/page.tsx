import type { Metadata } from "next";
import { Suspense } from "react";
import PostView from "@/components/PostView";

export const metadata: Metadata = { title: "글 · 체단실" };

export default function PostPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <Suspense fallback={null}>
        <PostView />
      </Suspense>
    </main>
  );
}
