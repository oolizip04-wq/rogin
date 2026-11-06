"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MAX_COMMENT,
  REPORT_REASONS,
  addPostComment,
  deletePost,
  deletePostComment,
  formatTime,
  getPost,
  listPostComments,
  reportContent,
  votePost,
  type ActionResult,
  type PostCommentRow,
  type PostDetail,
  type ReportReason,
} from "@/lib/communityApi";

type Loaded = { post: PostDetail | null; comments: PostCommentRow[]; failed: boolean; notLoggedIn: boolean };

/** 글 하나: 본문, 추천·비추천, 신고, 내 글 삭제, 댓글. */
export default function PostView() {
  const router = useRouter();
  const id = useSearchParams().get("id") ?? "";
  const [data, setData] = useState<Loaded | null>(null);
  const [tick, setTick] = useState(0);
  const [text, setText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ kind: "post" | "comment"; id: string } | null>(null);
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      const [p, c] = await Promise.all([getPost(id), listPostComments(id)]);
      if (!alive) return;
      setData({
        post: p.status === "ok" ? (p.rows[0] ?? null) : null,
        comments: c.status === "ok" ? c.rows : [],
        failed: p.status === "failed" || p.status === "not-configured",
        notLoggedIn: p.status === "not-logged-in",
      });
    })();
    return () => {
      alive = false;
    };
  }, [id, tick]);

  async function run<T>(action: () => Promise<ActionResult<T>>) {
    setBusy(true);
    setNotice(null);
    const res = await action();
    setBusy(false);
    if (!res.ok) {
      setNotice(res.message);
      return null;
    }
    setTick((n) => n + 1);
    return res;
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    if (await run(() => addPostComment(id, text))) setText("");
  }

  async function remove() {
    if (!window.confirm("이 글을 삭제할까요? 댓글도 함께 지워집니다.")) return;
    const galleryId = data?.post?.gallery_id;
    setBusy(true);
    const res = await deletePost(id);
    setBusy(false);
    if (!res.ok) {
      setNotice(res.message);
      return;
    }
    router.push(galleryId ? `/community/board?id=${galleryId}` : "/community");
  }

  async function submitReport() {
    if (!reportTarget) return;
    const target = reportTarget;
    const res = await run(() => reportContent(target.kind, target.id, reason));
    setReportTarget(null);
    if (res) setNotice("신고했습니다. 신고가 쌓이면 자동으로 가려집니다.");
  }

  if (!id) return <p>글을 찾을 수 없습니다. <Link href="/community">목록으로</Link></p>;
  if (data === null) {
    return (
      <p>
        <small>불러오는 중...</small>
      </p>
    );
  }
  if (data.notLoggedIn) {
    return (
      <p>
        로그인한 사람만 볼 수 있습니다. <Link href="/login">로그인</Link>
      </p>
    );
  }
  const post = data.post;
  if (!post) {
    return (
      <p>
        {data.failed ? "불러오지 못했습니다. 잠시 후 다시 시도해 주세요." : "삭제되었거나 없는 글입니다."}{" "}
        <Link href="/community">목록으로</Link>
      </p>
    );
  }

  const hiddenForOthers = post.hidden && !post.is_mine;

  const reportForm = (kind: "post" | "comment", targetId: string) =>
    reportTarget?.kind === kind && reportTarget.id === targetId ? (
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
        <button type="button" disabled={busy} onClick={submitReport}>
          신고하기
        </button>
      </p>
    ) : null;

  return (
    <div>
      <p>
        <Link href={`/community/board?id=${post.gallery_id}`}>← {post.gallery_title}</Link>
      </p>

      {hiddenForOthers ? (
        <p>
          <small>신고가 쌓여 가려진 글입니다.</small>
        </p>
      ) : (
        <>
          <h1 style={{ marginBottom: 4 }}>{post.title}</h1>
          <p style={{ margin: "0 0 12px" }}>
            <small>
              {post.nickname ?? "익명"} · {formatTime(post.created_at)}
              {post.is_mine && " · 내 글"}
              {post.hidden && " · 신고가 쌓여 다른 사람에게는 가려진 글"}
            </small>
          </p>
          <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{post.body}</p>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={busy || post.is_mine}
              aria-pressed={post.my_vote === 1}
              style={{ fontWeight: post.my_vote === 1 ? 700 : 400 }}
              onClick={() => run(() => votePost(id, post.my_vote === 1 ? 0 : 1))}
            >
              👍 추천 {post.like_count}
            </button>
            <button
              type="button"
              disabled={busy || post.is_mine}
              aria-pressed={post.my_vote === -1}
              style={{ fontWeight: post.my_vote === -1 ? 700 : 400 }}
              onClick={() => run(() => votePost(id, post.my_vote === -1 ? 0 : -1))}
            >
              👎 비추천 {post.dislike_count}
            </button>
            {post.is_mine ? (
              <button type="button" disabled={busy} onClick={remove}>
                삭제
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setReportTarget(reportTarget?.id === id ? null : { kind: "post", id })}
              >
                신고
              </button>
            )}
          </div>
          {reportForm("post", id)}
        </>
      )}

      {notice && <p role="status">{notice}</p>}

      <h2>댓글 {data.comments.length}개</h2>
      <form onSubmit={submitComment}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_COMMENT}
          rows={3}
          placeholder="댓글을 남겨 보세요."
          aria-label="댓글"
          style={{ width: "100%", boxSizing: "border-box" }}
        />
        <small>
          군사 보안에 해당하는 내용은 쓰지 마세요. ({text.length}/{MAX_COMMENT})
        </small>
        <br />
        <button type="submit" disabled={busy || !text.trim()}>
          댓글 쓰기
        </button>
      </form>

      <ul style={{ listStyle: "none", padding: 0, margin: "8px 0" }}>
        {data.comments.map((c) => {
          const hiddenC = c.hidden && !c.is_mine;
          return (
            <li key={c.id} style={{ borderBottom: "1px solid #8884", padding: "10px 0" }}>
              <strong>{c.nickname ?? "익명"}</strong> <small>{formatTime(c.created_at)}</small>
              {c.is_mine && <small> · 내 댓글</small>}
              {hiddenC ? (
                <p>
                  <small>신고가 쌓여 가려진 댓글입니다.</small>
                </p>
              ) : (
                <>
                  {c.hidden && (
                    <p>
                      <small>신고가 쌓여 다른 사람에게는 가려진 댓글입니다.</small>
                    </p>
                  )}
                  <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: "4px 0" }}>{c.body}</p>
                  {c.is_mine ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => window.confirm("이 댓글을 삭제할까요?") && run(() => deletePostComment(c.id))}
                    >
                      삭제
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReportTarget(reportTarget?.id === c.id ? null : { kind: "comment", id: c.id })}
                    >
                      신고
                    </button>
                  )}
                  {reportForm("comment", c.id)}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
