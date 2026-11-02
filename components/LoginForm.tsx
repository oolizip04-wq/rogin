"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { randomNickname } from "@/lib/nickname";
import UnitPicker, { type UnitValue } from "@/components/UnitPicker";

type Mode = "login" | "signup";
type CheckStatus = "checking" | "available" | "taken" | "error";
/** value 는 확인을 요청한 입력값. 입력이 바뀌면 이전 확인 결과는 무효가 된다. */
type Check = { value: string; status: CheckStatus };

export default function LoginForm({ notice }: { notice?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(notice ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState("");
  const [unit, setUnit] = useState<UnitValue | null>(null);
  const [emailCheck, setEmailCheck] = useState<Check | null>(null);
  const [nicknameCheck, setNicknameCheck] = useState<Check | null>(null);
  /** 인증 메일을 다시 보낼 수 있는 이메일. 인증이 필요한 상태일 때만 값이 있다. */
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!isSupabaseConfigured) {
    return (
      <p>
        Supabase 설정이 비어 있습니다. <code>.env.local</code>에 URL과 키를 넣고
        개발 서버를 다시 시작하세요.
      </p>
    );
  }

  const emailValue = email.trim();
  const nicknameValue = nickname.trim();
  const emailOk =
    emailCheck?.value === emailValue && emailCheck.status === "available";
  const nicknameOk =
    nicknameCheck?.value === nicknameValue &&
    nicknameCheck.status === "available";

  async function runCheck(
    fn: "check_email_available" | "check_nickname_available",
    param: "p_email" | "p_nickname",
    value: string,
    set: (c: Check) => void,
  ) {
    set({ value, status: "checking" });
    const { data, error } = await createClient().rpc(fn, { [param]: value });
    if (error) {
      set({ value, status: "error" });
      return;
    }
    set({ value, status: data === true ? "available" : "taken" });
  }

  function checkEmail() {
    if (!/^\S+@\S+\.\S+$/.test(emailValue)) {
      setEmailCheck({ value: emailValue, status: "error" });
      return;
    }
    runCheck("check_email_available", "p_email", emailValue, setEmailCheck);
  }

  function checkNickname(value = nicknameValue) {
    if (value.length < 2 || value.length > 20) {
      setNicknameCheck({ value, status: "error" });
      return;
    }
    runCheck("check_nickname_available", "p_nickname", value, setNicknameCheck);
  }

  function handleRandomNickname() {
    const next = randomNickname();
    setNickname(next);
    checkNickname(next);
  }

  async function handleOAuth(provider: "google" | "kakao") {
    setError(null);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError("소셜 로그인을 시작하지 못했습니다.");
  }

  async function handleResend() {
    if (!pendingEmail || cooldown > 0) return;
    setError(null);
    setMessage(null);
    const { error } = await createClient().auth.resend({
      type: "signup",
      email: pendingEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(toKoreanError(error.message));
      return;
    }
    setMessage("인증 메일을 다시 보냈습니다. 스팸함도 확인하세요.");
    setCooldown(60);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (mode === "login") {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) {
        setError(toKoreanError(error.message));
        if (error.message.includes("Email not confirmed")) {
          setPendingEmail(email.trim());
        }
        return;
      }
      router.push("/exercises");
      router.refresh();
      return;
    }

    if (password !== passwordConfirm) {
      setError("비밀번호가 서로 다릅니다. 다시 확인하세요.");
      return;
    }
    if (!emailOk) {
      setError("이메일 중복확인을 해주세요.");
      return;
    }
    if (!nicknameOk) {
      setError("닉네임 중복확인을 해주세요.");
      return;
    }
    if (!unit) {
      setError("소속 부대를 선택하세요. (필수 항목을 모두 채워야 합니다)");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: emailValue,
      password,
      options: {
        // 인증 메일의 링크가 지금 접속한 사이트로 돌아오게 한다.
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          // display_name 은 Supabase 대시보드의 Users 목록에 이름으로 보인다.
          display_name: nicknameValue,
          nickname: nicknameValue,
          unit_branch: unit.branch,
          unit_name: unit.name,
        },
      },
    });
    setLoading(false);
    if (error) {
      setError(toKoreanError(error.message));
      return;
    }
    // 이메일 인증을 켜 둔 경우 session 이 없다.
    if (data.session) {
      router.push("/exercises");
      router.refresh();
    } else {
      setMessage("가입 확인 메일을 보냈습니다. 메일의 링크를 눌러 인증하세요.");
      setPendingEmail(emailValue);
      setCooldown(60);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{mode === "login" ? "로그인" : "회원가입"}</h2>

      <p>
        <button type="button" onClick={() => handleOAuth("kakao")}>
          카카오로 계속하기
        </button>{" "}
        <button type="button" onClick={() => handleOAuth("google")}>
          구글로 계속하기
        </button>
      </p>
      <p>또는 이메일로</p>

      <p>
        <label>
          이메일
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ width: mode === "signup" ? "calc(100% - 90px)" : "100%" }}
          />
        </label>
        {mode === "signup" && (
          <>
            {" "}
            <button
              type="button"
              onClick={checkEmail}
              disabled={emailCheck?.status === "checking"}
            >
              중복확인
            </button>
            <br />
            <CheckMessage
              check={emailCheck}
              current={emailValue}
              labels={{
                available: "사용할 수 있는 이메일입니다.",
                taken: "이미 가입된 이메일입니다.",
                error: "올바른 이메일을 입력하거나 잠시 후 다시 시도하세요.",
              }}
            />
          </>
        )}
      </p>

      <p>
        <label>
          비밀번호 (6자 이상)
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            style={{ width: "100%" }}
          />
        </label>
      </p>

      {mode === "signup" && (
        <>
          <p>
            <label>
              비밀번호 확인
              <br />
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                style={{ width: "100%" }}
              />
            </label>
            {passwordConfirm && (
              <small role="status">
                {password === passwordConfirm
                  ? "비밀번호가 일치합니다."
                  : "비밀번호가 서로 다릅니다."}
              </small>
            )}
          </p>

          <p>
            <label>
              닉네임 (2~20자)
              <br />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                minLength={2}
                maxLength={20}
                autoComplete="nickname"
                style={{ width: "calc(100% - 180px)" }}
              />
            </label>{" "}
            <button
              type="button"
              onClick={() => checkNickname()}
              disabled={nicknameCheck?.status === "checking"}
            >
              중복확인
            </button>{" "}
            <button type="button" onClick={handleRandomNickname}>
              랜덤
            </button>
            <br />
            <CheckMessage
              check={nicknameCheck}
              current={nicknameValue}
              labels={{
                available: "사용할 수 있는 닉네임입니다.",
                taken: "이미 사용 중인 닉네임입니다.",
                error: "2~20자로 입력하거나 잠시 후 다시 시도하세요.",
              }}
            />
          </p>

          <UnitPicker onChange={setUnit} />
        </>
      )}

      {error && <p role="alert">{error}</p>}
      {message && <p>{message}</p>}
      {pendingEmail && (
        <p>
          <button type="button" onClick={handleResend} disabled={cooldown > 0}>
            {cooldown > 0
              ? `인증 메일 다시 보내기 (${cooldown}초 후)`
              : "인증 메일 다시 보내기"}
          </button>
          <br />
          <small>받는 주소: {pendingEmail}</small>
        </p>
      )}

      <button type="submit" disabled={loading}>
        {loading ? "처리 중..." : mode === "login" ? "로그인" : "가입하기"}
      </button>

      <p>
        {mode === "login" ? "계정이 없나요? " : "이미 계정이 있나요? "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setMessage(null);
          }}
        >
          {mode === "login" ? "회원가입" : "로그인"}
        </button>
      </p>
    </form>
  );
}

function CheckMessage({
  check,
  current,
  labels,
}: {
  check: Check | null;
  current: string;
  labels: { available: string; taken: string; error: string };
}) {
  // 입력이 바뀐 뒤에는 이전 결과를 보여주지 않는다.
  if (!check || check.value !== current) return null;
  if (check.status === "checking") return <small>확인 중...</small>;
  return (
    <small role={check.status === "available" ? "status" : "alert"}>
      {labels[check.status]}
    </small>
  );
}

function toKoreanError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (message.includes("Email not confirmed")) {
    return "이메일 인증이 아직 완료되지 않았습니다. 메일을 확인하세요.";
  }
  if (message.includes("User already registered")) {
    return "이미 가입된 이메일입니다.";
  }
  if (message.toLowerCase().includes("password")) {
    return "비밀번호가 조건에 맞지 않습니다. 6자 이상으로 입력하세요.";
  }
  if (
    message.toLowerCase().includes("rate limit") ||
    message.includes("you can only request this after")
  ) {
    return "시도가 너무 많습니다. 잠시 후 다시 시도하세요.";
  }
  return "문제가 생겼습니다. 잠시 후 다시 시도하세요.";
}
