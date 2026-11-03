import { MUSCLE_LABELS } from "@/lib/data";
import type { Muscle } from "@/lib/types";

const ACTIVE = "#e4572e";
const ACTIVE_STROKE = "#b83a14";
const IDLE = "#c9ced4";
const IDLE_STROKE = "#aeb5bd";
const BASE = "#e3e6ea";

/** 근육 한 부위. 운동에 쓰이는 근육이면 주황색으로 칠한다. */
function Region({
  muscle,
  on,
  children,
}: {
  muscle: Muscle;
  on: Set<Muscle>;
  children: React.ReactNode;
}) {
  const active = on.has(muscle);
  return (
    <g
      data-muscle={muscle}
      fill={active ? ACTIVE : IDLE}
      stroke={active ? ACTIVE_STROKE : IDLE_STROKE}
      strokeWidth={1}
    >
      {children}
    </g>
  );
}

/** 앞·뒤 몸 그림. 모양은 단순화한 임시 그림이다. */
function Body({ view, on }: { view: "front" | "back"; on: Set<Muscle> }) {
  return (
    <svg viewBox="0 0 100 210" width="130" role="presentation" aria-hidden="true">
      {/* 몸 바탕 */}
      <g fill={BASE} stroke={IDLE_STROKE} strokeWidth={1}>
        <circle cx={50} cy={15} r={11} />
        <rect x={45} y={24} width={10} height={9} rx={3} />
        <path d="M30 36 Q50 30 70 36 L68 104 Q50 112 32 104 Z" />
        <ellipse cx={22} cy={66} rx={7} ry={24} />
        <ellipse cx={78} cy={66} rx={7} ry={24} />
        <ellipse cx={18} cy={108} rx={5.5} ry={18} />
        <ellipse cx={82} cy={108} rx={5.5} ry={18} />
        <circle cx={16} cy={130} r={5} />
        <circle cx={84} cy={130} r={5} />
        <path d="M32 104 Q50 114 68 104 L66 120 Q50 126 34 120 Z" />
        <ellipse cx={40} cy={146} rx={11} ry={28} />
        <ellipse cx={60} cy={146} rx={11} ry={28} />
        <ellipse cx={38} cy={186} rx={7.5} ry={20} />
        <ellipse cx={62} cy={186} rx={7.5} ry={20} />
      </g>

      {view === "front" ? (
        <>
          <Region muscle="shoulders" on={on}>
            <ellipse cx={27} cy={42} rx={9} ry={10} />
            <ellipse cx={73} cy={42} rx={9} ry={10} />
          </Region>
          <Region muscle="chest" on={on}>
            <ellipse cx={41} cy={53} rx={11} ry={9} />
            <ellipse cx={59} cy={53} rx={11} ry={9} />
          </Region>
          <Region muscle="biceps" on={on}>
            <ellipse cx={21} cy={66} rx={5.5} ry={14} />
            <ellipse cx={79} cy={66} rx={5.5} ry={14} />
          </Region>
          <Region muscle="forearms" on={on}>
            <ellipse cx={18} cy={108} rx={5} ry={16} />
            <ellipse cx={82} cy={108} rx={5} ry={16} />
          </Region>
          <Region muscle="abs" on={on}>
            <rect x={42} y={66} width={16} height={34} rx={5} />
            <path d="M42 77h16M42 88h16M50 66v34" stroke="#fff" strokeOpacity={0.6} fill="none" />
          </Region>
          <Region muscle="obliques" on={on}>
            <ellipse cx={36} cy={84} rx={4} ry={14} />
            <ellipse cx={64} cy={84} rx={4} ry={14} />
          </Region>
          <Region muscle="quads" on={on}>
            <ellipse cx={40} cy={143} rx={9.5} ry={24} />
            <ellipse cx={60} cy={143} rx={9.5} ry={24} />
          </Region>
          <Region muscle="adductors" on={on}>
            <ellipse cx={45.5} cy={140} rx={3.3} ry={17} />
            <ellipse cx={54.5} cy={140} rx={3.3} ry={17} />
          </Region>
          <Region muscle="abductors" on={on}>
            <ellipse cx={31} cy={136} rx={3.2} ry={18} />
            <ellipse cx={69} cy={136} rx={3.2} ry={18} />
          </Region>
          <Region muscle="calves" on={on}>
            <ellipse cx={38} cy={184} rx={6} ry={17} />
            <ellipse cx={62} cy={184} rx={6} ry={17} />
          </Region>
        </>
      ) : (
        <>
          <Region muscle="shoulders" on={on}>
            <ellipse cx={27} cy={42} rx={9} ry={10} />
            <ellipse cx={73} cy={42} rx={9} ry={10} />
          </Region>
          <Region muscle="back" on={on}>
            <path d="M50 34 L68 41 L69 66 L60 92 L50 98 L40 92 L31 66 L32 41 Z" />
            <path d="M50 36v60" stroke="#fff" strokeOpacity={0.5} fill="none" />
          </Region>
          <Region muscle="triceps" on={on}>
            <ellipse cx={21} cy={64} rx={5.5} ry={14} />
            <ellipse cx={79} cy={64} rx={5.5} ry={14} />
          </Region>
          <Region muscle="forearms" on={on}>
            <ellipse cx={18} cy={108} rx={5} ry={16} />
            <ellipse cx={82} cy={108} rx={5} ry={16} />
          </Region>
          <Region muscle="glutes" on={on}>
            <ellipse cx={41} cy={112} rx={10} ry={9} />
            <ellipse cx={59} cy={112} rx={10} ry={9} />
          </Region>
          <Region muscle="hamstrings" on={on}>
            <ellipse cx={40} cy={146} rx={9.5} ry={24} />
            <ellipse cx={60} cy={146} rx={9.5} ry={24} />
          </Region>
          <Region muscle="abductors" on={on}>
            <ellipse cx={31} cy={136} rx={3.2} ry={18} />
            <ellipse cx={69} cy={136} rx={3.2} ry={18} />
          </Region>
          <Region muscle="calves" on={on}>
            <ellipse cx={38} cy={185} rx={6.5} ry={17} />
            <ellipse cx={62} cy={185} rx={6.5} ry={17} />
          </Region>
        </>
      )}
    </svg>
  );
}

export default function MuscleMap({ muscles }: { muscles: Muscle[] }) {
  const on = new Set(muscles);
  const names = muscles.map((m) => MUSCLE_LABELS[m]).join(", ");

  return (
    <figure style={{ margin: 0 }}>
      <div
        role="img"
        aria-label={`운동 부위: ${names}`}
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 24,
          padding: 16,
          background: "#eef1f5",
          borderRadius: 12,
          color: "#495057",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Body view="front" on={on} />
          <div>
            <small>앞</small>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <Body view="back" on={on} />
          <div>
            <small>뒤</small>
          </div>
        </div>
      </div>
      <figcaption>
        <small>주황색 = 이 운동에서 쓰는 근육: {names}</small>
      </figcaption>
    </figure>
  );
}
