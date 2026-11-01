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

export type Equipment = {
  id: string;
  name: string;
};

export type Exercise = {
  id: string;
  name: string;
  description: string;
  muscles: Muscle[];
  /** 이 운동에 필요한 기구 id. 비어 있으면 맨몸 운동 */
  requires: string[];
};
