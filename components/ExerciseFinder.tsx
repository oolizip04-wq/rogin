"use client";

import { useMemo, useState } from "react";
import { EQUIPMENT, EXERCISES, MUSCLE_LABELS } from "@/lib/data";
import { filterExercises } from "@/lib/filter";

export default function ExerciseFinder() {
  const [owned, setOwned] = useState<string[]>([]);

  const exercises = useMemo(() => filterExercises(EXERCISES, owned), [owned]);

  function toggle(id: string) {
    setOwned((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div>
      <section>
        <h2>우리 체단실 기구</h2>
        <p>있는 기구를 모두 선택하세요.</p>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {EQUIPMENT.map((eq) => (
            <li key={eq.id}>
              <label>
                <input
                  type="checkbox"
                  checked={owned.includes(eq.id)}
                  onChange={() => toggle(eq.id)}
                />{" "}
                {eq.name}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>할 수 있는 운동 ({exercises.length})</h2>
        <ul>
          {exercises.map((ex) => (
            <li key={ex.id}>
              <strong>{ex.name}</strong>{" "}
              <small>
                {ex.muscles.map((m) => MUSCLE_LABELS[m]).join(", ")}
              </small>
              <p>{ex.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
