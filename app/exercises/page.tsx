import { redirect } from "next/navigation";

// 운동 목록은 '운동 시작'(/workout)에서 부위를 고른 뒤에 보여 줍니다.
export default function ExercisesPage() {
  redirect("/workout");
}
