export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

export type LayerKind = "frame" | "text" | "media" | "control";
export type LayerElement = HTMLElement | SVGElement;

// 커서가 그려야 할 실제 DOM 요소 하나의 정보
export type Layer = {
  el: LayerElement;
  kind: LayerKind;
  parent: Layer | null;
  rect: Rect;
  radius: number;
  fill: string | null;
  isGroupItem: boolean;
  isSticky: boolean;
  state: "hidden" | "claimed" | "revealed";
};

// 자동 레이아웃 적용 전에 흩어져 놓이는 항목 하나의 정보
export type GroupItem = {
  layer: Layer;
  offset: Point;
  claimed: boolean;
  placed: boolean;
  ghost: boolean;
};

// data-autolayout 이 붙은 그룹 하나의 진행 상태
export type LayoutGroup = {
  el: HTMLElement;
  rect: Rect;
  owner: Layer | null;
  items: GroupItem[];
  state: "open" | "applying" | "applied";
};

export type Draft = { rect: Rect; filled: boolean };
export type Caret = { x: number; y: number; height: number };

// 시간이 지나면 사라지는 보조 표시
export type Flash = { age: number; ttl: number } & (
  | { kind: "cross"; x: number; y: number }
  | { kind: "marquee"; rect: Rect }
  | { kind: "outline"; rect: Rect }
  | { kind: "gap"; rect: Rect; label: string }
  | { kind: "measure"; from: Point; to: Point; label: string }
  | { kind: "chip"; x: number; y: number; label: string }
);

export type Step = {
  duration: number;
  tick?: (progress: number) => void;
  finish?: () => void;
};

// 화면에 그려지는 커서 하나의 상태
export type Agent = {
  color: string;
  onColor: string;
  name: string | null;
  size: number;
  arc: number;
  x: number;
  y: number;
  alpha: number;
  active: boolean;
  busy: boolean;
  tool: "arrow" | "text";
  draft: Draft | null;
  caret: Caret | null;
  steps: Step[];
  stepElapsed: number;
};

export type BuildTokens = {
  brand: string;
  onBrand: string;
  danger: string;
  onDanger: string;
  placeholder: string;
  surface: string;
  fontFamily: string;
};

export type BuildScene = {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
  dpr: number;
  agents: Agent[];
  groups: LayoutGroup[];
  flashes: Flash[];
  tokens: BuildTokens;
};

export type BuildStatus = {
  agents: number;
  total: number;
  done: number;
  paused: boolean;
  speed: 1 | 2;
  finished: boolean;
  waiting: boolean;
  colors: string[];
};
