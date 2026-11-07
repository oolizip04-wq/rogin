"use client";

import ServiceDates from "@/components/ServiceDates";
import { daysUntil, formatDday, parseDate, serviceProgress } from "@/lib/dday";
import { useMyProfile } from "@/lib/myProfile";

/** 'YYYY-MM-DD' 를 '2025. 08. 17' 로 */
function dotted(value: string | null | undefined): string {
  const d = parseDate(value);
  if (!d) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}. ${mm}. ${dd}`;
}

/**
 * 홈 맨 위의 전역 D-day 카드.
 * 닉네임, 완료 퍼센트 배지, 큰 D-day, 전역 예정일, 복무 진행률 막대를 보여 준다.
 * 날짜를 아직 안 정한 계정에는 정하는 칸을, 전역일이 지났으면 이용 종료 문구를 보여 준다.
 */
export default function HomeHero() {
  const { profile, loading } = useMyProfile();
  return (
    <HeroView
      nickname={profile?.nickname ?? null}
      enlistDate={profile?.enlistDate ?? null}
      dischargeDate={profile?.dischargeDate ?? null}
      needsDates={!loading && !!profile && !profile.dischargeDate}
    />
  );
}

/** 화면만 그리는 부분. 날짜를 받아서 그린다. */
export function HeroView({
  nickname,
  enlistDate,
  dischargeDate,
  needsDates,
  now,
}: {
  nickname: string | null;
  enlistDate: string | null;
  dischargeDate: string | null;
  needsDates: boolean;
  now?: Date;
}) {
  const days = daysUntil(dischargeDate, now);
  const dday = formatDday(days);
  const progress = serviceProgress(enlistDate, dischargeDate, now);
  const finished = days !== null && days <= 0;

  return (
    <section
      aria-label="전역까지 남은 날"
      style={{
        margin: "4px 16px 16px",
        padding: "16px 18px 14px",
        color: "var(--cream)",
        background: "var(--hero-card)",
        border: "1px solid #474d41",
        borderRadius: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 28 }}>
        <p style={{ fontSize: 17, fontWeight: 800, wordBreak: "keep-all" }}>
          {nickname ? (
            <>
              {nickname} <span style={{ fontSize: 14, fontWeight: 700 }}>님</span>
            </>
          ) : (
            " "
          )}
        </p>
        {progress !== null && !finished && (
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              background: "var(--rust)",
              fontSize: 12,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {progress}% 완료
          </span>
        )}
      </div>

      {needsDates ? (
        <div style={{ marginTop: 8 }}>
          <ServiceDates />
        </div>
      ) : finished ? (
        <p style={{ margin: "10px 0 6px", fontWeight: 900, fontSize: 28, lineHeight: 1.25, wordBreak: "keep-all" }}>
          체단실 이용이
          <br />
          종료되었습니다
        </p>
      ) : (
        <>
          <p style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: "#d9d4b8" }}>체단실 이용 종료까지</p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(48px, min(18vw, 9svh), 72px)",
              lineHeight: 1.05,
              letterSpacing: -0.5,
            }}
          >
            {dday ?? "D-day"}
          </p>
          {dischargeDate && (
            <p style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: "#d9d4b8" }}>
              전역 예정일 {dotted(dischargeDate)}
            </p>
          )}
        </>
      )}

      {/* 복무 진행률 막대. 날짜를 모르면 빈 막대로 보여 준다. */}
      {!finished && !needsDates && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#d9d4b8", marginBottom: 6 }}>복무 진행률</p>
          <div
            role="progressbar"
            aria-valuenow={progress ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="복무 진행률"
            style={{ position: "relative", height: 10, borderRadius: 5, background: "#4b5145" }}
          >
            <div style={{ width: `${progress ?? 0}%`, height: "100%", borderRadius: 5, background: "var(--khaki)" }} />
            <span
              style={{
                position: "absolute",
                top: -3,
                left: `calc(${progress ?? 0}% - 8px)`,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "var(--rust)",
                border: "2px solid var(--cream)",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, fontWeight: 700, color: "#a9a487" }}>
            <span>입대 {dotted(enlistDate) || "-"}</span>
            <span style={{ color: "#e3d9a8" }}>{progress === null ? "" : `현재 ${progress}%`}</span>
          </div>
        </div>
      )}
    </section>
  );
}
