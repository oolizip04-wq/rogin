"use client";

import { useState } from "react";
import { daysUntil, formatDday, serviceProgress } from "@/lib/dday";
import { saveServiceDates, useMyProfile } from "@/lib/myProfile";

/**
 * 전역까지 남은 날(D-day)과, 입대일·전역일을 정하거나 고치는 칸.
 * 로그인하지 않았으면 아무것도 보여 주지 않는다.
 */
export default function ServiceDates() {
  const { profile, loading } = useMyProfile();
  const [editing, setEditing] = useState(false);
  const [enlist, setEnlist] = useState("");
  const [discharge, setDischarge] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading || !profile) return null;

  const days = daysUntil(profile.dischargeDate);
  const dday = formatDday(days);
  const progress = serviceProgress(profile.enlistDate, profile.dischargeDate);
  const hasDischarge = Boolean(profile.dischargeDate);

  function startEdit() {
    setEnlist(profile?.enlistDate ?? "");
    setDischarge(profile?.dischargeDate ?? "");
    setError(null);
    setEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    if (!enlist || !discharge) {
      setError("입대일과 전역일을 모두 선택하세요.");
      return;
    }
    if (discharge <= enlist) {
      setError("전역일은 입대일보다 뒤여야 합니다.");
      return;
    }
    setSaving(true);
    const ok = await saveServiceDates(profile.userId, enlist, discharge);
    setSaving(false);
    if (!ok) {
      setError("저장하지 못했습니다. 잠시 후 다시 시도하세요.");
      return;
    }
    setEditing(false);
  }

  if (editing || !hasDischarge) {
    return (
      <form onSubmit={handleSave} style={{ margin: "12px 0" }}>
        {!hasDischarge && !editing && (
          <p>
            <small>입대일과 전역일을 정하면 전역까지 남은 날(D-day)을 보여 드려요.</small>
          </p>
        )}
        <label>
          입대일{" "}
          <input
            type="date"
            value={enlist}
            onChange={(e) => setEnlist(e.target.value)}
            min="2000-01-01"
            max="2100-12-31"
          />
        </label>{" "}
        <label>
          전역일{" "}
          <input
            type="date"
            value={discharge}
            onChange={(e) => setDischarge(e.target.value)}
            min="2000-01-01"
            max="2100-12-31"
          />
        </label>{" "}
        <button type="submit" disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </button>
        {editing && (
          <>
            {" "}
            <button type="button" onClick={() => setEditing(false)}>
              취소
            </button>
          </>
        )}
        {error && <p role="alert">{error}</p>}
      </form>
    );
  }

  return (
    <p style={{ margin: "12px 0" }}>
      {dday ? (
        <>
          체단실 마지막 이용까지 <strong style={{ fontSize: 20 }}>{dday}</strong>
          {progress !== null && <small> · 복무 {progress}%</small>}
        </>
      ) : (
        <>전역을 축하합니다! 🎉</>
      )}{" "}
      <button type="button" onClick={startEdit}>
        날짜 수정
      </button>
    </p>
  );
}
