import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MuscleMap from "@/components/MuscleMap";
import { EXERCISES, bodyPartsOf, getExercise } from "@/lib/data";
import { BODY_PART_LABELS, EQUIPMENT_BY_ID } from "@/lib/equipment";
import type { Requirement } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return EXERCISES.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const exercise = getExercise(id);
  return { title: exercise ? `${exercise.name} · 체단실` : "체단실" };
}

function requirementText(req: Requirement): string {
  const names = (Array.isArray(req) ? req : [req]).map(
    (id) => EQUIPMENT_BY_ID.get(id)?.name ?? id,
  );
  return names.join(" 또는 ");
}

export default async function ExerciseDetailPage({ params }: Props) {
  const { id } = await params;
  const exercise = getExercise(id);
  if (!exercise) notFound();

  const parts = bodyPartsOf(exercise);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <p>
        <Link href="/workout/available">← 운동 목록</Link>
      </p>

      <h1>{exercise.name}</h1>
      <p>
        <small>{parts.map((p) => BODY_PART_LABELS[p]).join(" · ")}</small>
      </p>

      <p>
        <small>
          세부 부위: {exercise.areas.join(" · ")}
          {exercise.secondary.length > 0 && ` (보조: ${exercise.secondary.join(" · ")})`}
        </small>
      </p>

      <MuscleMap muscles={exercise.muscles} />

      <section>
        <h2>필요한 기구</h2>
        {exercise.requires.length === 0 ? (
          <p>기구 없이 할 수 있는 맨몸 운동입니다.</p>
        ) : (
          <ul>
            {exercise.requires.map((req, i) => (
              <li key={i}>{requirementText(req)}</li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>설명</h2>
        <p>{exercise.description}</p>
      </section>

      <section>
        <h2>동작 순서</h2>
        <ol>
          {exercise.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </section>

      <section>
        <h2>댓글</h2>
        <p>
          <small>준비 중입니다. 곧 이 운동에 대한 팁과 질문을 나눌 수 있습니다.</small>
        </p>
      </section>
    </main>
  );
}
