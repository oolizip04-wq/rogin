import { EQUIPMENT_PARTS } from "./classification";
import { EQUIPMENT_INFO } from "./equipmentInfo";
import { PART_BY_LABEL } from "./labels";
import type {
  BodyPart,
  Equipment,
  EquipmentGroup,
  EquipmentKind,
  PartLabel,
} from "./types";

export const BODY_PARTS: BodyPart[] = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "abs",
];

export const BODY_PART_LABELS: Record<BodyPart, string> = {
  chest: "가슴",
  back: "등",
  shoulders: "어깨",
  arms: "팔",
  legs: "하체",
  abs: "복부·코어",
};

/** 한 부위 안에서 보여 줄 갈래의 순서와 이름 */
export const KIND_ORDER: EquipmentKind[] = [
  "free",
  "bench",
  "rack",
  "cable",
  "machine",
  "attachment",
  "station",
  "cardio",
  "accessory",
];

export const KIND_LABELS: Record<EquipmentKind, string> = {
  free: "프리웨이트",
  bench: "벤치",
  rack: "랙 · 스미스 머신",
  cable: "케이블",
  machine: "머신",
  attachment: "그립",
  station: "철봉 · 평행봉",
  cardio: "유산소",
  accessory: "소도구",
};

/**
 * 기구 목록. 기구는 여기 한 번만 등록한다. (id 는 선택 상태와 사진 파일 이름에 쓰인다)
 * 어느 부위에서 쓰는지는 lib/classification.ts 에서 정한다.
 */
type BaseEquipment = Omit<Equipment, "parts">;

