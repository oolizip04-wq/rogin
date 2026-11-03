import { redirect } from "next/navigation";

// 운동 목록은 '가능한 운동 보기'(/workout/available)에서 부위를 고른 뒤에 보여 줍니다.
export default function ExercisesPage() {
  redirect("/workout/available");
}
