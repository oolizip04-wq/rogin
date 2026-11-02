import type { BodyPart, Exercise, Muscle } from "./types";

export const MUSCLE_LABELS: Record<Muscle, string> = {
  chest: "가슴",
  back: "등",
  shoulders: "어깨",
  biceps: "이두",
  triceps: "삼두",
  abs: "복근",
  quads: "대퇴사두",
  hamstrings: "햄스트링",
  glutes: "둔근",
  calves: "종아리",
};

/** 세부 근육이 속하는 운동 부위 */
export const MUSCLE_BODY_PART: Record<Muscle, BodyPart> = {
  abs: "abs",
  chest: "chest",
  back: "back",
  shoulders: "shoulders",
  biceps: "arms",
  triceps: "arms",
  quads: "legs",
  hamstrings: "legs",
  glutes: "legs",
  calves: "legs",
};

/** 운동이 쓰는 부위들 (중복 없이) */
export function bodyPartsOf(exercise: Exercise): BodyPart[] {
  return [...new Set(exercise.muscles.map((m) => MUSCLE_BODY_PART[m]))];
}

// 기구 id 는 lib/equipment.ts 에 등록된 것만 씁니다.
// 배열은 그중 하나만 있어도 된다는 뜻입니다.
// 설명은 초안입니다. 정식 서비스 전에 내용을 검수하세요.
export const EXERCISES: Exercise[] = [
  {
    id: "pushup",
    name: "푸시업",
    description:
      "손을 어깨너비보다 약간 넓게 짚고 몸을 일직선으로 유지한 채 가슴이 바닥에 가까워질 때까지 내려갔다 밀어 올립니다. 허리가 꺾이지 않게 복부에 힘을 주세요.",
    muscles: ["chest", "triceps", "shoulders"],
    requires: [],
  },
  {
    id: "bodyweight-squat",
    name: "맨몸 스쿼트",
    description:
      "발을 어깨너비로 벌리고 엉덩이를 뒤로 빼며 앉습니다. 무릎이 안쪽으로 모이지 않게 하고 허리를 곧게 유지합니다.",
    muscles: ["quads", "glutes", "hamstrings"],
    requires: [],
  },
  {
    id: "plank",
    name: "플랭크",
    description:
      "팔꿈치를 어깨 아래에 두고 머리부터 발끝까지 일직선을 유지합니다. 엉덩이가 처지거나 들리지 않게 하세요.",
    muscles: ["abs"],
    requires: [],
  },
  {
    id: "dumbbell-curl",
    name: "덤벨 컬",
    description:
      "팔꿈치를 몸 옆에 고정하고 덤벨을 어깨 쪽으로 들어 올린 뒤 천천히 내립니다. 몸의 반동을 쓰지 않습니다.",
    muscles: ["biceps"],
    requires: ["dumbbell"],
  },
  {
    id: "dumbbell-shoulder-press",
    name: "덤벨 숄더 프레스",
    description:
      "덤벨을 어깨 높이에서 머리 위로 밀어 올립니다. 허리가 과하게 꺾이지 않도록 복부에 힘을 줍니다.",
    muscles: ["shoulders", "triceps"],
    requires: ["dumbbell"],
  },
  {
    id: "dumbbell-bench-press",
    name: "덤벨 벤치 프레스",
    description:
      "벤치에 누워 덤벨을 가슴 위로 밀어 올립니다. 내릴 때는 팔꿈치를 몸에서 약간 벌려 가슴 옆까지 내립니다.",
    muscles: ["chest", "triceps", "shoulders"],
    requires: ["dumbbell", ["flat-bench", "adjustable-bench"]],
  },
  {
    id: "barbell-bench-press",
    name: "바벨 벤치 프레스",
    description:
      "벤치에 누워 바를 가슴 중앙까지 내렸다가 밀어 올립니다. 무거운 중량은 반드시 보조자와 함께 하세요.",
    muscles: ["chest", "triceps", "shoulders"],
    requires: [
      "barbell",
      ["bench-press-rack", "power-rack", "flat-bench", "adjustable-bench"],
    ],
  },
  {
    id: "barbell-squat",
    name: "바벨 스쿼트",
    description:
      "바를 승모근 위에 얹고 허벅지가 바닥과 평행해질 때까지 앉았다 일어납니다. 랙 높이와 안전 바 설정을 확인하세요.",
    muscles: ["quads", "glutes", "hamstrings"],
    requires: ["barbell", ["squat-rack", "power-rack"]],
  },
  {
    id: "pullup",
    name: "풀업",
    description:
      "바를 어깨너비보다 넓게 잡고 턱이 바 위로 올라올 때까지 당깁니다. 내려올 때도 천천히 버팁니다.",
    muscles: ["back", "biceps"],
    requires: [["pullup-bar", "multigrip-pullup-bar"]],
  },
  {
    id: "dip",
    name: "딥스",
    description:
      "평행봉을 잡고 팔꿈치를 굽혀 몸을 내렸다가 밀어 올립니다. 어깨가 불편하면 내리는 깊이를 줄이세요.",
    muscles: ["chest", "triceps"],
    requires: ["parallel-bars"],
  },
  {
    id: "situp",
    name: "싯업",
    description:
      "벤치에 발을 고정하고 상체를 말아 올립니다. 목을 당기지 말고 복근으로 올라옵니다.",
    muscles: ["abs"],
    requires: [["situp-bench", "adjustable-bench"]],
  },
  {
    id: "lat-pulldown",
    name: "랫풀다운",
    description:
      "바를 넓게 잡고 가슴 위쪽으로 당깁니다. 어깨를 내리고 등 근육으로 당긴다는 느낌을 유지합니다.",
    muscles: ["back", "biceps"],
    requires: ["lat-pulldown"],
  },
  {
    id: "treadmill-run",
    name: "러닝머신 달리기",
    description:
      "처음 5분은 가볍게 걷거나 뛰며 몸을 데운 뒤, 본인 체력에 맞는 속도로 진행합니다. 불편하면 속도를 낮추세요.",
    muscles: ["quads", "hamstrings", "calves"],
    requires: ["treadmill"],
  },
];