const BASE_EQUIPMENT: BaseEquipment[] = [
  // 프리웨이트: 하나로 뭉치지 않고 각각 따로 선택한다.
  { id: "dumbbell", name: "덤벨", kind: "free" },
  { id: "barbell", name: "바벨", kind: "free" },
  { id: "ez-bar", name: "이지바", kind: "free" },
  { id: "trap-bar", name: "헥스바", kind: "free" },
  { id: "kettlebell", name: "케틀벨", kind: "free" },

  // 벤치
  { id: "flat-bench", name: "플랫 벤치", kind: "bench" },
  { id: "incline-bench", name: "인클라인 벤치", kind: "bench" },
  { id: "decline-bench", name: "디클라인 벤치", kind: "bench" },
  { id: "adjustable-bench", name: "각도조절 벤치", kind: "bench" },
  { id: "situp-bench", name: "싯업보드", kind: "bench" },
  { id: "adjustable-situp-board", name: "각도조절 싯업보드", kind: "bench" },
  { id: "preacher-bench", name: "프리처 컬 벤치", kind: "bench" },
  { id: "back-extension-bench", name: "백 익스텐션 벤치", kind: "bench" },

  // 랙 · 스미스 머신
  { id: "bench-press-rack", name: "벤치랙", kind: "rack" },
  { id: "incline-bench-rack", name: "인클라인벤치랙", kind: "rack" },
  { id: "power-rack", name: "파워랙", kind: "rack" },
  { id: "half-rack", name: "하프랙", kind: "rack" },
  { id: "multi-rack", name: "멀티랙", kind: "rack" },
  { id: "sling-dead-rack", name: "슬링데드랙", kind: "rack" },
  { id: "smith-machine", name: "스미스머신", kind: "rack" },

  // 케이블
  { id: "cable-machine", name: "케이블머신", kind: "cable" },
  { id: "cable-crossover", name: "케이블크로스오버머신", kind: "cable" },
  { id: "lat-pulldown", name: "랫풀다운", kind: "cable" },
  { id: "seated-row", name: "시티드로우", kind: "cable" },

  // 머신
  { id: "chest-press-machine", name: "체스트프레스머신", kind: "machine" },
  { id: "incline-chest-press-machine", name: "인클라인체스트프레스머신", kind: "machine" },
  { id: "decline-chest-press-machine", name: "디클라인체스트프레스머신", kind: "machine" },
  { id: "pec-deck", name: "팩덱플라이", kind: "machine" },
  { id: "shoulder-press-machine", name: "숄더 프레스 머신", kind: "machine" },
  { id: "lateral-raise-machine", name: "사이드 레터럴 레이즈 머신", kind: "machine" },
  { id: "t-bar-row", name: "티바로우 머신", kind: "machine" },
  { id: "high-row", name: "하이로우", kind: "machine" },
  { id: "front-row", name: "프론트로우", kind: "machine" },
  { id: "low-row", name: "로우로우", kind: "machine" },
  { id: "multi-gym", name: "멀티짐", kind: "machine" },
  { id: "assisted-pullup-machine", name: "어시스트 풀업·딥스 머신", kind: "machine" },
  { id: "biceps-curl-machine", name: "바이셉스 컬 머신", kind: "machine" },
  { id: "triceps-extension-machine", name: "트라이셉스 익스텐션 머신", kind: "machine" },
  { id: "leg-press-machine", name: "레그프레스 머신", kind: "machine" },
  { id: "leg-extension-machine", name: "레그익스텐션", kind: "machine" },
  { id: "seated-leg-curl", name: "시티드레그컬", kind: "machine" },
  { id: "lying-leg-curl", name: "라잉레그컬", kind: "machine" },
  { id: "hack-squat-machine", name: "핵스쿼트머신", kind: "machine" },
  { id: "inner-thigh-machine", name: "이너타이", kind: "machine" },
  { id: "outer-thigh-machine", name: "아웃타이", kind: "machine" },
  { id: "calf-raise-machine", name: "카프 레이즈 머신", kind: "machine" },
  { id: "ab-crunch-machine", name: "복근 크런치 머신", kind: "machine" },

  // 그립 (묶음을 펼쳐 종류별로 선택)
  { id: "rope", name: "로프", kind: "attachment", group: "cable-grips" },
  { id: "neutral-grip", name: "뉴트럴 그립", kind: "attachment", group: "cable-grips" },
  // 케이블 머신에 다는 일자 손잡이 바입니다. 벤치프레스에 쓰는 바는 '바벨'입니다.
  { id: "straight-bar", name: "일자바", kind: "attachment", group: "cable-grips" },
  { id: "wide-lat-bar", name: "와이드바", kind: "attachment", group: "cable-grips" },
  { id: "d-handle", name: "D핸들", kind: "attachment", group: "cable-grips" },
  { id: "v-bar", name: "V바", kind: "attachment", group: "cable-grips" },
  { id: "ankle-strap", name: "앵클 스트랩", kind: "attachment", group: "cable-grips" },

  // 맥그립 (내전 = 손등이 위, 외전 = 손바닥이 위, 중립 = 손바닥이 마주 봄)
  { id: "mag-close-pronated", name: "맥그립 클로스 내전", kind: "attachment", group: "mag-grip" },
  { id: "mag-close-supinated", name: "맥그립 클로스 외전", kind: "attachment", group: "mag-grip" },
  { id: "mag-close-neutral", name: "맥그립 클로스 중립", kind: "attachment", group: "mag-grip" },
  { id: "mag-mid-pronated", name: "맥그립 중간 내전", kind: "attachment", group: "mag-grip" },
  { id: "mag-mid-supinated", name: "맥그립 중간 외전", kind: "attachment", group: "mag-grip" },
  { id: "mag-mid-neutral", name: "맥그립 중간 중립", kind: "attachment", group: "mag-grip" },
  { id: "mag-wide", name: "와이드 맥그립", kind: "attachment", group: "mag-grip" },

  // 철봉 · 평행봉
  { id: "pullup-bar", name: "풀업바", kind: "station", group: "bar-stations" },
  { id: "multigrip-pullup-bar", name: "멀티 그립 풀업바", kind: "station", group: "bar-stations" },
  { id: "parallel-bars", name: "평행봉", kind: "station", group: "bar-stations" },
  { id: "captains-chair", name: "캡틴스 체어", kind: "station", group: "bar-stations" },

  // 유산소
  { id: "treadmill", name: "런닝머신", kind: "cardio" },
  { id: "stationary-bike", name: "실내사이클", kind: "cardio" },

  // 소도구
  { id: "ab-wheel", name: "복근 롤러", kind: "accessory" },
  { id: "gym-ball", name: "짐볼", kind: "accessory" },
  { id: "exercise-mat", name: "운동 매트", kind: "accessory" },
];

