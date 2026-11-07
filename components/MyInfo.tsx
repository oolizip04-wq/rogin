"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { daysUntil, formatDday, parseDate } from "@/lib/dday";
import { notifyProfileChanged, useMyProfile } from "@/lib/myProfile";
import { createClient } from "@/lib/supabase/client";
import { useOwnedEquipment } from "@/lib/useOwnedEquipment";

function dotted(value: string | null): string {
  const d = parseDate(value);
  if (!d) return "정하지 않음";
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}`;
}

const row = { display: "flex", justifyContent: "space-between", gap: 12, padding: "14px 0", borderBottom: "1px solid #b5b09a" } as const;

/** 내 정보: 닉네임, 복무 날짜, 내 기구, 로그아웃. (날짜 수정 등 설정은 나중에 이곳에 넣는다) */
export default function MyInfo() {
  const router = useRouter();
  const { profile, loading } = useMyProfile();
  const { ids, syncing } = useOwnedEquipment();

  async function logout() {
    await createClient().auth.signOut();
    notifyProfileChanged();
    router.push("/");
  }

  if (loading) return null;
  if (!profile) {
    return (
      <p>
        로그인하면 내 정보를 볼 수 있습니다. <Link href="/login">로그인</Link>
      </p>
    );
  }

  const days = daysUntil(profile.dischargeDate);

  return (
    <div>
      <p style={{ fontSize: 14, fontWeight: 800, letterSpacing: 3, color: "var(--olive)" }}>SETTINGS</p>
      <h1 style={{ fontSize: 30, fontWeight: 900, margin: "4px 0 12px" }}>설정</h1>
      <p style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{profile.nickname ?? "내 정보"}</p>

      <div style={{ background: "var(--cream)", border: "1px solid #b5b09a", boxShadow: "6px 6px 0 var(--shadow)", padding: "4px 16px" }}>
        <div style={row}>
          <span>입대일</span>
          <strong>{dotted(profile.enlistDate)}</strong>
        </div>
        <div style={row}>
          <span>전역 예정일</span>
          <strong>{dotted(profile.dischargeDate)}</strong>
        </div>
        <div style={row}>
          <span>전역까지</span>
          <strong>{days === null ? "-" : (formatDday(days) ?? "전역")}</strong>
        </div>
        <div style={{ ...row, borderBottom: "none" }}>
          <span>내 기구</span>
          <strong>
            {syncing ? "…" : `${ids.length}종`} · <Link href="/equipment?edit=1" style={{ color: "var(--rust)", textDecoration: "underline" }}>수정</Link>
          </strong>
        </div>
      </div>

      <p style={{ marginTop: 16, fontSize: 13, color: "#6f6b52" }}>설정(날짜 수정 등)은 준비 중입니다.</p>

      <button
        type="button"
        onClick={logout}
        style={{ marginTop: 20, padding: "12px 20px", fontWeight: 800, background: "var(--hero)", color: "var(--cream)", border: "none" }}
      >
        로그아웃
      </button>
    </div>
  );
}
