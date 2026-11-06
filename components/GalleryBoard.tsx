"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MAX_POST_BODY,
  MAX_POST_TITLE,
  POSTS_PER_PAGE,
  POST_SORTS,
  REPORT_REASONS,
  addPost,
  formatTime,
  getGallery,
  listPosts,
  reportContent,
  type PostRow,
  type PostSort,
  type ReportReason,
} from "@/lib/communityApi";

type Board = { galleryTitle: string | null; posts: PostRow[]; more: boolean; failed: boolean; notLoggedIn: boolean };

/** 갤러리 하나의 글 목록(최신·추천·댓글순)과 글쓰기. 신고가 쌓인 글은 제목이 가려진다. */
export default function GalleryBoard() {
  const id = useSearchParams().get("id") ?? "";
  const [sort, setSort] = useState<PostSort>("latest");
  const [offset, setOffset] = useState(0);
  const [tick, setTick] = useState(0);
  const [board, setBoard] = useState<Board | null>(null);

  const [writing, setWriting] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]);

  // 정렬이 바뀌거나 새로 쓰면 처음부터, '더 보기'면 이어서 불러온다.
  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      const [g, p] = await Promise.all([getGallery(id), listPosts(id, sort, offset)]);
      if (!alive) return;
      if (g.status === "not-logged-in") {
        setBoard({ galleryTitle: null, posts: [], more: false, failed: false, notLoggedIn: true });
        return;
      }
      const galleryTitle = g.status === "ok" ? (g.rows[0]?.title ?? null) : null;
      const rows = p.status === "ok" ? p.rows : [];
      setBoard((prev) => ({
        galleryTitle,
        posts: offset === 0 || !prev ? rows : [...prev.posts, ...rows],
        more: rows.length === POSTS_PER_PAGE,
        failed: g.status !== "ok" || p.status !== "ok",
        notLoggedIn: false,
      }));
    })();
    return () => {
      alive = false;
    };
  }, [id, sort, offset, tick]);

  function changeSort(next: PostSort) {
    setSort(next);
    setOffset(0);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    setNotice(null);
    const res = await addPost(id, title, body);
    setBusy(false);
    if (!res.ok) {
      setNotice(res.message);
      return;
    }
    setTitle("");
    setBody("");
    setWriting(false);
    setSort("latest");
    setOffset(0);
    setTick((n) => n + 1);
  }

  async function report() {
    setBusy(true);
    const res = await reportContent("gallery", id, reason);
    setBusy(false);
    setReporting(false);
    setNotice(res.ok ? "신고했습니다. 신고가 쌓이면 이 갤러리는 목록에서 내려갑니다." : res.message);
  }

  if (!id) return <p>갤러리를 찾을 수 없습니다. <Link href="/community">목록으로</Link></p>;
  if (board === null) {
    return (
      <p>
        <small>불러오는 중...</small>
      </p>
    );
  }
  if (board.notLoggedIn) {
    return (
      <p>
        로그인한 사람만 볼 수 있습니다. <Link href="/login">로그인</Link>
      </p>
    );
  }
  if (board.galleryTitle === null) {
    return (
      <p>
        {board.failed ? "불러오지 못했습니다. 잠시 후 다시 시도해 주세요." : "없어졌거나 신고로 내려간 갤러리입니다."}{" "}
        <Link href="/community">목록으로</Link>
      </p>
    );
  }

  return (
    <div>
      <p>
        <Link href="/community">← 갤러리 목록</Link>
      </p>
      <h1>{board.galleryTitle}</h1>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        <button type="button" onClick={() => setWriting((v) => !v)} aria-expanded={writing}>
          {writing ? "닫기" : "글쓰기"}
        </button>
        <button type="button" onClick={() => setReporting((v) => !v)}>
          갤러리 신고
        </button>
      </div>

      {reporting && (
        <p>
          <label>
            신고 이유{" "}
            <select value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>{" "}
          <button type="button" disabled={busy} onClick={report}>
            신고하기
          </button>
        </p>
      )}

      {writing && (
        <form onSubmit={submit} style={{ border: "1px solid currentColor", borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={MAX_POST_TITLE}
            placeholder="제목"
            aria-label="글 제목"
            style={{ width: "100%", boxSizing: "border-box", marginBottom: 6 }}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={MAX_POST_BODY}
            rows={6}
            placeholder="내용"
            aria-label="글 내용"
            style={{ width: "100%", boxSizing: "border-box" }}
          />
          <small>
            부대 위치·편성·작전·인원 등 군사 보안에 해당하는 내용은 쓰지 마세요. ({body.length}/{MAX_POST_BODY})
          </small>
          <br />
          <button type="submit" disabled={busy || !title.trim() || !body.trim()}>
            올리기
          </button>
        </form>
      )}

      {notice && <p role="status">{notice}</p>}

      <div role="group" aria-label="정렬" style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {POST_SORTS.map((s) => (
          <button
            key={s.value}
            type="button"
            aria-pressed={sort === s.value}
            onClick={() => changeSort(s.value)}
            style={{ fontWeight: sort === s.value ? 700 : 400 }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {board.posts.length === 0 ? (
        <p>
          <small>아직 글이 없습니다. 첫 글을 남겨 보세요.</small>
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {board.posts.map((p) => {
            const hiddenForOthers = p.hidden && !p.is_mine;
            return (
              <li key={p.id} style={{ borderBottom: "1px solid #8884", padding: "10px 0" }}>
                {hiddenForOthers ? (
                  <small>신고가 쌓여 가려진 글입니다.</small>
                ) : (
                  <Link href={`/community/post?id=${p.id}`} style={{ textDecoration: "none" }}>
                    <strong>{p.title}</strong>
                    {p.comment_count > 0 && <small> [{p.comment_count}]</small>}
                  </Link>
                )}
                <br />
                <small>
                  {p.nickname ?? "익명"} · {formatTime(p.created_at)} · 추천 {p.like_count}
                </small>
              </li>
            );
          })}
        </ul>
      )}

      {board.more && (
        <p>
          <button type="button" onClick={() => setOffset(board.posts.length)}>
            더 보기
          </button>
        </p>
      )}
    </div>
  );
}
