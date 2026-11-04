import { Suspense } from "react";
import PhoneRoute from "@/components/PhoneRoute";

// 앱을 켠 것처럼 휴대폰 모양 틀 안에서 보는 화면 (보기용)
// 예: /phone?path=/workout 처럼 처음에 띄울 화면을 정할 수 있습니다.
export default function PhonePage() {
  return (
    <Suspense fallback={null}>
      <PhoneRoute />
    </Suspense>
  );
}
