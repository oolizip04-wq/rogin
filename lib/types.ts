export type Muscle =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "abs"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves";

/** 기구를 고를 때 쓰는 운동 부위 분류 */
export type BodyPart = "chest" | "back" | "shoulders" | "arms" | "legs" | "abs";

/** 한 부위 안에서 기구를 묶어 보여 주는 갈래 */
export type EquipmentKind =
  | "free"
  | "bench"
  | "rack"
  | "cable"
  | "machine"
  | "attachment"
  | "station"
  | "cardio"
  | "accessory";

export type Equipment = {
  /** 앱 전체에서 하나뿐인 고유 id. 선택 상태는 이 id 로만 저장한다. */
  id: string;
  name: string;
  /** 이 기구를 쓸 수 있는 모든 운동 부위. 선택하면 이 부위들에 모두 반영된다. */
  parts: BodyPart[];
  kind: EquipmentKind;
  /** 종류가 여러 개라 펼쳐서 고르는 묶음(EquipmentGroup)의 id */
  group?: string;
};

/** 그립·바처럼 종류가 여러 개인 기구를 펼쳐 보여 주는 묶음 */
export type EquipmentGroup = {
  id: string;
  name: string;
  kind: EquipmentKind;
};

/** 운동에 필요한 기구. 문자열은 그 기구 하나, 배열은 그중 하나만 있어도 된다는 뜻 */
export type Requirement = string | string[];

export type Exercise = {
  id: string;
  name: string;
  description: string;
  muscles: Muscle[];
  /** 이 운동에 필요한 기구. 비어 있으면 맨몸 운동 */
  requires: Requirement[];
};
