"use client";

import { useEffect, useState } from "react";

const PHONE_W = 390; // 화면 폭 (iPhone 14 급)
const PHONE_H = 844;
const BEZEL = 12;
const STATUS_H = 48; // 위쪽 상태 표시줄 높이

/** 홈 화면을 나타내는 특별한 값 */
export const HOME = "__home";

export const PHONE_SCREENS = [
  { label: "홈 화면", path: HOME },
  { label: "첫 화면", path: "/" },
  { label: "기구 선택", path: "/equipment?edit=1" },
  { label: "운동 시작", path: "/workout" },
  { label: "가능한 운동", path: "/workout/available" },
  { label: "나의 루틴", path: "/routines" },
  { label: "운동 상세", path: "/exercises/pushup" },
];

// 홈 화면에 같이 놓는 가짜 앱들 (보기용)
const OTHER_APPS = [
  { name: "전화", emoji: "📞", bg: "#2fb457" },
  { name: "메시지", emoji: "💬", bg: "#3a9bf4" },
  { name: "카메라", emoji: "📷", bg: "#6b7280" },
  { name: "지도", emoji: "🗺️", bg: "#4cb36c" },
  { name: "사진", emoji: "🖼️", bg: "#f2a43a" },
  { name: "시계", emoji: "⏰", bg: "#1f2937" },
  { name: "메모", emoji: "📝", bg: "#f5d547" },
  { name: "설정", emoji: "⚙️", bg: "#8a93a0" },
];

type View = typeof HOME | "launching" | string;

/**
 * 앱을 켠 것처럼 휴대폰 모양 틀 안에 보여 준다. (보기용)
 * 홈 화면에서 '체단실' 아이콘을 누르면 앱이 실행되고(시작 화면), 안의 화면은 실제 사이트다.
 * 아래 홈 막대를 누르면 다시 홈 화면으로 돌아간다.
 */
