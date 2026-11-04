"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { daysUntil, formatDday } from "@/lib/dday";
import { nextPathAfterLogin } from "@/lib/equipmentSync";
import { loadMyProfile, useMyProfile } from "@/lib/myProfile";

/** 첫 화면의 바탕색. 나중에 이미지를 넣을 때까지는 한 가지 색만 쓴다. */
const BACKGROUND = "#101722";

/**
 * 첫 화면.
 * 가운데에 슬로건과 '체단실 마지막 이용까지 D-XX'(전역일을 정한 사람만)가 있고,
 * [입장하기]를 누르면 로그인 창이 나온다. 이미 로그인한 사람은 바로 들어간다.
 */
export default function Landing() {
  const router = useRouter();
  const { profile } = useMyProfile();
  const [phase, setPhase] = useState<"intro" | "login">("intro");
  const [entering, setEntering] = useState(false);

  // 전역일을 모르면 'D-day' 라는 글자를 그대로 보여 주고, 알면 D-123 처럼 남은 날을 보여 준다.
  // 전역일 당일(D-DAY)이거나 이미 지났으면 이용이 끝났다고 알려 준다.
  const days = daysUntil(profile?.dischargeDate);
  const dday = formatDday(days);
  const finished = days !== null && days <= 0;
  const intro = phase === "intro";

  async function handleEnter() {
    setEntering(true);
    const me = await loadMyProfile();
    if (me) {
      // 기구를 이미 등록한 계정은 바로 운동 시작으로 간다.
      router.push(await nextPathAfterLogin());
      return;
    }
    setEntering(false);
    setPhase("login");
  }

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: BACKGROUND,
        color: "#f4f7fb",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 24px",
          opacity: intro ? 1 : 0,
          transition: "opacity 0.5s ease",
          pointerEvents: "none",
        }}
      >
        <h1 style={{ margin: 0, fontWeight: 800, wordBreak: "keep-all" }}>
          {finished ? (
            <span style={{ fontSize: "clamp(26px, 6.5vw, 44px)", lineHeight: 1.3 }}>
              체단실 이용이
              <br />
              종료되었습니다
            </span>
          ) : (
            <>
              <span
                style={{
                  display: "block",
                  fontSize: "clamp(20px, 5vw, 30px)",
                  lineHeight: 1.3,
                  opacity: 0.9,
                }}
              >
                체단실 이용 종료
              </span>
              <span
                style={{
                  display: "block",
                  marginTop: 10,
                  fontSize: "clamp(56px, 17vw, 110px)",
                  lineHeight: 1,
                  letterSpacing: 1,
                }}
              >
                {dday ?? "D-day"}
              </span>
            </>
          )}
        </h1>
      </div>

      <button
        type="button"
        onClick={handleEnter}
        disabled={!intro || entering}
        style={{
          position: "absolute",
          left: "50%",
          bottom: "12%",
          transform: "translateX(-50%)",
          padding: "16px 48px",
          whiteSpace: "nowrap",
          fontSize: 20,
          fontWeight: 700,
          color: BACKGROUND,
          background: "#f4f7fb",
          border: "none",
          borderRadius: 999,
          cursor: "pointer",
          opacity: intro ? 1 : 0,
          transition: "opacity 0.4s ease",
          pointerEvents: intro ? "auto" : "none",
        }}
      >
        {entering ? "입장 중..." : "입장하기"}
      </button>

      <div
        aria-hidden={intro}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          opacity: intro ? 0 : 1,
          transform: intro ? "scale(0.96)" : "scale(1)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
          pointerEvents: intro ? "none" : "auto",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            maxHeight: "92vh",
            overflowY: "auto",
            padding: 24,
            color: "#111",
            colorScheme: "light",
            background: "rgba(255,255,255,0.96)",
            borderRadius: 16,
          }}
        >
          {!intro && <LoginForm />}
          <p style={{ marginBottom: 0 }}>
            <button type="button" onClick={() => setPhase("intro")}>
              ← 돌아가기
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
