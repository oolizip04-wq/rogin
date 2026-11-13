"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EXERCISES, getExercise } from "@/lib/data";
import MuscleMap from "@/components/MuscleMap";
import { filterExercises } from "@/lib/filter";
import { AREAS_BY_PART, AREA_INFO } from "@/lib/labels";
import { MAX_EXERCISES, MAX_NAME, MAX_ROUTINES, type Routine } from "@/lib/routineStore";
import { useExercisePhotos } from "@/lib/useExercisePhotos";
import { useOwnedEquipment } from "@/lib/useOwnedEquipment";
import { useRoutines } from "@/lib/useRoutines";
import type { BodyPart, Exercise } from "@/lib/types";

/** 운동 고르기의 부위 탭 (가능한 운동 화면과 같은 순서) */
const PICK_TABS: { part: BodyPart; label: string }[] = [
  { part: "chest", label: "가슴" },
  { part: "back", label: "등" },
  { part: "shoulders", label: "어깨" },
  { part: "legs", label: "하체" },
  { part: "arms", label: "팔" },
  { part: "abs", label: "복근" },
];

/** 운동이 속한 큰 부위 (가장 먼저 적힌 세부 부위 기준) */
function primaryPart(ex: Exercise): BodyPart {
  return AREA_INFO[ex.areas[0]].part;
}

/**
 * 나의 루틴.
 *  - 루틴 목록: 이름을 정해 여러 개 만들고, 펼쳐서 운동 순서를 보고, 편집·삭제한다.
 *  - 루틴 편집: 할 수 있는 운동을 부위별로 보고 담은 뒤, 담은 운동의 순서를 바꾼다.
 */
