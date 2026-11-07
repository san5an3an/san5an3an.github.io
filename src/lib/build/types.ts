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
  isFramedText: boolean;
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

export type Draft = { rect: Rect; filled: boolean; hideSize?: boolean };

// 커서가 화면 밖에서 끌고 오는 사진 썸네일 정보. offset 은 커서 끝에서 썸네일 왼쪽 위까지의 거리
export type Carry = { image: HTMLImageElement; w: number; h: number; offset: Point; label: string };

// 눈금자에서 끌어내 놓는 정렬 기준선 하나의 정보. axis 가 x 면 세로선, y 면 가로선
export type Guide = {
  axis: "x" | "y";
  target: number;
  position: number | null;
  label: Point | null;
  claimed: boolean;
  placed: boolean;
};
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
  name: string;
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
  chip: string | null;
  carry: Carry | null;
  dropTarget: Rect | null;
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
  rulerLine: string;
  rulerText: string;
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
  guides: Guide[];
  rulerSize: number;
  overlayAlpha: number;
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
