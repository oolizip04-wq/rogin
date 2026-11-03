"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const STAR_COUNT = 450;
const IDLE_SPEED = 0.0012;
const WARP_SPEED = 0.035;

type Star = { x: number; y: number; z: number };

function newStar(randomZ: boolean): Star {
  return {
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    z: randomZ ? Math.random() : 1,
  };
}

/**
 * 첫 화면. 별이 천천히 흐르는 배경 위에 문장과 [시작하기]를 두고,
 * 누르면 별이 앞으로 쏟아지듯 가속하면서 로그인 창이 떠오른다.
 * (three.js 를 쓰지 않고 canvas 2D 로 같은 느낌을 낸다.)
 */
export default function Landing() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetSpeed = useRef(IDLE_SPEED);
  const [phase, setPhase] = useState<"intro" | "login">("intro");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const stars = Array.from({ length: STAR_COUNT }, () => newStar(true));
    let speed = IDLE_SPEED;
    let width = 0;
    let height = 0;
    let frame = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function project(s: Star, z: number) {
      const scale = Math.max(width, height) * 0.5;
      return { x: width / 2 + (s.x / z) * scale * 0.5, y: height / 2 + (s.y / z) * scale * 0.5 };
    }

    function tick() {
      // 목표 속도로 부드럽게 가까워진다 (스르륵).
      speed += (targetSpeed.current - speed) * 0.04;
      ctx!.fillStyle = "#05070a";
      ctx!.fillRect(0, 0, width, height);
      ctx!.strokeStyle = "#e8eef7";
      ctx!.lineCap = "round";

      for (const s of stars) {
        const prevZ = s.z;
        s.z -= reduceMotion ? IDLE_SPEED : speed;
        const p = project(s, s.z);
        if (s.z <= 0.02 || p.x < -50 || p.x > width + 50 || p.y < -50 || p.y > height + 50) {
          Object.assign(s, newStar(false));
          continue;
        }
        const from = project(s, Math.min(prevZ + speed * 1.5, 1.5));
        ctx!.globalAlpha = Math.min(1, (1 - s.z) * 1.2 + 0.1);
        ctx!.lineWidth = Math.max(0.6, (1 - s.z) * 2.2);
        ctx!.beginPath();
        ctx!.moveTo(from.x, from.y);
        ctx!.lineTo(p.x, p.y);
        ctx!.stroke();
      }
      ctx!.globalAlpha = 1;
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  async function handleStart() {
    targetSpeed.current = WARP_SPEED;

    let loggedIn = false;
    if (isSupabaseConfigured) {
      const { data } = await createClient().auth.getUser();
      loggedIn = Boolean(data.user);
    }

    if (loggedIn) {
      setTimeout(() => router.push("/equipment"), 900);
      return;
    }
    setTimeout(() => {
      setPhase("login");
      targetSpeed.current = IDLE_SPEED * 6; // 로그인 창 뒤에서는 천천히 흐른다.
    }, 700);
  }

  function handleBack() {
    setPhase("intro");
    targetSpeed.current = IDLE_SPEED;
  }

  const intro = phase === "intro";

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#05070a",
        color: "#f4f7fb",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />

      <style>{`
        .landing-title { left: 8vw; top: 50%; transform: translateY(-50%); max-width: 46vw; }
        .landing-start { right: 8vw; top: 50%; transform: translateY(-50%); }
        @media (max-width: 700px) {
          .landing-title { left: 6vw; top: 36%; max-width: 88vw; }
          .landing-start { right: 50%; top: auto; bottom: 14%; transform: translateX(50%); }
        }
      `}</style>

      <h1
        className="landing-title"
        style={{
          position: "absolute",
          margin: 0,
          wordBreak: "keep-all",
          fontSize: "clamp(28px, 5.5vw, 76px)",
          lineHeight: 1.2,
          fontWeight: 800,
          opacity: intro ? 1 : 0,
          transition: "opacity 0.7s ease",
          pointerEvents: "none",
        }}
      >
        오늘 든 쇠가
        <br />
        내일의 전투력이다.
      </h1>

      <button
        type="button"
        onClick={handleStart}
        disabled={!intro}
        className="landing-start"
        style={{
          position: "absolute",
          padding: "16px 40px",
          whiteSpace: "nowrap",
          fontSize: 20,
          fontWeight: 700,
          color: "#05070a",
          background: "#f4f7fb",
          border: "none",
          borderRadius: 999,
          cursor: "pointer",
          opacity: intro ? 1 : 0,
          transition: "opacity 0.5s ease",
          pointerEvents: intro ? "auto" : "none",
        }}
      >
        시작하기
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
          transform: intro ? "scale(0.94)" : "scale(1)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
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
            <button type="button" onClick={handleBack}>
              ← 돌아가기
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
