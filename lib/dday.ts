/** 'YYYY-MM-DD' 를 그날 0시(내 컴퓨터의 시간대)로 바꾼다. 형식이 틀리면 null. */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * 오늘부터 그 날짜까지 남은 일수. 오늘이면 0, 지났으면 음수. 날짜가 없으면 null.
 * 현재 시각은 날짜가 있을 때만 읽는다. (날짜가 없는 미리 그리기 단계에서는 시각을 읽지 않는다)
 */
export function daysUntil(dateText: string | null | undefined, now?: Date): number | null {
  const target = parseDate(dateText);
  if (!target) return null;
  const today = now ?? new Date();
  const ms = startOfDay(target).getTime() - startOfDay(today).getTime();
  return Math.round(ms / 86_400_000);
}

/** 전역까지 남은 일수를 D-day 글자로. 예: D-123, D-DAY. 이미 지났으면 null. */
export function formatDday(days: number | null): string | null {
  if (days === null || days < 0) return null;
  return days === 0 ? "D-DAY" : `D-${days}`;
}

/** 입대일부터 전역일까지 중 지금까지 복무한 비율 (0~100). 날짜가 없으면 null. */
export function serviceProgress(
  enlist: string | null | undefined,
  discharge: string | null | undefined,
  now?: Date,
): number | null {
  const a = parseDate(enlist);
  const b = parseDate(discharge);
  if (!a || !b || b <= a) return null;
  const total = startOfDay(b).getTime() - startOfDay(a).getTime();
  const done = startOfDay(now ?? new Date()).getTime() - startOfDay(a).getTime();
  return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
}
