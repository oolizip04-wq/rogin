import type { Metadata } from "next";
import { Suspense } from "react";
import PostView from "@/components/PostView";

export const metadata: Metadata = { title: "글 · 체단실" };

export default function PostPage() {
  return (
    <main className="app-page">
      <Suspense fallback={null}>
        <PostView />
      </Suspense>
    </main>
  );
}