export const EQUIPMENT_GROUPS: EquipmentGroup[] = [
  { id: "cable-grips", name: "그립 종류", kind: "attachment" },
  { id: "mag-grip", name: "맥그립 종류", kind: "attachment" },
  { id: "bar-stations", name: "철봉 · 평행봉 종류", kind: "station" },
];

/** 분류표(classification.ts)에서 부위를 읽어 기구에 붙인다. 틀린 부위 이름은 건너뛴다. */
function partsOf(name: string): BodyPart[] {
  const labels = EQUIPMENT_PARTS[name] ?? [];
  const parts = labels
    .map((l) => PART_BY_LABEL[l as PartLabel])
    .filter((p): p is BodyPart => p !== undefined);
  return BODY_PARTS.filter((p) => parts.includes(p));
}

export const EQUIPMENT: Equipment[] = BASE_EQUIPMENT.map((e) => ({
  ...e,
  parts: partsOf(e.name),
}));

export const EQUIPMENT_BY_ID: ReadonlyMap<string, Equipment> = new Map(
  EQUIPMENT.map((e) => [e.id, e]),
);

export const EQUIPMENT_BY_NAME: ReadonlyMap<string, Equipment> = new Map(
  EQUIPMENT.map((e) => [e.name, e]),
);

/** 아직 부위를 정하지 않은 기구 (분류표에서 [] 인 것) */
export function unclassifiedEquipment(): Equipment[] {
  return EQUIPMENT.filter((e) => e.parts.length === 0);
}

/**
 * 등록·분류 내용이 어긋나지 않았는지 확인한다.
 * 문제가 있으면 무엇을 어떻게 고치면 되는지 한국어 문장 목록으로 돌려준다.
 */
export function validateEquipment(): string[] {
  const problems: string[] = [];
  const groupIds = new Set(EQUIPMENT_GROUPS.map((g) => g.id));
  const ids = new Set<string>();
  const names = new Set<string>();

  for (const e of BASE_EQUIPMENT) {
    if (ids.has(e.id)) problems.push(`기구 id 가 중복됩니다: ${e.id}`);
    ids.add(e.id);
    if (names.has(e.name)) problems.push(`이름이 같은 기구가 있습니다: ${e.name}`);
    names.add(e.name);
    if (e.group && !groupIds.has(e.group)) {
      problems.push(`없는 묶음입니다: ${e.name} → ${e.group}`);
    }
    if (!EQUIPMENT_INFO[e.id]) problems.push(`설명이 없습니다: ${e.name} (${e.id})`);
  }
  for (const id of Object.keys(EQUIPMENT_INFO)) {
    if (!ids.has(id)) problems.push(`없는 기구의 설명입니다: ${id}`);
  }

  const validParts = new Set(Object.keys(PART_BY_LABEL));
  for (const [name, labels] of Object.entries(EQUIPMENT_PARTS)) {
    if (!names.has(name)) {
      problems.push(
        `분류표(classification.ts)에 있는 '${name}' 이름의 기구가 없습니다. 기구 이름을 확인하세요.`,
      );
    }
    for (const label of labels) {
      if (!validParts.has(label)) {
        problems.push(
          `분류표의 '${name}' 에 잘못된 부위 '${label}' 가 있습니다. 가슴·등·어깨·팔·하체·복부·코어 중에서 적어 주세요.`,
        );
      }
    }
  }
  for (const name of names) {
    if (!(name in EQUIPMENT_PARTS)) {
      problems.push(`분류표(classification.ts)에 '${name}' 이(가) 빠져 있습니다. 한 줄 추가해 주세요.`);
    }
  }
  return problems;
}

/** 한 부위에서 쓸 수 있는 기구 (등록 순서대로) */
export function equipmentForPart(part: BodyPart): Equipment[] {
  return EQUIPMENT.filter((e) => e.parts.includes(part));
}

// 등록·분류 내용에 오타가 있으면 여기서 멈추고 무엇을 고칠지 알려 준다.
const problems = validateEquipment();
if (problems.length > 0) {
  throw new Error("기구 등록·분류표에 고칠 곳이 있습니다:\n- " + problems.join("\n- "));
}
