import { collectLayers, measureTextLines, readRect } from "./collect-layers";
import { paintScene } from "./painter";
import type {
  Agent,
  AgentJob,
  BuildScene,
  BuildStatus,
  BuildTokens,
  Carry,
  Flash,
  GroupItem,
  Guide,
  Layer,
  LayoutGroup,
  Point,
  Rect,
  Step,
} from "./types";

const ALL_JOBS: AgentJob[] = ["guide", "group", "frame", "text", "control", "icon", "image"];

// 이름과 맡는 일. 앞에서부터 화면에 나오므로 처음 6개와 모바일 14개 안에 모든 종류가 들어가게 섞어 둠.
// 시작 고리의 5개 안에 가이드를 놓는 커서를 3개 두어 고리가 끝나면 가이드 3개를 한 번에 놓게 함
const AGENT_ROLES: { name: string; jobs: AgentJob[] }[] = [
  { name: "Guides", jobs: ["guide", "frame"] },
  { name: "Grid", jobs: ["guide", "frame"] },
  { name: "QA", jobs: ALL_JOBS },
  { name: "Fonts", jobs: ["text"] },
  { name: "Buttons", jobs: ["control"] },
  { name: "Icons", jobs: ["icon"] },
  { name: "Auto Layout", jobs: ["group", "frame"] },
  { name: "Type", jobs: ["text"] },
  { name: "Images", jobs: ["image"] },
  { name: "Layout", jobs: ["frame"] },
  { name: "Cards", jobs: ["frame"] },
  { name: "Copy", jobs: ["text"] },
  { name: "Links", jobs: ["control"] },
  { name: "Spacing", jobs: ["group", "frame"] },
  { name: "Headline", jobs: ["text"] },
  { name: "Build", jobs: ALL_JOBS },
  { name: "Surface", jobs: ["frame"] },
  { name: "Body", jobs: ["text"] },
  { name: "Nav", jobs: ["control"] },
  { name: "Media", jobs: ["image", "icon"] },
  { name: "Shadow", jobs: ["frame"] },
  { name: "Labels", jobs: ["text"] },
  { name: "Align", jobs: ["group", "frame"] },
  { name: "Badges", jobs: ["control"] },
  { name: "Radius", jobs: ["frame"] },
  { name: "Captions", jobs: ["text"] },
  { name: "Fill", jobs: ["frame"] },
  { name: "States", jobs: ["control"] },
  { name: "Hangul", jobs: ["text"] },
  { name: "Border", jobs: ["frame"] },
  { name: "Kerning", jobs: ["text"] },
];
const AGENT_SIZE = 20;
const DESKTOP_AGENT_COUNT = AGENT_ROLES.length;
const MOBILE_AGENT_COUNT = 14;
const AMBIENT_AGENT_COUNT = 3;
const RING_COUNT = 5;
const INTRO_DURATION = 1800;
const INTRO_ENTER = 650;
const INTRO_MAX_DELAY = 420;
const INTRO_FADE_IN = 220;
const INTRO_TURN = 1500;
const RING_RADIUS = 60;
// 커서 오른쪽 아래에 붙는 name tag 까지 합친 모양이 화면 가운데에 오도록 고리 중심을 옮기는 거리
const RING_SHIFT: Point = { x: 40, y: 18 };
// 좁은 화면에서 고리를 줄일 때 화면 양끝과 띄울 거리. 중심을 옮긴 40 에 여백 8 을 더한 값
const RING_EDGE = RING_SHIFT.x + 8;
const TRAIL_LENGTH = 10;
const TRAIL_SAMPLE = 16;
const TRAIL_FADE = 360;
const AGENTS_PER_SECOND = 5;
const IDLE_DELAY = 1100;
const STATUS_INTERVAL = 100;
const SWEEP_INTERVAL = 200;
const OFF_SCREEN_MARGIN = 40;
const MAX_FRAME_TIME = 50;
const PASSED_MARGIN = 20;
const VIEW_BOTTOM_RATIO = 0.96;
const FRAMED_TEXT_MIN_DRAG = 280;
const FRAMED_TEXT_PLACEHOLDER_HOLD = 110;
const FRAMED_TEXT_CARET_MOVE = 140;
const GROW_MIN_FONT_SIZE = 20;
const GROW_START_FONT_SIZE = 12;
const GROW_MS_PER_PX = 16;
const RULER_SIZE = 20;
const MOBILE_RULER_SIZE = 14;
const OVERLAY_FADE_IN = 300;
const OVERLAY_FADE_OUT = 800;
const DROP_SETTLE = 460;
const SPRING_EASING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

type EngineOptions = {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  onStatus: (status: BuildStatus) => void;
};

type TextBox = { top: number; bottom: number; left: number; right: number };

// 작은 크기로 입력한 뒤 키우는 큰 글자의 기준점과 크기 정보
type TextGrowth = {
  fontSize: number;
  startScale: number;
  origin: Point;
  box: TextBox;
};

type InlineStyles = { clipPath: string; borderRadius: string; transform: string; transformOrigin: string };

