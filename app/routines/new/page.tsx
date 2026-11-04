import { redirect } from "next/navigation";

// 루틴 만들기는 '나의 루틴'(/routines) 안으로 합쳤습니다. 예전 주소로 들어오면 그리로 보냅니다.
export default function NewRoutinePage() {
  redirect("/routines");
}
