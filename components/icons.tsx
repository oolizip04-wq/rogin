import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (p: P): P => ({
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  ...p,
});

export function HomeIcon(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h5v-6h4v6h5V10" />
    </svg>
  );
}

export function DumbbellIcon(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M2.5 9.5v5M6 7v10M18 7v10M21.5 9.5v5M6 12h12" />
    </svg>
  );
}

export function ChatIcon(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1h-7l-5 4v-4H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
      <path d="M8 11h.01M12 11h.01M16 11h.01" strokeWidth={3} />
    </svg>
  );
}

export function PersonIcon(p: P) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

export function RoutineIcon(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M6 4h12M4 8h16" />
      <rect x="4" y="11" width="16" height="9" rx="1" />
      <path d="M11 13.5v4l3.5-2z" fill="currentColor" />
    </svg>
  );
}

export function BellIcon(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M6 16V11a6 6 0 0112 0v5l2 2H4z" />
      <path d="M10 21a2 2 0 004 0" />
    </svg>
  );
}

export function GearIcon(p: P) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
    </svg>
  );
}

export function ArrowUpRightIcon(p: P) {
  return (
    <svg {...base({ width: 20, height: 20, ...p })}>
      <path d="M7 17L17 7M8 7h9v9" />
    </svg>
  );
}
