"use client";

import { useMemo } from "react";
import EquipmentPicker from "@/components/EquipmentPicker";
import { EXERCISES, MUSCLE_LABELS, bodyPartsOf } from "@/lib/data";
import { BODY_PART_LABELS } from "@/lib/equipment";
import { filterExercises } from "@/lib/filter";
import { useOwnedEquipment } from "@/lib/useOwnedEquipment";

export default function ExerciseFinder() {
  const { ids } = useOwnedEquipment();
  const exercises = useMemo(() => filterExercises(EXERCISES, ids), [ids]);

  return (
    <div>
      <EquipmentPicker />

      <section>
        <h2>할 수 있는 운동 ({exercises.length})</h2>
        <ul>
          {exercises.map((ex) => {
            const parts = bodyPartsOf(ex);
            return (
              <li key={ex.id}>
                <strong>{ex.name}</strong>{" "}
                <small>
                  {parts.map((p) => BODY_PART_LABELS[p]).join("·")}
                  {parts.length > 0 ? " · " : ""}
                  {ex.muscles.map((m) => MUSCLE_LABELS[m]).join(", ")}
                </small>
                <p>{ex.description}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
