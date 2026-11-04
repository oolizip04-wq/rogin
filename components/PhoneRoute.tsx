"use client";

import { useSearchParams } from "next/navigation";
import PhoneFrame, { HOME, PHONE_SCREENS } from "@/components/PhoneFrame";

/** 주소의 ?path=... 로 처음에 띄울 화면을 고른다. 목록에 있는 화면만 허용하고, 없으면 홈 화면에서 시작한다. */
export default function PhoneRoute() {
  const wanted = useSearchParams().get("path");
  const initial = PHONE_SCREENS.find((s) => s.path === wanted)?.path ?? HOME;
  return <PhoneFrame initialPath={initial} />;
}
