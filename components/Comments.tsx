"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MAX_COMMENT_LENGTH,
  REPORT_REASONS,
  addComment,
  deleteComment,
  listComments,
  reportComment,
  voteComment,
  type CommentRow,
  type LoadResult,
  type ReportReason,
} from "@/lib/commentsApi";

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 운동 하나의 댓글.
 * 댓글 쓰기, 대댓글, 좋아요·싫어요, 신고, 내 댓글 삭제.
 * 좋아요가 많고 싫어요가 적은 댓글이 위로 올라오고(서버가 정렬), 신고가 3건 쌓이면 가려진다.
 */
export default function Comments({ exerciseId }: { exerciseId: string }) {
  const [result, setResult] = useState<LoadResult | null>(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setResult(await listComments(exerciseId));
  }, [exerciseId]);

  useEffect(() => {
    let alive = true;
    listComments(exerciseId).then((r) => {
      if (alive) setResult(r);
    });
    return () => {
      alive = false;
    };
  }, [exerciseId]);

  const rows = useMemo(() => (result?.status === "ok" ? result.rows : []), [result]);

  // 원댓글은 서버가 정한 순서(점수순) 그대로, 대댓글은 쓴 시간 순서로 묶는다.
  const { tops, repliesOf } = useMemo(() => {
    const tops = rows.filter((r) => r.parent_id === null);
    const map = new Map<string, CommentRow[]>();
    for (const r of rows) {
      if (r.parent_id) map.set(r.parent_id, [...(map.get(r.parent_id) ?? []), r]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.created_at.localeCompare(b.created_at));
    }
    return { tops, repliesOf: map };
  }, [rows]);

  async function run(action: () => Promise<{ ok: true } | { ok: false; message: string }>) {
    setBusy(true);
    setNotice(null);
    const res = await action();
    setBusy(false);
    if (!res.ok) {
      setNotice(res.message);
      return false;
    }
    await reload();
    return true;
  }

  async function submitTop(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    if (await run(() => addComment(exerciseId, null, text))) setText("");
  }

  async function submitReply(e: React.FormEvent, parentId: string) {
    e.preventDefault();
    if (!replyText.trim()) return;
    const ok = await run(() => addComment(exerciseId, parentId, replyText));
    if (ok) {
      setReplyText("");
      setReplyTo(null);
    }
  }

  function vote(c: CommentRow, value: 1 | -1) {
    // 같은 걸 다시 누르면 취소한다.
    run(() => voteComment(c.id, c.my_vote === value ? 0 : value));
  }

  async function submitReport(c: CommentRow) {
    const ok = await run(() => reportComment(c.id, reason));
    if (ok) {
      setReportFor(null);
      setNotice("신고했습니다. 신고가 쌓이면 이 댓글은 자동으로 가려집니다.");
    }
  }

  function remove(c: CommentRow) {
    if (window.confirm("이 댓글을 삭제할까요? 달린 대댓글도 함께 지워집니다.")) {
      run(() => deleteComment(c.id));
    }
  }

  function renderComment(c: CommentRow, isReply: boolean) {
    const name = c.nickname ?? "익명";
    const hiddenForOthers = c.hidden && !c.is_mine;
    return (
      <li
        key={c.id}
        style={{
          listStyle: "none",
          margin: "12px 0",
          paddingLeft: isReply ? 16 : 0,
          borderLeft: isReply ? "2px solid currentColor" : "none",
        }}
      >
        <strong>{name}</strong> <small>{formatTime(c.created_at)}</small>
        {c.is_mine && <small> · 내 댓글</small>}
        {hiddenForOthers ? (
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
            <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: "4px 0" }}>
              {c.body}
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={busy || c.is_mine}
                onClick={() => vote(c, 1)}
                aria-pressed={c.my_vote === 1}
                style={{ fontWeight: c.my_vote === 1 ? 700 : 400 }}
              >
                👍 {c.like_count}
              </button>
              <button
                type="button"
                disabled={busy || c.is_mine}
                onClick={() => vote(c, -1)}
                aria-pressed={c.my_vote === -1}
                style={{ fontWeight: c.my_vote === -1 ? 700 : 400 }}
              >
                👎 {c.dislike_count}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyTo(replyTo === c.id ? null : c.id);
                  setReplyText("");
                }}
              >
                답글
              </button>
              {c.is_mine ? (
                <button type="button" disabled={busy} onClick={() => remove(c)}>
                  삭제
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setReportFor(reportFor === c.id ? null : c.id)}
                >
                  신고
                </button>
              )}
            </div>

            {reportFor === c.id && (
              <p>
                <label>
                  신고 이유{" "}
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as ReportReason)}
                  >
                    {REPORT_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>{" "}
                <button type="button" disabled={busy} onClick={() => submitReport(c)}>
                  신고하기
                </button>
              </p>
            )}

            {replyTo === c.id && (
              <form onSubmit={(e) => submitReply(e, c.id)}>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  maxLength={MAX_COMMENT_LENGTH}
                  rows={2}
                  placeholder={`${name}님에게 답글`}
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
                <button type="submit" disabled={busy || !replyText.trim()}>
                  답글 쓰기
                </button>
              </form>
            )}
          </>
        )}
      </li>
    );
  }

  if (result === null) {
    return (
      <p>
        <small>댓글을 불러오는 중...</small>
      </p>
    );
  }
  if (result.status === "not-configured") {
    return (
      <p>
        <small>이 환경에서는 댓글을 쓸 수 없습니다.</small>
      </p>
    );
  }
  if (result.status === "not-logged-in") {
    return (
      <p>
        로그인하면 댓글을 보고 쓸 수 있습니다. <Link href="/login">로그인</Link>
      </p>
    );
  }
  if (result.status === "failed") {
    return (
      <p>
        <small>댓글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</small>
      </p>
    );
  }

  return (
    <div>
      <form onSubmit={submitTop}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_COMMENT_LENGTH}
          rows={3}
          placeholder="이 운동에 대한 팁이나 질문을 남겨 보세요."
          style={{ width: "100%", boxSizing: "border-box" }}
        />
        <small>
          부대 위치·편성·작전·인원 등 군사 보안에 해당하는 내용은 쓰지 마세요. ({text.length}/
          {MAX_COMMENT_LENGTH})
        </small>
        <br />
        <button type="submit" disabled={busy || !text.trim()}>
          댓글 쓰기
        </button>
      </form>

      {notice && <p role="status">{notice}</p>}

      <p>
        <small>댓글 {rows.length}개 · 좋아요가 많은 댓글이 위에 보입니다.</small>
      </p>
      {tops.length === 0 ? (
        <p>
          <small>아직 댓글이 없습니다. 첫 댓글을 남겨 보세요.</small>
        </p>
      ) : (
        <div>
          {tops.map((c) => (
            <div key={c.id}>
              <ul style={{ padding: 0, margin: 0 }}>{renderComment(c, false)}</ul>
              <ul style={{ padding: 0, margin: 0 }}>
                {(repliesOf.get(c.id) ?? []).map((r) => renderComment(r, true))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
