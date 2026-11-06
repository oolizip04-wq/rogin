"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  GALLERY_SORTS,
  MAX_GALLERY_TITLE,
  createGallery,
  listGalleries,
  type GalleryRow,
  type GallerySort,
  type LoadResult,
} from "@/lib/communityApi";

/** 갤러리 목록·검색과 새 갤러리 만들기. 방장은 없고, 로그인한 사람은 누구나 만들고 들어갈 수 있다. */
export default function CommunityHome() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<GallerySort>("active");
  const [list, setList] = useState<LoadResult<GalleryRow> | null>(null);

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [similar, setSimilar] = useState<GalleryRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 목록: 검색어를 멈추고 0.3초 뒤에 불러온다.
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      listGalleries(query, sort).then((r) => {
        if (alive) setList(r);
      });
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query, sort]);

  // 만들기 전에 비슷한 이름의 갤러리가 있는지 보여 준다.
  useEffect(() => {
    if (!creating || title.trim().length < 2) return;
    let alive = true;
    const t = setTimeout(() => {
      listGalleries(title, "posts").then((r) => {
        if (alive) setSimilar(r.status === "ok" ? r.rows.slice(0, 5) : []);
      });
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [creating, title]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) return;
    setBusy(true);
    setNotice(null);
    const res = await createGallery(title);
    setBusy(false);
    if (!res.ok) {
      setNotice(res.message);
      return;
    }
    router.push(`/community/board?id=${res.data}`);
  }

  const shownSimilar = title.trim().length >= 2 ? similar : [];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="갤러리 검색 (예: 3사단)"
          aria-label="갤러리 검색"
          style={{ flex: 1, minWidth: 160 }}
        />
        <button type="button" onClick={() => setCreating((v) => !v)} aria-expanded={creating}>
          {creating ? "닫기" : "갤러리 만들기"}
        </button>
      </div>

      {creating && (
        <form onSubmit={submit} style={{ border: "1px solid currentColor", borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <label>
            새 갤러리 이름
            <br />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={MAX_GALLERY_TITLE}
              placeholder="예: 3사단 체단실"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </label>
          <small>
            2~30자. 같은 이름(띄어쓰기 무시)은 만들 수 없고, 하루에 1개까지 만들 수 있습니다. 만든 뒤에는 이름을 바꿀 수 없습니다.
            ({title.length}/{MAX_GALLERY_TITLE})
          </small>

          {shownSimilar.length > 0 && (
            <div role="status" style={{ margin: "8px 0" }}>
              <strong>비슷한 갤러리가 이미 있어요. 먼저 확인해 보세요.</strong>
              <ul style={{ margin: "4px 0", paddingLeft: 18 }}>
                {shownSimilar.map((g) => (
                  <li key={g.id}>
                    <Link href={`/community/board?id=${g.id}`}>{g.title}</Link> <small>글 {g.post_count}개</small>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {notice && <p role="alert">{notice}</p>}
          <button type="submit" disabled={busy || title.trim().length < 2}>
            만들기
          </button>
        </form>
      )}

      <div role="group" aria-label="정렬" style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {GALLERY_SORTS.map((s) => (
          <button
            key={s.value}
            type="button"
            aria-pressed={sort === s.value}
            onClick={() => setSort(s.value)}
            style={{ fontWeight: sort === s.value ? 700 : 400 }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {list === null ? (
        <p>
          <small>불러오는 중...</small>
        </p>
      ) : list.status === "not-logged-in" ? (
        <p>
          로그인한 사람만 볼 수 있습니다. <Link href="/login">로그인</Link>
        </p>
      ) : list.status === "not-configured" ? (
        <p>
          <small>이 환경에서는 커뮤니티를 쓸 수 없습니다.</small>
        </p>
      ) : list.status === "failed" ? (
        <p>
          <small>불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</small>
        </p>
      ) : list.rows.length === 0 ? (
        <p>
          {query ? "검색 결과가 없습니다." : "아직 갤러리가 없습니다."} 위의 <strong>갤러리 만들기</strong>로 첫 갤러리를 만들어 보세요.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {list.rows.map((g) => (
            <li key={g.id} style={{ marginBottom: 10 }}>
              <Link
                href={`/community/board?id=${g.id}`}
                style={{ display: "block", padding: "12px 14px", border: "1px solid currentColor", borderRadius: 10, textDecoration: "none" }}
              >
                <strong>{g.title}</strong>
                <br />
                <small>
                  글 {g.post_count}개 · 최근 7일 {g.recent_count}개
                </small>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
