"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { nextPathAfterLogin } from "@/lib/equipmentSync";
import { notifyProfileChanged, useMyProfile, type MyProfile } from "@/lib/myProfile";
import { randomNickname } from "@/lib/nickname";
import { createClient } from "@/lib/supabase/client";

type Check = { value: string; status: "checking" | "available" | "taken" | "error" };

const input = {
  width: "100%",
  padding: "12px 12px",
  fontSize: 16,
  border: "1px solid #b5b09a",
  background: "var(--cream)",
} as const;

/**
 * 로그인 직후 처음 한 번: 닉네임, 입대일, 전역일을 정한다.
 * 소셜 로그인(카카오·구글)으로 처음 들어온 계정은 닉네임이 임시 이름이고 날짜도 비어 있어서 여기서 정한다.
 */
export default function ProfileSetup() {
  const { profile, loading } = useMyProfile();

  if (loading) return null;
  if (!profile) {
    return (
      <p>
        로그인한 뒤에 정할 수 있습니다. <Link href="/login">로그인</Link>
      </p>
    );
  }
  return <SetupForm profile={profile} />;
}

export function SetupForm({ profile }: { profile: MyProfile }) {
  const router = useRouter();
  const original = profile.nickname ?? "";
  const [nickname, setNickname] = useState(original);
  const [enlist, setEnlist] = useState(profile.enlistDate ?? "");
  const [discharge, setDischarge] = useState(profile.dischargeDate ?? "");
  const [check, setCheck] = useState<Check | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const name = nickname.trim();
  // 지금 쓰던 닉네임 그대로 두면 확인이 필요 없다.
  const nameOk = name === original.trim() || (check?.value === name && check.status === "available");

  async function runCheck(value: string) {
    if (value.length < 2 || value.length > 20) {
      setCheck({ value, status: "error" });
      return;
    }
    setCheck({ value, status: "checking" });
    const { data, error: err } = await createClient().rpc("check_nickname_available", { p_nickname: value });
    setCheck({ value, status: err ? "error" : data === true ? "available" : "taken" });
  }

  function random() {
    const next = randomNickname();
    setNickname(next);
    void runCheck(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.length < 2 || name.length > 20) {
      setError("닉네임은 2~20자로 입력하세요.");
      return;
    }
    if (!nameOk) {
      setError("닉네임 중복확인을 해주세요.");
      return;
    }
    if (!enlist || !discharge) {
      setError("입대일과 전역일을 모두 선택하세요.");
      return;
    }
    if (discharge <= enlist) {
      setError("전역일은 입대일보다 뒤여야 합니다.");
      return;
    }
    setSaving(true);
    const { error: err } = await createClient()
      .from("profiles")
      .update({ nickname: name, enlist_date: enlist, discharge_date: discharge })
      .eq("id", profile.userId);
    setSaving(false);
    if (err) {
      setError(err.code === "23505" ? "이미 사용 중인 닉네임입니다." : "저장하지 못했습니다. 잠시 후 다시 시도하세요.");
      return;
    }
    notifyProfileChanged();
    router.replace(await nextPathAfterLogin());
  }

  return (
    <form onSubmit={submit}>
      <p style={{ fontSize: 14, fontWeight: 800, letterSpacing: 3, color: "var(--olive)" }}>WELCOME</p>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: "4px 0 6px", wordBreak: "keep-all" }}>처음 오셨군요!</h1>
      <p style={{ marginBottom: 20, color: "#4a4d3f", wordBreak: "keep-all" }}>
        닉네임과 입대일·전역일을 정해 주세요. 전역일은 홈 화면의 D-day에 쓰입니다.
      </p>

      <label style={{ fontWeight: 800 }}>
        닉네임 (2~20자)
        <div style={{ display: "flex", gap: 6, margin: "6px 0 4px" }}>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            minLength={2}
            maxLength={20}
            autoComplete="nickname"
            style={{ ...input, flex: 1, minWidth: 0 }}
          />
          <button type="button" onClick={() => runCheck(name)} disabled={check?.status === "checking"}>
            중복확인
          </button>
          <button type="button" onClick={random}>
            랜덤
          </button>
        </div>
      </label>
      {check?.value === name && (
        <small role={check.status === "available" ? "status" : "alert"}>
          {check.status === "checking" && "확인 중..."}
          {check.status === "available" && "사용할 수 있는 닉네임입니다."}
          {check.status === "taken" && "이미 사용 중인 닉네임입니다."}
          {check.status === "error" && "2~20자로 입력하거나 잠시 후 다시 시도하세요."}
        </small>
      )}

      <label style={{ display: "block", fontWeight: 800, marginTop: 16 }}>
        입대일
        <input
          type="date"
          value={enlist}
          onChange={(e) => setEnlist(e.target.value)}
          min="2000-01-01"
          max="2100-12-31"
          required
          style={{ ...input, marginTop: 6 }}
        />
      </label>
      <label style={{ display: "block", fontWeight: 800, marginTop: 16 }}>
        전역일 (예정일)
        <input
          type="date"
          value={discharge}
          onChange={(e) => setDischarge(e.target.value)}
          min="2000-01-01"
          max="2100-12-31"
          required
          style={{ ...input, marginTop: 6 }}
        />
      </label>

      {error && (
        <p role="alert" style={{ marginTop: 14, color: "#a3281a", fontWeight: 700 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        style={{
          width: "100%",
          marginTop: 22,
          padding: "14px 0",
          fontSize: 17,
          fontWeight: 800,
          color: "var(--cream)",
          background: "var(--rust)",
          border: "none",
          cursor: "pointer",
        }}
      >
        {saving ? "저장 중..." : "시작하기"}
      </button>
    </form>
  );
}