export default function RoutinesApp() {
  const { routines, create, rename, remove, add, removeExercise, move } = useRoutines();
  const { ids: ownedIds } = useOwnedEquipment();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [onlyMine, setOnlyMine] = useState(true);
  const [pickTab, setPickTab] = useState<BodyPart>("chest");
  const photos = useExercisePhotos();

  const editing = routines.find((r) => r.id === editingId) ?? null;

  const choices = useMemo(
    () => (onlyMine ? filterExercises(EXERCISES, ownedIds) : EXERCISES),
    [onlyMine, ownedIds],
  );

  function handleCreate() {
    // 이름을 비워 두면 '루틴 1', '루틴 2'처럼 자동으로 붙는다. 이름은 편집 화면에서 바꾼다.
    const id = create("");
    if (id) setEditingId(id);
  }

  /**
   * 루틴은 담을 때마다 바로 저장되어 있다. [저장하고 돌아가기]는 그 상태로 마치고
   * 나의 루틴 목록(전 화면)으로 돌아간다. 방금 고친 루틴은 펼쳐 둔다.
   */
  function handleSave() {
    if (editing) {
      if (!editing.name.trim()) rename(editing.id, "루틴");
      setOpenId(editing.id);
    }
    setEditingId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            ← 나의 루틴
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
          <h2>추가한 운동 ({picked.length})</h2>
          {picked.length === 0 ? (
            <p>
              <small>아래에서 운동을 골라 추가해 보세요.</small>
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
          {/* 추가한 운동을 다 정했으면 여기서 바로 저장하고 목록으로 돌아간다. */}
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            style={{ width: "100%", minHeight: 48, fontSize: 16, marginTop: 8 }}
          >
            저장하기
          </button>
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
            <p role="status">한 루틴에는 운동을 {MAX_EXERCISES}개까지 추가할 수 있습니다.</p>
          )}

          {/* 부위 탭: 추가한 개수가 있으면 탭에 함께 보여 준다 */}
          <div
            role="tablist"
            aria-label="운동 부위"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, margin: "12px 0 14px" }}
          >
            {PICK_TABS.map(({ part, label }) => {
              const on = pickTab === part;
              const inPart = choices.filter((ex) => primaryPart(ex) === part);
              const taken = inPart.filter((ex) => editing.exerciseIds.includes(ex.id)).length;
              return (
                <button
                  key={part}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setPickTab(part)}
                  style={{
                    minHeight: 44,
                    color: on ? "var(--cream)" : "var(--ink)",
                    background: on ? "var(--rust)" : "var(--cream)",
                    borderColor: on ? "#8e3d29" : "#b5b09a",
                    boxShadow: on ? "none" : "3px 3px 0 var(--shadow)",
                  }}
                >
                  {label}
                  <small style={{ marginLeft: 5, color: "inherit", opacity: 0.85 }}>
                    {taken > 0 ? `${taken}/${inPart.length}` : inPart.length}
                  </small>
                </button>
              );
            })}
          </div>

          {(() => {
            const list = choices.filter((ex) => primaryPart(ex) === pickTab);
            if (list.length === 0) {
              return (
                <p>
                  <small>
                    이 부위에는 지금 고를 수 있는 운동이 없습니다.
                  </small>
                </p>
              );
            }
            // 세부 부위(윗가슴·중앙가슴…)별로 묶어 보여 준다. 여러 부위에 걸친 운동은 한 곳에만 나오게
            // 첫 번째 부위에 넣는다.
            const groups = AREAS_BY_PART[pickTab]
              .map((area) => ({ area, items: list.filter((ex) => ex.areas[0] === area) }))
              .filter((g) => g.items.length > 0);
            return (
              <div>
                {groups.map(({ area, items }) => (
                  <section key={area}>
                    <h3
                      style={{
                        margin: "18px 0 10px",
                        paddingBottom: 4,
                        fontSize: 13,
                        fontWeight: 800,
                        borderBottom: "2px solid var(--ink)",
                      }}
                    >
                      {area}
                    </h3>
              <ul
                className="plain-list"
                style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}
              >
                {items.map((ex) => {
                  const inRoutine = editing.exerciseIds.includes(ex.id);
                  return (
                    <li
                      key={ex.id}
                      className="card"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        padding: 8,
                        boxShadow: "none",
                        borderColor: inRoutine ? "var(--rust)" : "#b5b09a",
                      }}
                    >
                      <Link
                        href={`/exercises/${ex.id}`}
                        aria-label={`${ex.name} 운동법 보기`}
                        style={{ display: "block", width: "100%", aspectRatio: "4 / 3", borderRadius: 8, overflow: "hidden", background: "#eef1f5" }}
                      >
                        {photos[ex.id] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photos[ex.id]}
                            alt={`${ex.name} 운동법`}
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          <MuscleMap muscles={ex.muscles} compact />
                        )}
                      </Link>
                      <div style={{ flex: 1, minWidth: 0, padding: "0 2px" }}>
                        <Link href={`/exercises/${ex.id}`} style={{ color: "var(--ink)" }}>
                          <strong style={{ wordBreak: "keep-all" }}>{ex.name}</strong>
                        </Link>
                      </div>
                      {inRoutine ? (
                        <button
                          type="button"
                          aria-pressed="true"
                          onClick={() => removeExercise(editing.id, ex.id)}
                          style={{ width: "100%" }}
                        >
                          ✓ 추가됨
                        </button>
                      ) : (
                        <button type="button" onClick={() => add(editing.id, ex.id)} disabled={full} style={{ width: "100%" }}>
                          + 추가하기
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
                  </section>
                ))}
              </div>
            );
          })()}
        </section>

        {/* 스크롤을 내려도 화면 아래에 붙어 있어서 언제든 저장하고 돌아갈 수 있다. */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            padding: "10px 0",
            background: "var(--paper)",
            color: "var(--ink)",
          }}
        >
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            style={{ width: "100%", minHeight: 48, fontSize: 16 }}
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
      <section style={{ marginTop: 14 }}>
        {/* 이름은 만든 뒤 편집 화면에서 정한다. */}
        <button
          type="button"
          className="btn-primary"
          onClick={handleCreate}
          disabled={routines.length >= MAX_ROUTINES}
          style={{ width: "100%", minHeight: 48, fontSize: 16 }}
        >
          + 루틴 만들기
        </button>
        {routines.length >= MAX_ROUTINES && (
          <p style={{ marginTop: 8 }}>
            <small>루틴은 {MAX_ROUTINES}개까지 만들 수 있습니다.</small>
          </p>
        )}
      </section>

      <section>
        <h2>나의 루틴 ({routines.length})</h2>
        {routines.length === 0 ? (
          <p>
            <small>아직 만든 루틴이 없습니다. 위의 [+ 루틴 만들기]를 눌러 보세요.</small>
          </p>
        ) : (
          routines.map((r) => {
            const exercises = r.exerciseIds
              .map((id) => getExercise(id))
              .filter((ex): ex is Exercise => ex !== undefined);
            return (
              <details key={r.id} open={openId === r.id} style={{ marginBottom: 12 }}>
                <summary
                  onClick={(e) => {
                    // 한 번에 하나만 열리도록 직접 관리한다. (하나를 열면 열려 있던 다른 루틴은 닫힌다)
                    e.preventDefault();
                    setOpenId((cur) => (cur === r.id ? null : r.id));
                  }}
                >
                  <strong>{r.name}</strong> <small>· 운동 {exercises.length}개</small>
                </summary>
                {exercises.length === 0 ? (
                  <p>
                    <small>추가한 운동이 없습니다.</small>
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
                  <button type="button" onClick={() => setEditingId(r.id)}>
                    편집
                  </button>{" "}
                  <button type="button" onClick={() => handleDelete(r)}>
                    삭제
                  </button>
                </p>
              </details>
            );
          })
        )}
      </section>
    </div>
  );
}
