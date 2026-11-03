"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EXERCISES, getExercise } from "@/lib/data";
import { BODY_PARTS, BODY_PART_LABELS } from "@/lib/equipment";
import { filterExercises } from "@/lib/filter";
import { AREA_INFO } from "@/lib/labels";
import { MAX_EXERCISES, MAX_NAME, MAX_ROUTINES, type Routine } from "@/lib/routineStore";
import { useOwnedEquipment } from "@/lib/useOwnedEquipment";
import { useRoutines } from "@/lib/useRoutines";
import type { BodyPart, Exercise } from "@/lib/types";

/** 운동이 속한 큰 부위 (가장 먼저 적힌 세부 부위 기준) */
function primaryPart(ex: Exercise): BodyPart {
  return AREA_INFO[ex.areas[0]].part;
}

/**
 * 루틴 만들기.
 *  - 루틴 목록: 이름을 정해 여러 개 만들고, 편집·삭제한다.
 *  - 루틴 편집: 할 수 있는 운동을 부위별로 보고 담은 뒤, 담은 운동의 순서를 바꾼다.
 */
export default function RoutinesApp({ initialEditId = null }: { initialEditId?: string | null }) {
  const router = useRouter();
  const { routines, create, rename, remove, add, removeExercise, move } = useRoutines();
  const { ids: ownedIds } = useOwnedEquipment();
  const [editingId, setEditingId] = useState<string | null>(initialEditId);
  const [newName, setNewName] = useState("");
  const [onlyMine, setOnlyMine] = useState(true);

  const editing = routines.find((r) => r.id === editingId) ?? null;

  const choices = useMemo(
    () => (onlyMine ? filterExercises(EXERCISES, ownedIds) : EXERCISES),
    [onlyMine, ownedIds],
  );

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const id = create(newName);
    if (id) {
      setNewName("");
      setEditingId(id);
    }
  }

  /**
   * 루틴은 담을 때마다 바로 저장되어 있다. [저장하고 돌아가기]는 그 상태로 마치고 전 화면으로 돌아간다.
   * 전 화면이 없으면(주소로 바로 들어온 경우) 내 루틴 보기로 간다.
   */
  function handleSave() {
    if (editing && !editing.name.trim()) rename(editing.id, "루틴");
    if (window.history.length > 1) router.back();
    else router.push("/routines");
  }

  function handleDelete(r: Routine) {
    if (window.confirm(`'${r.name}' 루틴을 삭제할까요?`)) {
      remove(r.id);
      if (editingId === r.id) setEditingId(null);
    }
  }

  // ───────── 루틴 편집 화면 ─────────
  if (editing) {
    const picked = editing.exerciseIds
      .map((id) => getExercise(id))
      .filter((ex): ex is Exercise => ex !== undefined);
    const full = editing.exerciseIds.length >= MAX_EXERCISES;

    return (
      <div>
        <p>
          <button type="button" onClick={() => setEditingId(null)}>
            ← 루틴 목록
          </button>
        </p>

        <label>
          루틴 이름
          <br />
          <input
            type="text"
            value={editing.name}
            maxLength={MAX_NAME}
            onChange={(e) => rename(editing.id, e.target.value)}
            onBlur={() => {
              if (!editing.name.trim()) rename(editing.id, "루틴");
            }}
            style={{ width: "100%", fontSize: 18 }}
          />
        </label>

        <section>
          <h2>담은 운동 ({picked.length})</h2>
          {picked.length === 0 ? (
            <p>
              <small>아래에서 운동을 골라 담아 보세요.</small>
            </p>
          ) : (
            <ol style={{ paddingLeft: 24 }}>
              {picked.map((ex, i) => (
                <li key={ex.id} style={{ marginBottom: 6 }}>
                  <Link href={`/exercises/${ex.id}`}>
                    <strong>{ex.name}</strong>
                  </Link>{" "}
                  <small>{ex.areas.join(" · ")}</small>
                  <br />
                  <button
                    type="button"
                    onClick={() => move(editing.id, ex.id, -1)}
                    disabled={i === 0}
                    aria-label={`${ex.name} 위로`}
                  >
                    ▲ 위로
                  </button>{" "}
                  <button
                    type="button"
                    onClick={() => move(editing.id, ex.id, 1)}
                    disabled={i === picked.length - 1}
                    aria-label={`${ex.name} 아래로`}
                  >
                    ▼ 아래로
                  </button>{" "}
                  <button type="button" onClick={() => removeExercise(editing.id, ex.id)}>
                    빼기
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section>
          <h2>운동 고르기</h2>
          <label>
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
            />{" "}
            내 기구로 할 수 있는 운동만 보기
          </label>
          {onlyMine && ownedIds.length === 0 && (
            <p>
              <small>
                선택한 기구가 없어서 맨몸 운동만 보입니다.{" "}
                <Link href="/equipment">기구 선택하러 가기</Link>
              </small>
            </p>
          )}
          {full && (
            <p role="status">한 루틴에는 운동을 {MAX_EXERCISES}개까지 담을 수 있습니다.</p>
          )}

          {BODY_PARTS.map((part) => {
            const list = choices.filter((ex) => primaryPart(ex) === part);
            if (list.length === 0) return null;
            const taken = list.filter((ex) => editing.exerciseIds.includes(ex.id)).length;
            return (
              <details key={part}>
                <summary>
                  <strong>{BODY_PART_LABELS[part]}</strong>{" "}
                  <small>
                    ({list.length}개{taken > 0 ? ` · 담음 ${taken}` : ""})
                  </small>
                </summary>
                <ul style={{ listStyle: "none", paddingLeft: 8 }}>
                  {list.map((ex) => {
                    const inRoutine = editing.exerciseIds.includes(ex.id);
                    return (
                      <li key={ex.id} style={{ marginBottom: 6 }}>
                        <Link href={`/exercises/${ex.id}`}>{ex.name}</Link>{" "}
                        <small>{ex.areas.join(" · ")}</small>{" "}
                        {inRoutine ? (
                          <button type="button" onClick={() => removeExercise(editing.id, ex.id)}>
                            ✓ 담음 (누르면 빼기)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => add(editing.id, ex.id)}
                            disabled={full}
                          >
                            + 담기
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </details>
            );
          })}
        </section>

        {/* 스크롤을 내려도 화면 아래에 붙어 있어서 언제든 저장하고 돌아갈 수 있다. */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            padding: "10px 0",
            background: "Canvas",
            color: "CanvasText",
          }}
        >
          <button
            type="button"
            onClick={handleSave}
            style={{ padding: "12px 24px", fontWeight: 700, width: "100%" }}
          >
            저장하고 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // ───────── 루틴 목록 화면 ─────────
  return (
    <div>
      <section>
        <h2>새 루틴</h2>
        <form onSubmit={handleCreate}>
          <label>
            새 루틴 이름
            <br />
            <input
              type="text"
              value={newName}
              maxLength={MAX_NAME}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="예: 가슴 데이, 월요일 루틴"
              style={{ width: "100%", fontSize: 18 }}
            />
          </label>
          <p>
            <button
              type="submit"
              disabled={routines.length >= MAX_ROUTINES}
              style={{ padding: "10px 20px", fontWeight: 700 }}
            >
              + 루틴 만들기
            </button>
            {routines.length >= MAX_ROUTINES && (
              <small> 루틴은 {MAX_ROUTINES}개까지 만들 수 있습니다.</small>
            )}
          </p>
        </form>
      </section>

      <section>
        <h2>내 루틴 ({routines.length})</h2>
        {routines.length === 0 ? (
          <p>
            <small>아직 만든 루틴이 없습니다. 위에서 이름을 정해 만들어 보세요.</small>
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {routines.map((r) => (
              <li key={r.id} style={{ marginBottom: 12 }}>
                <strong>{r.name}</strong> <small>· 운동 {r.exerciseIds.length}개</small>
                <br />
                <button type="button" onClick={() => setEditingId(r.id)}>
                  편집
                </button>{" "}
                <button type="button" onClick={() => handleDelete(r)}>
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
