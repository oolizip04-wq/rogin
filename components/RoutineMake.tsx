"use client";

import { useSearchParams } from "next/navigation";
import RoutinesApp from "@/components/RoutinesApp";

/** 주소의 ?edit=루틴id 가 있으면 그 루틴의 편집 화면으로 바로 들어간다. */
export default function RoutineMake() {
  const edit = useSearchParams().get("edit");
  return <RoutinesApp initialEditId={edit} />;
}
