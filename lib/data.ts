import { EQUIPMENT_BY_NAME } from "./equipment";
import { EXERCISE_TABLE } from "./exerciseTable";
import { AREA_INFO } from "./labels";
import type {
  AreaLabel,
  BodyPart,
  Exercise,
  Muscle,
  Requirement,
} from "./types";

export const MUSCLE_LABELS: Record<Muscle, string> = {
  chest: "가슴",
  back: "등",
  shoulders: "어깨",
  biceps: "이두",
  triceps: "삼두",
  forearms: "전완",
  abs: "복부·코어",
  obliques: "옆구리",
  quads: "앞벅지",
  hamstrings: "뒷벅지",
  glutes: "엉덩이",
  adductors: "안쪽 허벅지",
  abductors: "바깥 허벅지",
  calves: "종아리",
};

/** 운동이 쓰는 큰 부위들 (중복 없이) */
export function bodyPartsOf(exercise: Exercise): BodyPart[] {
  return [...new Set(exercise.areas.map((a) => AREA_INFO[a].part))];
}

/** 운동 표(exerciseTable.ts)를 읽어 화면에서 쓰는 모양으로 바꾼다. 문제가 있으면 한국어 문장으로 모은다. */
function build(): { exercises: Exercise[]; problems: string[] } {
  const problems: string[] = [];
  const exercises: Exercise[] = [];
  const ids = new Set<string>();

  function resolve(exName: string, req: string | string[]): Requirement {
    const toId = (name: string): string => {
      const found = EQUIPMENT_BY_NAME.get(name);
      if (!found) {
        problems.push(
          `운동 '${exName}' 의 필요기구에 없는 기구 '${name}' 이(가) 있습니다. 기구 이름을 확인하세요.`,
        );
        return name;
      }
      return found.id;
    };
    return Array.isArray(req) ? req.map(toId) : toId(req);
  }

  function checkAreas(exName: string, label: string, areas: AreaLabel[]) {
    for (const a of areas) {
      if (!(a in AREA_INFO)) {
        problems.push(
          `운동 '${exName}' 의 ${label}에 잘못된 이름 '${a}' 이(가) 있습니다. exerciseTable.ts 맨 위 설명의 부위 이름 중에서 적어 주세요.`,
        );
      }
    }
  }

  for (const row of EXERCISE_TABLE) {
    if (!/^[a-z0-9-]+$/.test(row.id)) {
      problems.push(`운동 '${row.이름}' 의 id '${row.id}' 는 영어 소문자, 숫자, - 만 쓸 수 있습니다.`);
    }
    if (ids.has(row.id)) problems.push(`운동 id 가 겹칩니다: ${row.id}`);
    ids.add(row.id);
    if (row.세부부위.length === 0) {
      problems.push(`운동 '${row.이름}' 에 세부부위가 비어 있습니다. 하나 이상 적어 주세요.`);
    }
    if (row.순서.length === 0) problems.push(`운동 '${row.이름}' 에 순서가 비어 있습니다.`);
    checkAreas(row.이름, "세부부위", row.세부부위);
    checkAreas(row.이름, "보조부위", row.보조부위 ?? []);

    const areas = [...new Set(row.세부부위.filter((a) => a in AREA_INFO))];
    const secondary = [
      ...new Set((row.보조부위 ?? []).filter((a) => a in AREA_INFO && !areas.includes(a))),
    ];
    const muscles = [
      ...new Set([...areas, ...secondary].map((a) => AREA_INFO[a].muscle)),
    ];

    exercises.push({
      id: row.id,
      name: row.이름,
      description: row.설명,
      steps: row.순서,
      areas,
      secondary,
      muscles,
      requires: row.필요기구.map((r) => resolve(row.이름, r)),
    });
  }
  return { exercises, problems };
}

const built = build();

if (built.problems.length > 0) {
  throw new Error(
    "운동 표(exerciseTable.ts)에 고칠 곳이 있습니다:\n- " + built.problems.join("\n- "),
  );
}

export const EXERCISES: Exercise[] = built.exercises;

export function getExercise(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
