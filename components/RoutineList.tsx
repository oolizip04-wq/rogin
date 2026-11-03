"use client";

import Link from "next/link";
import { useState } from "react";
import { getExercise } from "@/lib/data";
import type { Routine } from "@/lib/routineStore";
import { useRoutines } from "@/lib/useRoutines";
import type { Exercise } from "@/lib/types";

/** 내 루틴 보기: 만든 루틴과 그 안의 운동 순서를 보여 준다. (고치는 건 '루틴 만들기'에서) */
export default function RoutineList() {
  const { routines, remove } = useRoutines();
  /** 지금 펼쳐진 루틴. 하나를 펼치면 열려 있던 다른 루틴은 닫힌다. */
  const [openId, setOpenId] = useState<string | null>(null);

  function handleDelete(r: Routine) {
    if (window.confirm(`'${r.name}' 루틴을 삭제할까요?`)) remove(r.id);
  }

  if (routines.length === 0) {
    return (
      <p>
        아직 만든 루틴이 없습니다. <Link href="/routines/new">루틴 만들기</Link>
      </p>
    );
  }

  return (
    <div>
      {routines.map((r) => {
        const exercises = r.exerciseIds
          .map((id) => getExercise(id))
          .filter((ex): ex is Exercise => ex !== undefined);
        return (
          <details key={r.id} open={openId === r.id} style={{ marginBottom: 12 }}>
            <summary
              onClick={(e) => {
                // 브라우저 기본 열고 닫기 대신, 한 번에 하나만 열리도록 직접 관리한다.
                e.preventDefault();
                setOpenId((cur) => (cur === r.id ? null : r.id));
              }}
            >
              <strong>{r.name}</strong> <small>· 운동 {exercises.length}개</small>
            </summary>
            {exercises.length === 0 ? (
              <p>
                <small>담은 운동이 없습니다.</small>
              </p>
            ) : (
              <ol style={{ paddingLeft: 28 }}>
                {exercises.map((ex) => (
                  <li key={ex.id} style={{ marginBottom: 4 }}>
                    <Link href={`/exercises/${ex.id}`}>
                      <strong>{ex.name}</strong>
                    </Link>{" "}
                    <small>{ex.areas.join(" · ")}</small>
                  </li>
                ))}
              </ol>
            )}
            <p>
              <Link href={`/routines/new?edit=${r.id}`}>편집</Link>{" "}
              <button type="button" onClick={() => handleDelete(r)}>
                삭제
              </button>
            </p>
          </details>
        );
      })}
    </div>
  );
}
