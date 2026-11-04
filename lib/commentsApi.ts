import { createClient, isSupabaseConfigured } from "./supabase/client";

/** 서버(supabase/schema.sql 의 댓글 함수)가 돌려주는 댓글 한 줄 */
export type CommentRow = {
  id: string;
  parent_id: string | null;
  /** 신고가 쌓여 가려진 댓글이면 null (쓴 본인에게는 보인다) */
  body: string | null;
  created_at: string;
  nickname: string | null;
  is_mine: boolean;
  like_count: number;
  dislike_count: number;
  my_vote: -1 | 0 | 1;
  /** 신고가 쌓여 다른 사람에게는 가려진 댓글 */
  hidden: boolean;
};

export const REPORT_REASONS = ["욕설·비방", "군사 보안 위반", "광고·도배", "기타"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const MAX_COMMENT_LENGTH = 500;

export type LoadResult =
  | { status: "ok"; rows: CommentRow[] }
  | { status: "not-configured" | "not-logged-in" | "failed" };

export type ActionResult = { ok: true } | { ok: false; message: string };

/** 서버가 던진 오류를 한국어 안내로 바꾼다. */
function toMessage(raw: string | undefined): string {
  const text = raw ?? "";
  if (text.includes("too many comments")) return "너무 빨리 쓰고 있어요. 잠시 후 다시 시도하세요.";
  if (text.includes("not logged in")) return "로그인이 필요합니다.";
  if (text.includes("cannot vote own")) return "내 댓글에는 좋아요·싫어요를 누를 수 없습니다.";
  if (text.includes("cannot report own")) return "내 댓글은 신고할 수 없습니다.";
  if (text.includes("parent not found")) return "답글을 달려는 댓글이 사라졌습니다. 새로고침해 주세요.";
  if (text.includes("invalid body")) return `댓글은 1~${MAX_COMMENT_LENGTH}자로 써 주세요.`;
  return "문제가 생겼습니다. 잠시 후 다시 시도하세요.";
}

export async function listComments(exerciseId: string): Promise<LoadResult> {
  if (!isSupabaseConfigured) return { status: "not-configured" };
  try {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return { status: "not-logged-in" };
    const { data, error } = await supabase.rpc("list_comments", {
      p_exercise_id: exerciseId,
    });
    if (error || !Array.isArray(data)) return { status: "failed" };
    return { status: "ok", rows: data as CommentRow[] };
  } catch {
    return { status: "failed" };
  }
}

async function call(fn: string, args: Record<string, unknown>): Promise<ActionResult> {
  try {
    const { error } = await createClient().rpc(fn, args);
    if (error) return { ok: false, message: toMessage(error.message) };
    return { ok: true };
  } catch {
    return { ok: false, message: toMessage(undefined) };
  }
}

export function addComment(exerciseId: string, parentId: string | null, body: string) {
  return call("add_comment", {
    p_exercise_id: exerciseId,
    p_parent_id: parentId,
    p_body: body,
  });
}

export function deleteComment(commentId: string) {
  return call("delete_comment", { p_comment_id: commentId });
}

/** 1 = 좋아요, -1 = 싫어요, 0 = 취소 */
export function voteComment(commentId: string, value: -1 | 0 | 1) {
  return call("vote_comment", { p_comment_id: commentId, p_value: value });
}

export function reportComment(commentId: string, reason: ReportReason) {
  return call("report_comment", { p_comment_id: commentId, p_reason: reason });
}
