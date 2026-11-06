import { createClient, isSupabaseConfigured } from "./supabase/client";

/** 서버(supabase/schema.sql 의 갤러리 함수)가 돌려주는 한 줄들 */
export type GalleryRow = {
  id: string;
  title: string;
  post_count: number;
  recent_count: number;
  last_post_at: string | null;
};

export type PostRow = {
  id: string;
  /** 신고가 쌓여 가려진 글이면 null (쓴 본인에게는 보인다) */
  title: string | null;
  nickname: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
  is_mine: boolean;
  hidden: boolean;
};

export type PostDetail = {
  id: string;
  gallery_id: string;
  gallery_title: string;
  title: string | null;
  body: string | null;
  nickname: string | null;
  created_at: string;
  like_count: number;
  dislike_count: number;
  my_vote: -1 | 0 | 1;
  is_mine: boolean;
  hidden: boolean;
};

export type PostCommentRow = {
  id: string;
  body: string | null;
  created_at: string;
  nickname: string | null;
  is_mine: boolean;
  hidden: boolean;
};

export type GallerySort = "active" | "posts" | "new";
export type PostSort = "latest" | "likes" | "comments";

export const GALLERY_SORTS: { value: GallerySort; label: string }[] = [
  { value: "active", label: "활발한 순" },
  { value: "posts", label: "글 많은 순" },
  { value: "new", label: "새로 생긴 순" },
];
export const POST_SORTS: { value: PostSort; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "likes", label: "추천순" },
  { value: "comments", label: "댓글순" },
];

export const REPORT_REASONS = ["욕설·비방", "군사 보안 위반", "광고·도배", "기타"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const MAX_GALLERY_TITLE = 30;
export const MAX_POST_TITLE = 60;
export const MAX_POST_BODY = 3000;
export const MAX_COMMENT = 500;
export const POSTS_PER_PAGE = 30;

export type LoadResult<T> =
  | { status: "ok"; rows: T[] }
  | { status: "not-configured" }
  | { status: "not-logged-in" }
  | { status: "failed" };

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string };

/** 서버가 던진 오류를 한국어 안내로 바꾼다. */
function toMessage(raw: string | undefined): string {
  const text = raw ?? "";
  if (text.includes("duplicate title")) return "이미 같은 이름의 갤러리가 있습니다. 목록에서 찾아 들어가 주세요.";
  if (text.includes("too many galleries")) return "갤러리는 하루에 1개까지 만들 수 있습니다.";
  if (text.includes("invalid title")) return "제목을 확인해 주세요. 갤러리는 2~30자, 글은 1~60자이며 사용할 수 없는 이름도 있습니다.";
  if (text.includes("too many posts")) return "너무 빨리 쓰고 있어요. 잠시 후 다시 시도하세요.";
  if (text.includes("too many comments")) return "너무 빨리 쓰고 있어요. 잠시 후 다시 시도하세요.";
  if (text.includes("not logged in")) return "로그인이 필요합니다.";
  if (text.includes("invalid body")) return "내용을 확인해 주세요.";
  if (text.includes("cannot vote own")) return "내 글에는 추천·비추천을 누를 수 없습니다.";
  if (text.includes("cannot report own")) return "내가 쓴 것은 신고할 수 없습니다.";
  if (text.includes("not found")) return "대상이 사라졌습니다. 새로고침해 주세요.";
  return "문제가 생겼습니다. 잠시 후 다시 시도하세요.";
}

async function rows<T>(fn: string, args: Record<string, unknown>): Promise<LoadResult<T>> {
  if (!isSupabaseConfigured) return { status: "not-configured" };
  try {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return { status: "not-logged-in" };
    const { data, error } = await supabase.rpc(fn, args);
    if (error || !Array.isArray(data)) return { status: "failed" };
    return { status: "ok", rows: data as T[] };
  } catch {
    return { status: "failed" };
  }
}

async function call<T = undefined>(fn: string, args: Record<string, unknown>): Promise<ActionResult<T>> {
  try {
    const { data, error } = await createClient().rpc(fn, args);
    if (error) return { ok: false, message: toMessage(error.message) };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, message: toMessage(undefined) };
  }
}

export const listGalleries = (query: string, sort: GallerySort) =>
  rows<GalleryRow>("list_galleries", { p_query: query, p_sort: sort });

export const getGallery = (id: string) => rows<{ id: string; title: string }>("get_gallery", { p_gallery_id: id });

export const createGallery = (title: string) => call<string>("create_gallery", { p_title: title });

export const listPosts = (galleryId: string, sort: PostSort, offset: number) =>
  rows<PostRow>("list_posts", {
    p_gallery_id: galleryId,
    p_limit: POSTS_PER_PAGE,
    p_offset: offset,
    p_sort: sort,
  });

export const getPost = (id: string) => rows<PostDetail>("get_post", { p_post_id: id });

export const addPost = (galleryId: string, title: string, body: string) =>
  call<string>("add_post", { p_gallery_id: galleryId, p_title: title, p_body: body });

export const deletePost = (id: string) => call("delete_post", { p_post_id: id });

/** 1 = 추천, -1 = 비추천, 0 = 취소 */
export const votePost = (id: string, value: -1 | 0 | 1) => call("vote_post", { p_post_id: id, p_value: value });

export const listPostComments = (postId: string) => rows<PostCommentRow>("list_post_comments", { p_post_id: postId });

export const addPostComment = (postId: string, body: string) =>
  call<string>("add_post_comment", { p_post_id: postId, p_body: body });

export const deletePostComment = (id: string) => call("delete_post_comment", { p_comment_id: id });

export const reportContent = (kind: "gallery" | "post" | "comment", targetId: string, reason: ReportReason) =>
  call("report_content", { p_kind: kind, p_target_id: targetId, p_reason: reason });

export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