// 시작 고리에서 커서 하나가 들어오는 출발점, 고리 위 각도, 출발까지 기다리는 시간
type IntroPath = { agent: Agent; from: Point; angle: number; delay: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// 줄별 글자 영역을 모두 감싸는 영역 계산
function unionLines(lines: TextBox[]): TextBox {
  return {
    top: Math.min(...lines.map((line) => line.top)),
    bottom: Math.max(...lines.map((line) => line.bottom)),
    left: Math.min(...lines.map((line) => line.left)),
    right: Math.max(...lines.map((line) => line.right)),
  };
}

// 요소 종류를 커서가 맡는 일 종류로 변환. 그림은 사진과 아이콘을 나눔
function layerJob(layer: Layer): AgentJob {
  if (layer.kind === "media") return layer.el instanceof HTMLImageElement ? "image" : "icon";
  return layer.kind;
}

// 사진 주소에서 썸네일 라벨로 쓸 파일 이름만 꺼냄
function imageFileName(image: HTMLImageElement) {
  try {
    const path = new URL(image.currentSrc || image.src, location.href).pathname;
    return decodeURIComponent(path.split("/").pop() || "image");
  } catch {
    return "image";
  }
}

// 요소 기준 좌표를 현재 배율이 적용된 문서 좌표로 변환. growth 가 없으면 배율 없이 변환함
function textPoint(layer: Layer, growth: TextGrowth | null, scale: number, x: number, y: number): Point {
  if (!growth) return { x: layer.rect.x + x, y: layer.rect.y + y };
  const { origin } = growth;
  return {
    x: layer.rect.x + origin.x + (x - origin.x) * scale,
    y: layer.rect.y + origin.y + (y - origin.y) * scale,
  };
}

function easeInOut(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - (-2 * value + 2) ** 3 / 2;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// 색이 어두운지 판별. Canvas 에 넣었다 읽으면 불투명한 색은 #rrggbb 표기로 맞춰지는 것을 이용함
function isDarkColor(context: CanvasRenderingContext2D, color: string) {
  context.fillStyle = "#ffffff";
  context.fillStyle = color;
  const hex = String(context.fillStyle);
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return false;
  const [r, g, b] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}

// Cobalt 토큰 값을 Canvas 에서 쓸 색상과 글꼴로 변환. 다크 모드 조건을 따로 흉내 내지 않고 실제 바탕색으로 어두운 화면을 판별함
function readTokens(context: CanvasRenderingContext2D): {
  tokens: BuildTokens;
  palette: { color: string; onColor: string }[];
} {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) => style.getPropertyValue(name).trim();
  const surface = read("--semantic-bg-neutral-surface");
  return {
    tokens: {
      brand: read("--semantic-bg-brand-default"),
      onBrand: read("--semantic-fg-on-brand-default"),
      danger: read("--semantic-bg-danger-default"),
      onDanger: read("--semantic-fg-on-danger-default"),
      placeholder: read("--semantic-bg-neutral-default"),
      surface,
      rulerLine: read("--semantic-border-neutral-default"),
      rulerText: read("--semantic-fg-neutral-subtlest"),
      foreground: read("--semantic-fg-neutral-default"),
      fontFamily: getComputedStyle(document.body).fontFamily,
      dark: isDarkColor(context, surface),
    },
    palette: [
      { color: read("--component-chart-series-1"), onColor: read("--semantic-fg-on-brand-default") },
      { color: read("--component-chart-series-2"), onColor: read("--semantic-fg-on-danger-default") },
      { color: read("--component-chart-series-3"), onColor: read("--semantic-fg-on-success-default") },
      { color: read("--component-chart-series-4"), onColor: read("--semantic-fg-on-warning-default") },
      { color: read("--semantic-fg-neutral-default"), onColor: read("--semantic-bg-neutral-surface") },
    ],
  };
}

// 페이지의 실제 요소를 커서들에게 나눠주고 조립 과정을 재생하는 엔진
export class BuildEngine {
  private readonly context: CanvasRenderingContext2D;
  private layers: Layer[] = [];
  private layerByElement = new Map<Element, Layer>();
  private groups: LayoutGroup[] = [];
  private agents: Agent[] = [];
  private flashes: Flash[] = [];
  private guides: Guide[] = [];
  private overlayAlpha = 0;
  private rulerSize = RULER_SIZE;
  private animations = new Set<Animation>();
  private savedInlineStyles = new Map<HTMLElement | SVGElement, InlineStyles>();
  private growingTexts = new Set<Element>();
  private tokens: BuildTokens = {
    brand: "",
    onBrand: "",
    danger: "",
    onDanger: "",
    placeholder: "",
    surface: "",
    rulerLine: "",
    rulerText: "",
    foreground: "",
    fontFamily: "",
    dark: false,
  };
  private frameHandle = 0;
  private lastFrame = 0;
  private elapsed = 0;
  private lastStatus = 0;
  private lastSweep = 0;
  private idleTime = 0;
  private introRunning = false;
  private introElapsed = 0;
  private introPaths: IntroPath[] = [];
  private ringCount = 0;
  private trailClock = 0;
  private trailFade = 0;
  private roaming = false;
  private lastAgentCount = 0;
  private started = false;
  private finished = false;
  private needsRemeasure = false;
  private paused = false;
  private speed: 1 | 2 = 1;
  private done = 0;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private layoutWidth = 0;

  constructor(private readonly options: EngineOptions) {
    const context = options.canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context is not available");
    this.context = context;
    this.updateGuideCount();
    this.updateOverlayState();
  }

  // 요소를 숨기고 커서를 준비한 뒤 재생 시작
  start() {
    this.started = true;
    this.addListeners();
    this.prepare();
    this.runLoop();
  }

  // 조립 재생 없이 완성된 화면에서 커서 3개만 돌아다니게 표시
  showFinished() {
    this.started = true;
    this.addListeners();
    this.startRoaming();
  }

  // 처음 상태로 되돌려 다시 재생
  restart() {
    if (!this.started) {
      this.start();
      return;
    }
    this.resetElements();
    this.prepare();
    this.runLoop();
  }

  // 일시정지와 재생 전환
  togglePause() {
    this.paused = !this.paused;
    for (const animation of this.animations) {
      if (this.paused) animation.pause();
      else animation.play();
    }
    this.emitStatus();
  }

  // 재생 속도를 1배속과 2배속 사이에서 전환
  toggleSpeed() {
    this.speed = this.speed === 1 ? 2 : 1;
    for (const animation of this.animations) animation.playbackRate = this.speed;
    this.emitStatus();
  }

  // 남은 과정을 건너뛰고 완성된 화면 표시
  finishNow() {
    this.resetElements();
    this.done = this.layers.length;
    this.startRoaming();
  }

  // 이벤트와 애니메이션을 정리하고 완성된 화면 상태로 복구
  destroy() {
    if (!this.started) return;
    window.removeEventListener("resize", this.handleResize);
    this.options.root.removeEventListener("focusin", this.handleFocus);
    document.fonts?.removeEventListener("loadingdone", this.handleFontsLoaded);
    this.stopLoop();
    this.resetElements();
  }

  private addListeners() {
    window.addEventListener("resize", this.handleResize);
    this.options.root.addEventListener("focusin", this.handleFocus);
    document.fonts?.addEventListener("loadingdone", this.handleFontsLoaded);
  }

  private prepare() {
    const collected = collectLayers(this.options.root);
    this.layers = collected.layers;
    this.groups = collected.groups;
    this.layerByElement = new Map(this.layers.map((layer) => [layer.el, layer]));
    for (const layer of this.layers) layer.el.setAttribute("data-build-hidden", "");
    delete document.documentElement.dataset.build;

    this.prepareScene();

    this.guides = this.collectGuides();
    this.overlayAlpha = 0;
    this.updateGuideCount();
    this.updateOverlayState();
    this.flashes = [];
    this.elapsed = 0;
    this.idleTime = 0;
    this.lastStatus = 0;
    this.lastSweep = 0;
    this.done = 0;
    this.roaming = false;
    this.finished = false;
    this.paused = false;
    this.options.canvas.style.display = "block";
    this.startIntro();
    this.emitStatus();
  }

  // 커서들이 화면 양옆에서 들어와 화면 가운데를 둘러싸고 함께 도는 시작 고리 준비. 왼쪽 반원 커서는 왼쪽에서, 오른쪽 반원 커서는 오른쪽에서 들어옴
  private startIntro() {
    this.ringCount = Math.min(this.agents.length, RING_COUNT);
    this.introPaths = this.agents.slice(0, this.ringCount).map((agent, index) => {
      const angle = (index / this.ringCount) * Math.PI * 2;
      const spot = this.ringPoint(angle);
      const fromLeft = Math.cos(angle) < 0;
      const from = {
        x: fromLeft ? window.scrollX - OFF_SCREEN_MARGIN : window.scrollX + this.width + OFF_SCREEN_MARGIN,
        y: clamp(spot.y + randomBetween(-120, 120), window.scrollY + 40, window.scrollY + this.height - 40),
      };
      Object.assign(agent, from);
      agent.active = true;
      agent.alpha = 0;
      agent.steps = [];
      agent.trail = [];
      return { agent, from, angle, delay: randomBetween(0, INTRO_MAX_DELAY) };
    });
    this.introElapsed = 0;
    this.trailClock = 0;
    this.trailFade = 0;
    this.introRunning = true;
    this.options.canvas.setAttribute("data-build-intro", "");
  }

  // 시작 고리를 풀고 커서들이 각자 일을 맡도록 전환. 꼬리는 바로 지우지 않고 짧게 줄여 없앰
  private endIntro() {
    if (!this.introRunning) return;
    this.introRunning = false;
    this.introPaths = [];
    this.trailFade = TRAIL_FADE;
    this.options.canvas.removeAttribute("data-build-intro");
    for (const agent of this.agents) {
      if (agent.active) agent.alpha = 1;
    }
    this.emitStatus();
  }

  // 화면 가운데를 중심으로 한 지름 120px 원 위의 위치. 좁은 화면에서는 커서가 화면 밖으로 나가지 않도록 줄임
  private ringPoint(angle: number): Point {
    const radius = Math.min(RING_RADIUS, this.width / 2 - RING_EDGE);
    return {
      x: window.scrollX + this.width / 2 - RING_SHIFT.x + Math.cos(angle) * radius,
      y: window.scrollY + this.height / 2 - RING_SHIFT.y + Math.sin(angle) * radius,
    };
  }

  // 커서마다 정해진 시간에 출발해 돌고 있는 고리 위 위치로 다가가고, 고리 전체는 일정한 속도로 회전
  private updateIntro(delta: number) {
    this.introElapsed += delta;
    const turn = (this.introElapsed / INTRO_TURN) * Math.PI * 2;
    for (const { agent, from, angle, delay } of this.introPaths) {
      const local = this.introElapsed - delay;
      if (local <= 0) continue;
      const spot = this.ringPoint(angle - turn);
      const eased = 1 - (1 - Math.min(1, local / INTRO_ENTER)) ** 3;
      agent.x = from.x + (spot.x - from.x) * eased;
      agent.y = from.y + (spot.y - from.y) * eased;
      agent.alpha = Math.min(1, local / INTRO_FADE_IN);
    }
    if (this.introElapsed >= INTRO_DURATION) this.endIntro();
  }

  // 고리 동안 커서가 지나온 위치를 모아 꼬리로 남기고, 고리가 끝나면 꼬리 길이를 줄여 지움
  private updateTrails(delta: number) {
    if (!this.introRunning && this.trailFade <= 0) return;
    this.trailClock += delta;
    const sample = this.trailClock >= TRAIL_SAMPLE;
    if (sample) this.trailClock %= TRAIL_SAMPLE;
    if (!this.introRunning) this.trailFade = Math.max(0, this.trailFade - delta);
    const limit = this.introRunning ? TRAIL_LENGTH : Math.round((TRAIL_LENGTH * this.trailFade) / TRAIL_FADE);
    for (const agent of this.agents) {
      if (sample && agent.active) agent.trail.push({ x: agent.x, y: agent.y });
      if (agent.trail.length > limit) agent.trail.splice(0, agent.trail.length - limit);
    }
  }

  // Canvas 크기와 토큰을 읽고 name tag 가 달린 커서 생성
  private prepareScene() {
    this.resizeCanvas();
    this.layoutWidth = window.innerWidth;
    this.rulerSize = window.innerWidth < 768 ? MOBILE_RULER_SIZE : RULER_SIZE;
    const { tokens, palette } = readTokens(this.context);
    this.tokens = tokens;

    const count = window.innerWidth < 768 ? MOBILE_AGENT_COUNT : DESKTOP_AGENT_COUNT;
    this.agents = Array.from({ length: count }, (_, index): Agent => ({
      ...palette[index % palette.length],
      name: AGENT_ROLES[index % AGENT_ROLES.length].name,
      jobs: AGENT_ROLES[index % AGENT_ROLES.length].jobs,
      size: AGENT_SIZE,
      arc: Math.random() < 0.5 ? -1 : 1,
      ...this.entryPoint(),
      trail: [],
      alpha: 0,
      active: false,
      busy: false,
      tool: "arrow",
      draft: null,
      caret: null,
      chip: null,
      carry: null,
      dropTarget: null,
      steps: [],
      stepElapsed: 0,
    }));
  }

  // 완성된 화면 위에서 커서 3개만 돌아다니는 상태로 전환
  private startRoaming() {
    if (this.agents.length === 0) this.prepareScene();
    this.roaming = true;
    this.finished = true;
    this.paused = false;
    this.options.canvas.style.display = "block";
    this.runLoop();
    this.emitStatus();
  }

  // 마무리 동작까지 끝나면 효과용 표시를 지우고 다시 보기 버튼으로 전환
  private completeBuild() {
    for (const el of Array.from(this.savedInlineStyles.keys())) this.restoreInlineStyle(el);
    for (const layer of this.layers) {
      layer.el.removeAttribute("data-build-hidden");
      layer.el.removeAttribute("data-build-phase");
    }
    this.finished = true;
    this.emitStatus();
  }

  // 숨김 표시와 진행 중인 효과를 모두 제거
  private resetElements() {
    this.introRunning = false;
    this.introPaths = [];
    this.trailFade = 0;
    this.options.canvas.removeAttribute("data-build-intro");
    for (const animation of this.animations) animation.cancel();
    this.animations.clear();
    for (const el of Array.from(this.savedInlineStyles.keys())) this.restoreInlineStyle(el);
    for (const layer of this.layers) {
      layer.el.removeAttribute("data-build-hidden");
      layer.el.removeAttribute("data-build-phase");
      layer.state = "revealed";
    }
    for (const group of this.groups) {
      group.state = "applied";
      for (const item of group.items) item.ghost = false;
    }
    for (const agent of this.agents) {
      agent.active = false;
      agent.busy = false;
      agent.steps = [];
      agent.draft = null;
      agent.caret = null;
      agent.chip = null;
      agent.carry = null;
      agent.dropTarget = null;
      agent.trail = [];
    }
    this.flashes = [];
    this.growingTexts.clear();
    // 놓은 가이드만 남겨 완성 화면 위에서 서서히 사라지게 함
    this.guides = this.guides.filter((guide) => guide.placed);
    for (const guide of this.guides) guide.label = null;
    delete document.documentElement.dataset.build;
    this.clearCanvas();
  }

  // 시험과 확인을 위해 지금 보이는 놓인 가이드 수를 Canvas 에 표시
  private updateGuideCount() {
    this.options.canvas.dataset.buildGuides = `${this.guides.filter((guide) => guide.placed).length}`;
  }

  // 첫 제목을 감싼 폭 제한 컨테이너의 본문 왼쪽, 오른쪽 경계와 제목 위쪽에 놓을 가이드 생성
  private collectGuides(): Guide[] {
    const targets = this.measureGuideTargets();
    if (!targets) return [];
    return targets.map(({ axis, target }) => ({ axis, target, position: null, label: null, claimed: false, placed: false }));
  }

  private measureGuideTargets(): { axis: Guide["axis"]; target: number }[] | null {
    const heading = this.options.root.querySelector("h1");
    if (!heading) return null;
    const lines = measureTextLines(heading);
    const targets: { axis: Guide["axis"]; target: number }[] = [];
    let container = heading.parentElement;
    while (container && container !== this.options.root && getComputedStyle(container).maxWidth === "none") {
      container = container.parentElement;
    }
    if (container && container !== this.options.root) {
      const style = getComputedStyle(container);
      const rect = readRect(container);
      targets.push({ axis: "x", target: rect.x + parseFloat(style.paddingLeft) });
      targets.push({ axis: "x", target: rect.x + rect.w - parseFloat(style.paddingRight) });
    }
    targets.push({ axis: "y", target: readRect(heading).y + lines[0].top });
    return targets;
  }

  // 글꼴 적용 뒤 바뀐 위치로 가이드를 옮김
  private remeasureGuides() {
    const targets = this.measureGuideTargets();
    if (!targets || targets.length !== this.guides.length) return;
    this.guides.forEach((guide, index) => {
      guide.target = targets[index].target;
      if (guide.placed) guide.position = guide.target;
    });
  }

  // 효과용 스타일을 적용하기 전에 요소에 직접 지정된 값 저장
  private overrideInlineStyle(el: HTMLElement | SVGElement, styles: Partial<InlineStyles>) {
    if (!this.savedInlineStyles.has(el)) {
      const { clipPath, borderRadius, transform, transformOrigin } = el.style;
      this.savedInlineStyles.set(el, { clipPath, borderRadius, transform, transformOrigin });
    }
    Object.assign(el.style, styles);
  }

  // 효과가 끝난 요소를 저장해 둔 원래 스타일로 복원
  private restoreInlineStyle(el: HTMLElement | SVGElement) {
    const saved = this.savedInlineStyles.get(el);
    if (!saved) return;
    Object.assign(el.style, saved);
    this.savedInlineStyles.delete(el);
  }

  private clearCanvas() {
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.options.canvas.width, this.options.canvas.height);
    this.options.canvas.style.display = "none";
  }

  private resizeCanvas() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.options.canvas.width = Math.round(this.width * this.dpr);
    this.options.canvas.height = Math.round(this.height * this.dpr);
  }

  private handleResize = () => {
    this.resizeCanvas();
    // 폭이 바뀌면 측정한 위치가 모두 틀어지므로 완성된 화면으로 전환함
    if (!this.finished && window.innerWidth !== this.layoutWidth) this.finishNow();
  };

  private handleFontsLoaded = () => {
    this.needsRemeasure = !this.finished;
  };

  // 글꼴 적용 후 위치 재측정. 움직이거나 줄어든 요소를 재면 위치가 틀어지므로 자동 레이아웃과 글자 키우기 중에는 미룸
  private remeasureIfReady() {
    if (!this.needsRemeasure || this.growingTexts.size > 0) return;
    if (this.groups.some((group) => group.state === "applying")) return;
    this.needsRemeasure = false;
    for (const layer of this.layers) layer.rect = readRect(layer.el);
    for (const group of this.groups) group.rect = readRect(group.el);
    this.remeasureGuides();
  }

  // 키보드 포커스가 들어온 요소와 상위 요소 즉시 표시
  private handleFocus = (event: FocusEvent) => {
    if (this.finished) return;
    let node = event.target as Element | null;
    while (node && node !== this.options.root) {
      const layer = this.layerByElement.get(node);
      if (layer) this.revealInstantly(layer);
      node = node.parentElement;
    }
  };

  private runLoop() {
    this.stopLoop();
    this.lastFrame = performance.now();
    this.frameHandle = requestAnimationFrame(this.frame);
  }

  private stopLoop() {
    cancelAnimationFrame(this.frameHandle);
    this.frameHandle = 0;
  }

  private frame = (now: number) => {
    const delta = Math.min(now - this.lastFrame, MAX_FRAME_TIME);
    this.lastFrame = now;
    if (!this.paused) this.update(delta * (this.finished ? 1 : this.speed));
    this.paint();
    const agentCount = this.agents.filter((agent) => agent.active).length;
    if (now - this.lastStatus > STATUS_INTERVAL && (!this.finished || agentCount !== this.lastAgentCount)) {
      this.lastStatus = now;
      this.lastAgentCount = agentCount;
      this.emitStatus();
    }
    this.frameHandle = requestAnimationFrame(this.frame);
  };

  private paint() {
    const scene: BuildScene = {
      width: this.width,
      height: this.height,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      dpr: this.dpr,
      agents: this.agents,
      groups: this.groups,
      flashes: this.flashes,
      guides: this.guides,
      rulerSize: this.rulerSize,
      overlayAlpha: this.overlayAlpha,
      tokens: this.tokens,
    };
    paintScene(this.context, scene);
  }

  private emitStatus() {
    this.options.onStatus({
      agents: this.agents.filter((agent) => agent.active).length,
      total: this.layers.length,
      done: this.done,
      paused: this.paused,
      speed: this.speed,
      finished: this.finished,
      waiting: !this.roaming && this.idleTime > IDLE_DELAY,
      scanning: this.introRunning,
      colors: this.agents.slice(0, 5).map((agent) => agent.color),
    });
  }

  // 시작 고리가 도는 동안에는 일을 나눠 주지 않고, 고리가 끝난 뒤부터 조립 시간을 셈
  private update(delta: number) {
    if (this.introRunning) this.updateIntro(delta);
    else this.updateWork(delta);
    this.updateTrails(delta);
  }

  private updateWork(delta: number) {
    this.elapsed += delta;
    if (!this.roaming) {
      this.remeasureIfReady();
      this.sweepPassedLayers();
    }
    this.updateAgentPool(delta);
    for (const agent of this.agents) {
      if (agent.active) this.advanceAgent(agent, delta);
    }
    for (const flash of this.flashes) flash.age += delta;
    this.flashes = this.flashes.filter((flash) => flash.age < flash.ttl);
    this.updateOverlay(delta);

    if (!this.roaming && this.done >= this.layers.length) this.roaming = true;
    if (this.roaming && !this.finished && !this.agents.some((agent) => agent.active && agent.busy)) {
      this.completeBuild();
    }
  }

  // 커서가 일하는 동안 눈금자와 가이드를 띄우고, 화면 안 작업이 끝나면 서서히 옅게 함. 스크롤로 작업이 다시 생기면 다시 띄우고 페이지 조립이 끝나면 가이드를 지움
  private updateOverlay(delta: number) {
    const waiting = !this.roaming && this.idleTime > IDLE_DELAY;
    if (!this.finished && !waiting) {
      this.overlayAlpha = Math.min(1, this.overlayAlpha + delta / OVERLAY_FADE_IN);
    } else if (this.overlayAlpha > 0) {
      this.overlayAlpha = Math.max(0, this.overlayAlpha - delta / OVERLAY_FADE_OUT);
      if (this.overlayAlpha === 0 && this.finished) {
        this.guides = [];
        this.updateGuideCount();
      }
    }
    this.updateOverlayState();
  }

  // 시험과 확인을 위해 눈금자가 보이는지를 바뀔 때만 Canvas 에 표시
  private updateOverlayState() {
    const state = this.overlayAlpha > 0 ? "shown" : "hidden";
    if (this.options.canvas.dataset.buildOverlay !== state) this.options.canvas.dataset.buildOverlay = state;
  }

  // 할 일의 양에 맞춰 화면에 나타나는 커서 수 조절. 시작 고리에 있던 커서 수에서부터 늘림
  private updateAgentPool(delta: number) {
    const hasWork = !this.roaming && this.hasAvailableWork();
    this.idleTime = hasWork ? 0 : this.idleTime + delta;

    const ramp = Math.floor(this.ringCount + (this.elapsed / 1000) * AGENTS_PER_SECOND);
    const desired = this.roaming || this.idleTime > IDLE_DELAY ? AMBIENT_AGENT_COUNT : Math.min(this.agents.length, ramp);

    this.agents.forEach((agent, index) => {
      if (index < desired && !agent.active) {
        Object.assign(agent, this.entryPoint());
        agent.active = true;
        agent.alpha = 0;
        agent.steps = [];
      }
      if (agent.active && index < desired) agent.alpha = Math.min(1, agent.alpha + delta / 220);
      if (agent.active && index >= desired && !agent.busy) {
        agent.alpha -= delta / 260;
        if (agent.alpha <= 0) {
          agent.active = false;
          agent.steps = [];
        }
      }
    });
  }

  // 작업 중인 커서나 진행 중인 자동 레이아웃까지 포함해 남은 일이 있는지 판별
  private hasAvailableWork() {
    if (this.guides.some((guide) => !guide.claimed)) return true;
    if (this.agents.some((agent) => agent.active && agent.busy)) return true;
    if (this.groups.some((group) => group.state === "applying" || this.isGroupAvailable(group))) return true;
    return this.layers.some((layer) => this.isLayerAvailable(layer));
  }

  // 화면 위로 지나간 요소는 커서 없이 바로 표시
  private sweepPassedLayers() {
    if (this.elapsed - this.lastSweep < SWEEP_INTERVAL) return;
    this.lastSweep = this.elapsed;
    for (const group of this.groups) {
      if (group.state !== "applied" && this.isPassed(group.rect)) this.applyGroupInstantly(group);
    }
    for (const layer of this.layers) {
      if (layer.state === "hidden" && !layer.isGroupItem && !layer.isSticky && this.isPassed(layer.rect)) {
        this.revealInstantly(layer);
      }
    }
  }

  // 화면 위로 지나간 영역 판별. 화면 안 판별과 같은 경계를 써서 어느 쪽에도 속하지 않는 구간을 방지함
  private isPassed(rect: Rect) {
    return rect.y + rect.h <= window.scrollY - PASSED_MARGIN;
  }

  // 페이지 끝에서는 더 내려갈 수 없으므로 화면 아래쪽 여백에 놓인 요소까지 작업 대상으로 판별
  private isInView(rect: Rect) {
    if (this.isPassed(rect)) return false;
    const isAtPageEnd = window.scrollY + this.height >= document.documentElement.scrollHeight - 2;
    return isAtPageEnd || rect.y < window.scrollY + this.height * VIEW_BOTTOM_RATIO;
  }

  private isLayerAvailable(layer: Layer) {
    if (layer.state !== "hidden" || layer.isGroupItem) return false;
    if (layer.parent && layer.parent.state !== "revealed") return false;
    return layer.isSticky || this.isInView(layer.rect);
  }

  private isGroupAvailable(group: LayoutGroup) {
    if (group.state !== "open") return false;
    if (group.owner && group.owner.state !== "revealed") return false;
    return this.isInView(group.rect);
  }

  private advanceAgent(agent: Agent, delta: number) {
    let remaining = delta;
    while (remaining > 0) {
      if (agent.steps.length === 0) this.assignWork(agent);
      const step = agent.steps[0];
      agent.stepElapsed += remaining;
      const progress = step.duration <= 0 ? 1 : Math.min(1, agent.stepElapsed / step.duration);
      step.tick?.(progress);
      if (progress < 1) return;
      remaining = agent.stepElapsed - step.duration;
      agent.stepElapsed = 0;
      step.finish?.();
      agent.steps.shift();
    }
  }

  // 커서에게 다음 일 배정. 할 일이 없으면 화면 아래쪽에서 대기
  private assignWork(agent: Agent) {
    agent.tool = "arrow";
    agent.draft = null;
    agent.caret = null;
    agent.chip = null;
    agent.carry = null;
    agent.dropTarget = null;
    if (this.roaming) {
      agent.busy = false;
      agent.steps = this.roamSteps(agent);
      return;
    }
    agent.busy = true;
    // Figma 처럼 가이드를 먼저 놓고, 다 놓은 뒤에 요소 작업을 시작함
    const guideWork = this.claimGuideWork(agent);
    if (guideWork) {
      agent.steps = guideWork;
      return;
    }
    if (this.guides.some((guide) => !guide.placed)) {
      agent.steps = this.waitForGuidesSteps(agent);
      return;
    }
    agent.steps = this.claimGroupWork(agent) ?? this.claimLayerWork(agent) ?? this.idleSteps(agent);
  }

  private claimGuideWork(agent: Agent) {
    if (!agent.jobs.includes("guide")) return null;
    const guide = this.guides.find((candidate) => !candidate.claimed);
    if (!guide) return null;
    guide.claimed = true;
    return this.guideSteps(agent, guide);
  }

  // 눈금자에서 가이드를 끌어내 정렬 위치에 놓는 동작 생성. 세로 가이드는 왼쪽 눈금자, 가로 가이드는 위쪽 눈금자에서 시작함
  private guideSteps(agent: Agent, guide: Guide): Step[] {
    const along = randomBetween(0.3, 0.7);
    const grab =
      guide.axis === "x"
        ? { x: window.scrollX + this.rulerSize / 2, y: window.scrollY + this.height * along }
        : { x: window.scrollX + this.width * along, y: window.scrollY + this.rulerSize / 2 };
    let from: Point | null = null;
    return [
      this.moveTo(agent, grab),
      {
        duration: randomBetween(560, 760),
        tick: (progress) => {
          from ??= { x: agent.x, y: agent.y };
          const eased = easeInOut(progress);
          if (guide.axis === "x") {
            guide.position = from.x + (guide.target - from.x) * eased;
            agent.x = guide.position;
          } else {
            guide.position = from.y + (guide.target - from.y) * eased;
            agent.y = guide.position;
          }
          guide.label = { x: agent.x, y: agent.y };
        },
        finish: () => {
          guide.position = guide.target;
          guide.label = null;
          guide.placed = true;
          this.updateGuideCount();
        },
      },
      { duration: 120 },
    ];
  }

  // 가이드를 다 놓을 때까지 화면 안을 짧게 맴도는 동작 생성
  private waitForGuidesSteps(agent: Agent): Step[] {
    agent.busy = false;
    const target = {
      x: window.scrollX + randomBetween(0.15, 0.85) * this.width,
      y: window.scrollY + randomBetween(0.2, 0.8) * this.height,
    };
    return [this.travel(agent, target, randomBetween(500, 900)), { duration: randomBetween(80, 220) }];
  }

  private claimGroupWork(agent: Agent) {
    if (!agent.jobs.includes("group")) return null;
    for (const group of this.groups) {
      if (!this.isGroupAvailable(group)) continue;
      const item = group.items.find((candidate) => !candidate.claimed);
      if (item) {
        item.claimed = true;
        return this.placeItemSteps(agent, item);
      }
      if (group.items.every((candidate) => candidate.placed)) {
        group.state = "applying";
        return this.applyGroupSteps(agent, group);
      }
    }
    return null;
  }

  private claimLayerWork(agent: Agent) {
    const candidates: Layer[] = [];
    for (const layer of this.layers) {
      if (this.isLayerAvailable(layer) && agent.jobs.includes(layerJob(layer))) candidates.push(layer);
      if (candidates.length >= 3) break;
    }
    if (candidates.length === 0) return null;
    const layer = candidates[Math.floor(Math.random() * candidates.length)];
    layer.state = "claimed";
    if (layer.isSticky) layer.rect = readRect(layer.el);
    return this.layerSteps(agent, layer);
  }

  private idleSteps(agent: Agent): Step[] {
    agent.busy = false;
    const applying = this.groups.find((group) => group.state === "applying");
    if (applying) {
      const { rect } = applying;
      const target = {
        x: rect.x + randomBetween(-0.08, 1.08) * rect.w,
        y: rect.y + randomBetween(-0.08, 1.08) * rect.h,
      };
      return [this.travel(agent, target, randomBetween(260, 460)), { duration: randomBetween(60, 180) }];
    }
    const target = {
      x: window.scrollX + randomBetween(0.08, 0.92) * this.width,
      y: window.scrollY + randomBetween(0.55, 0.92) * this.height,
    };
    return [this.travel(agent, target, randomBetween(1400, 2400)), { duration: randomBetween(1200, 3000) }];
  }

  // 완성된 화면 안을 천천히 돌아다니는 동작 생성. 스크롤로 화면 밖에 남으면 멈추지 않고 바로 돌아옴
  private roamSteps(agent: Agent): Step[] {
    const target = {
      x: window.scrollX + randomBetween(0.08, 0.92) * this.width,
      y: window.scrollY + randomBetween(0.12, 0.88) * this.height,
    };
    const pause: Step = {
      duration: randomBetween(1200, 3000),
      tick: () => {
        if (this.isOffScreen(agent)) agent.stepElapsed = pause.duration;
      },
    };
    return [this.travel(agent, target, randomBetween(1400, 2400)), pause];
  }

  private isOffScreen(point: Point) {
    return (
      point.x < window.scrollX - OFF_SCREEN_MARGIN ||
      point.x > window.scrollX + this.width + OFF_SCREEN_MARGIN ||
      point.y < window.scrollY - OFF_SCREEN_MARGIN ||
      point.y > window.scrollY + this.height + OFF_SCREEN_MARGIN
    );
  }

  // 커서를 곡선으로 목표 지점까지 이동
  private travel(agent: Agent, target: Point, duration: number): Step {
    let start: Point | null = null;
    return {
      duration,
      tick: (progress) => {
        if (!start) start = { x: agent.x, y: agent.y };
        const distance = Math.hypot(target.x - start.x, target.y - start.y);
        const eased = easeInOut(progress);
        const bend = Math.sin(Math.PI * eased) * Math.min(distance * 0.12, 42) * agent.arc;
        const normalX = distance ? -(target.y - start.y) / distance : 0;
        const normalY = distance ? (target.x - start.x) / distance : 0;
        agent.x = start.x + (target.x - start.x) * eased + normalX * bend;
        agent.y = start.y + (target.y - start.y) * eased + normalY * bend;
      },
    };
  }

  private travelTime(agent: Agent, target: Point) {
    return clamp(Math.hypot(target.x - agent.x, target.y - agent.y) * 0.55, 160, 480);
  }

  private moveTo(agent: Agent, target: Point) {
    return this.travel(agent, target, this.travelTime(agent, target));
  }

  // 시작점에서 끝점으로 영역을 드래그하는 동작 생성
  private dragRect(agent: Agent, rect: Rect, minDuration = 180): Step {
    return {
      duration: clamp(Math.sqrt(rect.w * rect.h) * 0.9, minDuration, 460),
      tick: (progress) => {
        const eased = easeInOut(progress);
        const draft = { x: rect.x, y: rect.y, w: rect.w * eased, h: rect.h * eased };
        agent.x = draft.x + draft.w;
        agent.y = draft.y + draft.h;
        agent.draft = { rect: draft, filled: true };
      },
    };
  }

  private addFlash(flash: Flash) {
    this.flashes.push(flash);
  }

  private layerSteps(agent: Agent, layer: Layer): Step[] {
    const { rect } = layer;
    if (layer.kind === "text") return this.typeSteps(agent, layer);
    if (layer.el instanceof HTMLImageElement) return this.dropImageSteps(agent, layer);

    const isLarge = rect.w >= 40 && rect.h >= 28;
    const roundsCorner = layer.kind === "frame" && isLarge && layer.radius >= 6 && Math.random() < 0.7;

    this.addFlash({ kind: "cross", x: rect.x, y: rect.y, age: 0, ttl: 340 });
    const steps: Step[] = [this.moveTo(agent, { x: rect.x, y: rect.y }), this.dragRect(agent, rect)];
    steps.push({
      duration: 60,
      finish: () => {
        agent.draft = null;
        if (roundsCorner && layer.state !== "revealed") {
          this.overrideInlineStyle(layer.el, { borderRadius: "0px" });
        }
        this.revealLayer(layer);
      },
    });

    if (roundsCorner) {
      const corner = { x: rect.x + Math.min(layer.radius + 8, rect.w / 2), y: rect.y + Math.min(layer.radius + 8, rect.h / 2) };
      steps.push(this.moveTo(agent, corner), this.radiusStep(layer, corner));
    }
    if (isLarge && layer.fill && Math.random() < 0.85) {
      steps.push({
        duration: 240,
        finish: () => {
          this.addFlash({ kind: "chip", x: agent.x + 28, y: agent.y + 18, label: `Fill ${layer.fill}`, age: 0, ttl: 620 });
        },
      });
    }
    if (layer.parent && Math.random() < 0.22) this.addMeasure(layer);
    return steps;
  }

  // 커서가 가까운 화면 바깥으로 나가 사진 썸네일을 들고 들어온 뒤 사진 영역에 놓는 동작 생성
  private dropImageSteps(agent: Agent, layer: Layer): Step[] {
    const image = layer.el as HTMLImageElement;
    const { rect } = layer;
    const isNarrow = this.width < 768;
    const w = clamp(rect.w * 0.35, isNarrow ? 80 : 96, isNarrow ? 130 : 180);
    const h = (w * rect.h) / Math.max(rect.w, 1);
    const carry: Carry = { image, w, h, offset: { x: -w * 0.3, y: -h * 0.3 }, label: imageFileName(image) };

    const center = { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
    const viewTop = window.scrollY;
    const fromLeft = center.x - window.scrollX < this.width / 2;
    const outside = {
      x: fromLeft ? window.scrollX - 60 : window.scrollX + this.width + 60,
      y: clamp(center.y + randomBetween(-80, 80), viewTop + 60, viewTop + this.height - 60),
    };
    // 사진이 화면보다 길면 화면 안에 보이는 부분에 놓도록 놓는 위치를 화면 안으로 당김
    const visibleY = clamp(center.y, viewTop + 80, viewTop + this.height - 80);
    const drop = { x: center.x, y: clamp(visibleY, rect.y + 10, rect.y + rect.h - 10) };
    const isInside = (point: Point) =>
      point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
    const carryIn = this.travel(agent, drop, randomBetween(700, 950));

    return [
      this.travel(agent, outside, clamp(Math.hypot(outside.x - agent.x, outside.y - agent.y) * 0.45, 260, 620)),
      {
        duration: 140,
        finish: () => {
          agent.carry = carry;
          image.setAttribute("data-build-phase", "dragging");
        },
      },
      {
        duration: carryIn.duration,
        tick: (progress) => {
          carryIn.tick?.(progress);
          agent.dropTarget = isInside(agent) ? rect : null;
        },
      },
      {
        duration: 180,
        tick: () => {
          agent.dropTarget = rect;
        },
      },
      {
        duration: 0,
        finish: () => {
          const thumb = { x: agent.x + carry.offset.x, y: agent.y + carry.offset.y, w: carry.w, h: carry.h };
          agent.carry = null;
          agent.dropTarget = null;
          image.setAttribute("data-build-phase", "dropping");
          this.revealDroppedImage(layer, thumb);
        },
      },
      { duration: DROP_SETTLE, finish: () => image.removeAttribute("data-build-phase") },
    ];
  }

  // 놓은 썸네일의 위치와 크기에서 원래 크기로 튕기며 커지는 효과와 함께 사진 표시
  private revealDroppedImage(layer: Layer, thumb: Rect) {
    if (layer.state === "revealed") return;
    layer.el.removeAttribute("data-build-hidden");
    this.markRevealed(layer);
    const { rect } = layer;
    const scale = thumb.w / Math.max(rect.w, 1);
    this.play(
      layer.el,
      [
        {
          transformOrigin: "0 0",
          transform: `translate(${thumb.x - rect.x}px, ${thumb.y - rect.y}px) scale(${scale})`,
          opacity: 0.92,
        },
        { transformOrigin: "0 0", transform: "translate(0px, 0px) scale(1)", opacity: 1 },
      ],
      { duration: DROP_SETTLE, easing: SPRING_EASING },
    );
  }

  // 모서리를 드래그해 둥글게 만드는 동작 생성
  private radiusStep(layer: Layer, corner: Point): Step {
    return {
      duration: 260,
      finish: () => {
        this.restoreInlineStyle(layer.el);
        this.play(
          layer.el,
          [{ borderRadius: "0px" }, { borderRadius: `${layer.radius}px` }],
          { duration: 260, easing: "ease-out" },
        );
        this.addFlash({
          kind: "chip",
          x: corner.x + 24,
          y: corner.y + 14,
          label: `R ${Math.round(layer.radius)}`,
          age: 0,
          ttl: 560,
        });
      },
    };
  }

  // 부모 프레임까지의 거리를 빨간 측정선으로 표시
  private addMeasure(layer: Layer) {
    const parent = layer.parent?.rect;
    if (!parent) return;
    const { rect } = layer;
    const left = rect.x - parent.x;
    const top = rect.y - parent.y;
    const midX = rect.x + rect.w / 2;
    const midY = rect.y + rect.h / 2;
    const age = -650;
    const ttl = 1050;
    if (left >= 8) {
      this.addFlash({
        kind: "measure",
        from: { x: parent.x, y: midY },
        to: { x: rect.x, y: midY },
        label: `${Math.round(left)}`,
        age,
        ttl,
      });
    } else if (top >= 8) {
      this.addFlash({
        kind: "measure",
        from: { x: midX, y: parent.y },
        to: { x: midX, y: rect.y },
        label: `${Math.round(top)}`,
        age,
        ttl,
      });
    }
  }

  // 글자를 한 줄씩 왼쪽부터 드러내는 입력 동작 생성. 큰 글자는 작은 크기로 입력한 뒤 키움
  private typeSteps(agent: Agent, layer: Layer): Step[] {
    const el = layer.el as HTMLElement;
    const length = el.textContent?.trim().length ?? 0;
    const style = getComputedStyle(el);
    const start = { x: layer.rect.x, y: layer.rect.y };

    // inline 요소에는 transform 이 적용되지 않아 크기 키우기에서 제외함
    if (style.display === "inline") {
      return [this.moveTo(agent, start), { duration: 120, finish: () => this.revealLayer(layer) }];
    }

    const lines = measureTextLines(layer.el);
    const widths = lines.map((line) => line.right - line.left);
    const totalWidth = widths.reduce((sum, width) => sum + width, 0) || 1;
    const glyphs = Math.max(length, 1);
    const growth = this.textGrowth(layer, style, lines);
    const scale = growth?.startScale ?? 1;
    const caretStart = textPoint(layer, growth, scale, lines[0].left, lines[0].top);
    let started = false;

    const typing: Step = {
      duration: clamp(length * 24, 240, 1000),
      tick: (progress) => {
        if (!started) {
          started = true;
          agent.tool = "text";
          el.setAttribute("data-build-phase", "typing");
          this.overrideInlineStyle(el, { clipPath: "inset(0 100% 0 0)" });
          if (growth) {
            this.growingTexts.add(el);
            this.overrideInlineStyle(el, {
              transform: `scale(${growth.startScale})`,
              transformOrigin: `${growth.origin.x}px ${growth.origin.y}px`,
            });
            // 키우기가 끝날 때까지 안쪽 요소 작업이 시작되지 않도록 완성 처리는 미룸
            el.removeAttribute("data-build-hidden");
          } else {
            this.revealLayer(layer);
          }
        }
        let remaining = (Math.floor(progress * glyphs) / glyphs) * totalWidth;
        let index = 0;
        while (index < lines.length - 1 && remaining > widths[index]) {
          remaining -= widths[index];
          index += 1;
        }
        const line = lines[index];
        const edge = line.left + Math.min(remaining, widths[index]);
        // clip-path 는 배율 적용 전 좌표를 쓰므로 화면에서 잰 폭을 배율로 되돌림
        const width = el.getBoundingClientRect().width / scale;
        el.style.clipPath = `polygon(-4px -4px, ${width + 4}px -4px, ${width + 4}px ${line.top}px, ${edge}px ${line.top}px, ${edge}px ${line.bottom + 2}px, -4px ${line.bottom + 2}px)`;
        const caret = textPoint(layer, growth, scale, edge, line.top);
        const height = (line.bottom - line.top) * scale;
        agent.caret = { x: caret.x, y: caret.y, height };
        agent.x = caret.x + 2;
        agent.y = caret.y + height * 0.75;
      },
      finish: () => {
        agent.draft = null;
        agent.caret = null;
        agent.tool = "arrow";
        if (growth) {
          el.style.clipPath = this.savedInlineStyles.get(el)?.clipPath ?? "";
          return;
        }
        this.restoreInlineStyle(el);
        el.removeAttribute("data-build-phase");
      },
    };

    return [
      ...(layer.isFramedText
        ? this.frameBeforeTypingSteps(agent, layer, caretStart)
        : [this.moveTo(agent, caretStart)]),
      typing,
      ...(growth ? this.growSteps(agent, layer, growth) : []),
    ];
  }

  // 큰 글자를 Figma 새 글자 기본 크기에서 시작하도록 배율과 기준점 계산. 표 셀과 작은 글자는 제외함
  private textGrowth(layer: Layer, style: CSSStyleDeclaration, lines: TextBox[]): TextGrowth | null {
    const fontSize = parseFloat(style.fontSize);
    if (layer.isFramedText || !(fontSize >= GROW_MIN_FONT_SIZE)) return null;
    const align = style.textAlign;
    const originX = align === "center" ? layer.rect.w / 2 : align === "right" || align === "end" ? layer.rect.w : 0;
    return {
      fontSize,
      startScale: GROW_START_FONT_SIZE / fontSize,
      origin: { x: originX, y: 0 },
      box: unionLines(lines),
    };
  }

  // 글자 영역 오른쪽 아래 모서리를 끌어 글자 크기를 정수 px 단위로 키우는 동작 생성
  private growSteps(agent: Agent, layer: Layer, growth: TextGrowth): Step[] {
    const el = layer.el as HTMLElement;
    const { box, fontSize, startScale } = growth;
    const corner = (scale: number) => textPoint(layer, growth, scale, box.right, box.bottom);
    const selection = (scale: number): Rect => {
      const topLeft = textPoint(layer, growth, scale, box.left, box.top);
      const bottomRight = corner(scale);
      return { x: topLeft.x, y: topLeft.y, w: bottomRight.x - topLeft.x, h: bottomRight.y - topLeft.y };
    };
    let started = false;

    return [
      this.moveTo(agent, corner(startScale)),
      {
        duration: clamp((fontSize - GROW_START_FONT_SIZE) * GROW_MS_PER_PX, 420, 900),
        tick: (progress) => {
          if (!started) {
            started = true;
            el.setAttribute("data-build-phase", "sizing");
          }
          const size = Math.round(GROW_START_FONT_SIZE + (fontSize - GROW_START_FONT_SIZE) * easeInOut(progress));
          const scale = progress >= 1 ? 1 : size / fontSize;
          el.style.transform = `scale(${scale})`;
          const point = corner(scale);
          agent.x = point.x;
          agent.y = point.y;
          agent.draft = { rect: selection(scale), filled: false, hideSize: true };
          agent.chip = `Size ${size}`;
        },
        finish: () => {
          this.restoreInlineStyle(el);
          el.removeAttribute("data-build-phase");
          this.growingTexts.delete(el);
          agent.draft = null;
          agent.chip = null;
          this.addFlash({ kind: "chip", x: agent.x + 34, y: agent.y - 24, label: `Size ${Math.round(fontSize)}`, age: 0, ttl: 520 });
          this.revealLayer(layer);
        },
      },
    ];
  }

  // 표 셀의 프레임을 먼저 그리고 윤곽선만 남긴 채 글자 시작 위치로 이동하는 동작 생성
  private frameBeforeTypingSteps(agent: Agent, layer: Layer, caretStart: Point): Step[] {
    const { rect } = layer;
    this.addFlash({ kind: "cross", x: rect.x, y: rect.y, age: 0, ttl: 340 });
    return [
      this.moveTo(agent, { x: rect.x, y: rect.y }),
      { duration: 0, finish: () => layer.el.setAttribute("data-build-phase", "framing") },
      this.dragRect(agent, rect, FRAMED_TEXT_MIN_DRAG),
      {
        duration: FRAMED_TEXT_PLACEHOLDER_HOLD,
        finish: () => {
          agent.draft = { rect, filled: false };
        },
      },
      this.travel(agent, caretStart, FRAMED_TEXT_CARET_MOVE),
    ];
  }

  // 자동 레이아웃 항목을 흩어진 위치에 먼저 그리는 동작 생성
  private placeItemSteps(agent: Agent, item: GroupItem): Step[] {
    const { rect } = item.layer;
    const scattered = { x: rect.x + item.offset.x, y: rect.y + item.offset.y, w: rect.w, h: rect.h };
    this.addFlash({ kind: "cross", x: scattered.x, y: scattered.y, age: 0, ttl: 340 });
    return [
      this.moveTo(agent, { x: scattered.x, y: scattered.y }),
      this.dragRect(agent, scattered),
      {
        duration: 70,
        finish: () => {
          agent.draft = null;
          item.placed = true;
          item.ghost = item.layer.state !== "revealed";
        },
      },
    ];
  }

  // 항목을 모두 선택하고 자동 레이아웃을 적용하는 동작 생성
  private applyGroupSteps(agent: Agent, group: LayoutGroup): Step[] {
    const { rect } = group;
    const padded = { x: rect.x - 10, y: rect.y - 10, w: rect.w + 20, h: rect.h + 20 };
    const center = { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
    return [
      this.moveTo(agent, { x: padded.x, y: padded.y }),
      {
        duration: 260,
        tick: (progress) => {
          const eased = easeInOut(progress);
          agent.x = padded.x + padded.w * eased;
          agent.y = padded.y + padded.h * eased;
          agent.draft = {
            rect: { x: padded.x, y: padded.y, w: padded.w * eased, h: padded.h * eased },
            filled: false,
          };
        },
      },
      this.moveTo(agent, center),
      {
        duration: 180,
        finish: () => {
          agent.draft = null;
          this.addFlash({ kind: "marquee", rect: padded, age: 0, ttl: 620 });
          this.addFlash({ kind: "chip", x: center.x + 24, y: center.y + 20, label: "⇧ A  Auto layout", age: 0, ttl: 760 });
          this.fireAutoLayout(group);
        },
      },
      {
        duration: 560,
        finish: () => this.settleGroup(group, padded),
      },
    ];
  }

  // 흩어진 항목이 실제 레이아웃 위치로 튕기며 모이는 효과 재생
  private fireAutoLayout(group: LayoutGroup) {
    if (group.state === "applied") return;
    group.items.forEach((item, index) => {
      item.ghost = false;
      item.layer.state = "claimed";
      item.layer.el.removeAttribute("data-build-hidden");
      this.play(
        item.layer.el,
        [
          { transform: `translate(${item.offset.x}px, ${item.offset.y}px)`, opacity: 0.7 },
          { transform: "translate(0, 0)", opacity: 1 },
        ],
        { duration: 520, delay: index * 40, easing: SPRING_EASING, fill: "backwards" },
      );
    });
  }

  // 정렬 완료 후 항목 사이 간격을 표시하고 안쪽 요소 작업 허용
  private settleGroup(group: LayoutGroup, outline: Rect) {
    if (group.state === "applied") return;
    for (const item of group.items) this.markRevealed(item.layer);
    group.state = "applied";
    this.addFlash({ kind: "outline", rect: outline, age: 0, ttl: 900 });
    for (let index = 0; index < group.items.length - 1; index += 1) {
      const gap = this.gapBetween(group.items[index].layer.rect, group.items[index + 1].layer.rect);
      if (gap) this.addFlash({ kind: "gap", ...gap, age: 0, ttl: 900 });
    }
  }

  // 나란히 놓인 두 요소 사이의 간격 영역 계산
  private gapBetween(first: Rect, second: Rect) {
    const horizontal = second.x - (first.x + first.w);
    if (horizontal > 0.5 && second.y < first.y + first.h && first.y < second.y + second.h) {
      const top = Math.max(first.y, second.y);
      const bottom = Math.min(first.y + first.h, second.y + second.h);
      return {
        rect: { x: first.x + first.w, y: top, w: horizontal, h: bottom - top },
        label: `${Math.round(horizontal)}`,
      };
    }
    const vertical = second.y - (first.y + first.h);
    if (vertical > 0.5 && second.x < first.x + first.w && first.x < second.x + second.w) {
      const left = Math.max(first.x, second.x);
      const right = Math.min(first.x + first.w, second.x + second.w);
      return {
        rect: { x: left, y: first.y + first.h, w: right - left, h: vertical },
        label: `${Math.round(vertical)}`,
      };
    }
    return null;
  }

  private markRevealed(layer: Layer) {
    if (layer.state === "revealed") return;
    layer.state = "revealed";
    this.done += 1;
  }

  // 요소 종류에 맞는 등장 효과와 함께 실제 요소 표시
  private revealLayer(layer: Layer) {
    if (layer.state === "revealed") return;
    layer.el.removeAttribute("data-build-hidden");
    this.markRevealed(layer);
    if (layer.kind === "text") return;
    if (layer.kind === "control") {
      this.play(
        layer.el,
        [{ transform: "scale(0.88)", opacity: 0.4 }, { transform: "scale(1)", opacity: 1 }],
        { duration: 300, easing: SPRING_EASING },
      );
      return;
    }
    if (layer.kind === "media") {
      this.play(
        layer.el,
        [{ clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)" }],
        { duration: 240, easing: "ease-out" },
      );
      return;
    }
    if (layer.fill) {
      this.play(
        layer.el,
        [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }],
        { duration: 300, easing: "ease-out" },
      );
      return;
    }
    this.play(layer.el, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "linear" });
  }

  private revealInstantly(layer: Layer) {
    const group = this.groups.find((candidate) =>
      candidate.state !== "applied" && candidate.items.some((item) => item.layer === layer),
    );
    if (group) this.applyGroupInstantly(group);
    layer.el.removeAttribute("data-build-hidden");
    this.markRevealed(layer);
  }

  private applyGroupInstantly(group: LayoutGroup) {
    for (const item of group.items) {
      item.ghost = false;
      item.layer.el.removeAttribute("data-build-hidden");
      this.markRevealed(item.layer);
    }
    group.state = "applied";
  }

  // 일시정지와 배속을 함께 제어하도록 애니메이션 등록
  private play(el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    const animation = el.animate(keyframes, options);
    animation.playbackRate = this.speed;
    if (this.paused) animation.pause();
    this.animations.add(animation);
    const forget = () => this.animations.delete(animation);
    animation.onfinish = forget;
    animation.oncancel = forget;
  }

  // 화면 가장자리 바깥의 무작위 시작 위치 계산
  private entryPoint(): Point {
    const side = Math.floor(Math.random() * 4);
    const left = window.scrollX;
    const top = window.scrollY;
    if (side === 0) return { x: left - 30, y: top + Math.random() * this.height };
    if (side === 1) return { x: left + this.width + 30, y: top + Math.random() * this.height };
    if (side === 2) return { x: left + Math.random() * this.width, y: top - 30 };
    return { x: left + Math.random() * this.width, y: top + this.height + 30 };
  }
}