export default function PhoneFrame({ initialPath = HOME }: { initialPath?: string }) {
  const [view, setView] = useState<View>(initialPath);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function fit() {
      const availH = window.innerHeight - 90; // 위쪽 버튼 줄 만큼 뺀다
      const availW = window.innerWidth - 24;
      const s = Math.min(
        1,
        availH / (PHONE_H + BEZEL * 2),
        availW / (PHONE_W + BEZEL * 2),
      );
      setScale(Math.max(0.2, s));
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // 아이콘을 누르면 잠깐 시작 화면을 보여 준 뒤 앱 첫 화면으로 넘어간다.
  useEffect(() => {
    if (view !== "launching") return;
    const timer = setTimeout(() => setView("/"), 1100);
    return () => clearTimeout(timer);
  }, [view]);

  const outerW = PHONE_W + BEZEL * 2;
  const outerH = PHONE_H + BEZEL * 2;
  const inApp = view !== HOME && view !== "launching";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#1b1f24",
        color: "#e8eef7",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "10px 12px 16px",
        boxSizing: "border-box",
      }}
    >
      <nav
        aria-label="화면 고르기"
        style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 10 }}
      >
        {PHONE_SCREENS.map((s) => (
          <button
            key={s.path}
            type="button"
            onClick={() => setView(s.path)}
            aria-pressed={view === s.path}
            style={{ fontWeight: view === s.path ? 700 : 400, fontSize: 12, padding: "4px 8px" }}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* 줄인 크기만큼만 자리를 차지하게 바깥 상자를 따로 둔다. */}
      <div style={{ width: outerW * scale, height: outerH * scale }}>
        <div
          style={{
            width: outerW,
            height: outerH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "relative",
            boxSizing: "border-box",
            border: `${BEZEL}px solid #0b0d10`,
            borderRadius: 52,
            background: "#000",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 0 0 2px #2b3138",
            overflow: "hidden",
          }}
        >
          {/* ───── 홈 화면 ───── */}
          {view === HOME && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(160deg, #26406e 0%, #101a2e 55%, #3a2358 100%)",
                color: "#fff",
              }}
            >
              <div style={{ textAlign: "center", marginTop: 90 }}>
                <div style={{ fontSize: 76, fontWeight: 300, lineHeight: 1 }}>9:41</div>
                <div style={{ fontSize: 18, opacity: 0.85, marginTop: 6 }}>11월 5일 목요일</div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "22px 8px",
                  padding: "56px 22px 0",
                }}
              >
                {/* 체단실 앱 아이콘 */}
                <button
                  type="button"
                  onClick={() => setView("launching")}
                  aria-label="체단실 앱 열기"
                  style={{
                    background: "none",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                    padding: 0,
                    textAlign: "center",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/icon-192.png"
                    alt=""
                    width={62}
                    height={62}
                    style={{ borderRadius: 14, display: "block", margin: "0 auto 6px" }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 700 }}>체단실</span>
                </button>
                {OTHER_APPS.slice(0, 7).map((a) => (
                  <div key={a.name} style={{ textAlign: "center" }} aria-hidden="true">
                    <div
                      style={{
                        width: 62,
                        height: 62,
                        borderRadius: 14,
                        background: a.bg,
                        margin: "0 auto 6px",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 30,
                      }}
                    >
                      {a.emoji}
                    </div>
                    <span style={{ fontSize: 12 }}>{a.name}</span>
                  </div>
                ))}
              </div>

              {/* 아래 독 */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 14,
                  right: 14,
                  bottom: 22,
                  height: 88,
                  borderRadius: 30,
                  background: "rgba(255,255,255,0.18)",
                  display: "flex",
                  justifyContent: "space-around",
                  alignItems: "center",
                }}
              >
                {OTHER_APPS.slice(0, 4).map((a) => (
                  <div
                    key={a.name}
                    style={{
                      width: 62,
                      height: 62,
                      borderRadius: 14,
                      background: a.bg,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 30,
                    }}
                  >
                    {a.emoji}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ───── 앱 실행 중(시작 화면) ───── */}
          {view === "launching" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#101722",
                display: "grid",
                placeItems: "center",
              }}
            >
              <div style={{ textAlign: "center", animation: "phone-launch 1s ease-out both" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/icon-192.png" alt="" width={120} height={120} style={{ borderRadius: 26 }} />
                <div style={{ marginTop: 14, fontSize: 22, fontWeight: 700, color: "#f4f7fb" }}>체단실</div>
              </div>
            </div>
          )}

          {/* ───── 앱 화면 ───── */}
          {inApp && (
            <>
              {/* 상태 표시줄: 앱 화면이 카메라 구멍에 가리지 않도록 그 아래에서 시작한다. */}
              <div
                aria-hidden="true"
                style={{
                  height: STATUS_H,
                  background: "#000",
                  color: "#fff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 26px 0",
                  boxSizing: "border-box",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                <span>9:41</span>
                <span style={{ letterSpacing: 2 }}>▂▄▆ 5G ▮</span>
              </div>
              <iframe
                key={view}
                title="체단실 앱 화면"
                src={view}
                width={PHONE_W}
                height={PHONE_H - STATUS_H}
                style={{ border: "none", display: "block", background: "#fff" }}
              />
            </>
          )}

          {/* 위쪽 카메라 구멍 (장식) */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
              width: 110,
              height: 28,
              borderRadius: 14,
              background: "#0b0d10",
              pointerEvents: "none",
            }}
          />
          {/* 아래 홈 막대: 누르면 홈 화면으로 */}
          <button
            type="button"
            onClick={() => setView(HOME)}
            aria-label="홈 화면으로"
            style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 170,
              height: 24,
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            <span
              style={{
                display: "block",
                width: 130,
                height: 5,
                borderRadius: 3,
                background: "rgba(128,128,128,0.8)",
              }}
            />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes phone-launch {
          from { transform: scale(0.55); opacity: 0.2; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </main>
  );
}
