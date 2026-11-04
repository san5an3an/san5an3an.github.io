import { collectLayers, measureTextLines, readRect } from "./collect-layers";
import { paintScene } from "./painter";
import type {
  Agent,
  BuildScene,
  BuildStatus,
  BuildTokens,
  Flash,
  GroupItem,
  Layer,
  LayoutGroup,
  Point,
  Rect,
  Step,
} from "./types";

const AGENT_NAMES = ["UI/UX", "iOS", "Flutter", "React", "Agent"];
const DESKTOP_AGENT_COUNT = 28;
const MOBILE_AGENT_COUNT = 14;
const AMBIENT_AGENT_COUNT = 3;
const FIRST_AGENT_COUNT = 6;
const AGENTS_PER_SECOND = 5;
const IDLE_DELAY = 1100;
const LEAVE_DURATION = 900;
const STATUS_INTERVAL = 100;
const SWEEP_INTERVAL = 200;
const MAX_FRAME_TIME = 50;
const PASSED_MARGIN = 20;
const VIEW_BOTTOM_RATIO = 0.96;
const FRAMED_TEXT_MIN_DRAG = 280;
const FRAMED_TEXT_PLACEHOLDER_HOLD = 110;
const FRAMED_TEXT_CARET_MOVE = 140;
const SPRING_EASING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

type EngineOptions = {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  onStatus: (status: BuildStatus) => void;
  getDockPoint: () => Point;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeInOut(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - (-2 * value + 2) ** 3 / 2;
}

function easeOut(value: number) {
  return 1 - (1 - value) ** 3;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// Cobalt 토큰 값을 Canvas 에서 쓸 색상과 글꼴로 변환
function readTokens(): { tokens: BuildTokens; palette: { color: string; onColor: string }[] } {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) => style.getPropertyValue(name).trim();
  return {
    tokens: {
      brand: read("--semantic-bg-brand-default"),
      onBrand: read("--semantic-fg-on-brand-default"),
      danger: read("--semantic-bg-danger-default"),
      onDanger: read("--semantic-fg-on-danger-default"),
      placeholder: read("--semantic-bg-neutral-default"),
      surface: read("--semantic-bg-neutral-surface"),
      fontFamily: getComputedStyle(document.body).fontFamily,
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
  private animations = new Set<Animation>();
  private savedInlineStyles = new Map<HTMLElement | SVGElement, { clipPath: string; borderRadius: string }>();
  private tokens: BuildTokens = {
    brand: "",
    onBrand: "",
    danger: "",
    onDanger: "",
    placeholder: "",
    surface: "",
    fontFamily: "",
  };
  private frameHandle = 0;
  private lastFrame = 0;
  private elapsed = 0;
  private lastStatus = 0;
  private lastSweep = 0;
  private idleTime = 0;
  private leaveTime = 0;
  private leaving = false;
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
  }

  // 요소를 숨기고 커서를 준비한 뒤 재생 시작
  start() {
    this.started = true;
    this.prepare();
    window.addEventListener("resize", this.handleResize);
    this.options.root.addEventListener("focusin", this.handleFocus);
    document.fonts?.addEventListener("loadingdone", this.handleFontsLoaded);
    this.runLoop();
  }

  // 재생 없이 완성된 화면 상태를 알려 다시 보기 버튼만 표시
  showFinished() {
    this.finished = true;
    this.emitStatus();
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
    this.finished = true;
    this.leaving = false;
    this.done = this.layers.length;
    this.stopLoop();
    this.emitStatus();
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

  private prepare() {
    const collected = collectLayers(this.options.root);
    this.layers = collected.layers;
    this.groups = collected.groups;
    this.layerByElement = new Map(this.layers.map((layer) => [layer.el, layer]));
    for (const layer of this.layers) layer.el.setAttribute("data-build-hidden", "");
    delete document.documentElement.dataset.build;

    this.resizeCanvas();
    this.layoutWidth = window.innerWidth;
    const { tokens, palette } = readTokens();
    this.tokens = tokens;

    const count = window.innerWidth < 768 ? MOBILE_AGENT_COUNT : DESKTOP_AGENT_COUNT;
    this.agents = Array.from({ length: count }, (_, index): Agent => {
      const shade = palette[index % palette.length];
      const name = AGENT_NAMES[index] ?? null;
      return {
        ...shade,
        name,
        size: name ? 20 : randomBetween(13, 17),
        arc: Math.random() < 0.5 ? -1 : 1,
        ...this.entryPoint(),
        alpha: 0,
        active: false,
        busy: false,
        tool: "arrow",
        draft: null,
        caret: null,
        steps: [],
        stepElapsed: 0,
      };
    });

    this.flashes = [];
    this.elapsed = 0;
    this.idleTime = 0;
    this.leaveTime = 0;
    this.lastStatus = 0;
    this.lastSweep = 0;
    this.done = 0;
    this.leaving = false;
    this.finished = false;
    this.paused = false;
    this.options.canvas.style.display = "block";
    this.emitStatus();
  }

  // 숨김 표시와 진행 중인 효과를 모두 제거
  private resetElements() {
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
      agent.steps = [];
      agent.draft = null;
      agent.caret = null;
    }
    this.flashes = [];
    delete document.documentElement.dataset.build;
    this.clearCanvas();
  }

  // 효과용 스타일을 적용하기 전에 요소에 직접 지정된 값 저장
  private overrideInlineStyle(el: HTMLElement | SVGElement, styles: { clipPath?: string; borderRadius?: string }) {
    if (!this.savedInlineStyles.has(el)) {
      this.savedInlineStyles.set(el, { clipPath: el.style.clipPath, borderRadius: el.style.borderRadius });
    }
    Object.assign(el.style, styles);
  }

  // 효과가 끝난 요소를 저장해 둔 원래 스타일로 복원
  private restoreInlineStyle(el: HTMLElement | SVGElement) {
    const saved = this.savedInlineStyles.get(el);
    if (!saved) return;
    el.style.clipPath = saved.clipPath;
    el.style.borderRadius = saved.borderRadius;
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
    if (this.finished) return;
    this.resizeCanvas();
    // 폭이 바뀌면 측정한 위치가 모두 틀어지므로 완성된 화면으로 전환함
    if (window.innerWidth !== this.layoutWidth) this.finishNow();
  };

  private handleFontsLoaded = () => {
    this.needsRemeasure = !this.finished;
  };

  // 글꼴 적용 후 위치 재측정. 움직이는 요소를 재면 위치가 틀어지므로 자동 레이아웃 중에는 미룸
  private remeasureIfReady() {
    if (!this.needsRemeasure || this.groups.some((group) => group.state === "applying")) return;
    this.needsRemeasure = false;
    for (const layer of this.layers) layer.rect = readRect(layer.el);
    for (const group of this.groups) group.rect = readRect(group.el);
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
    if (!this.paused) this.update(delta * this.speed);
    if (this.finished) return;
    this.paint();
    if (now - this.lastStatus > STATUS_INTERVAL) {
      this.lastStatus = now;
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
      waiting: !this.leaving && this.idleTime > IDLE_DELAY,
      colors: this.agents.slice(0, 5).map((agent) => agent.color),
    });
  }

  private update(delta: number) {
    this.elapsed += delta;
    this.remeasureIfReady();
    this.sweepPassedLayers();
    this.updateAgentPool(delta);
    for (const agent of this.agents) {
      if (agent.active) this.advanceAgent(agent, delta);
    }
    for (const flash of this.flashes) flash.age += delta;
    this.flashes = this.flashes.filter((flash) => flash.age < flash.ttl);

    if (!this.leaving && this.done >= this.layers.length) this.beginLeaving();
    if (this.leaving) {
      this.leaveTime += delta;
      if (this.leaveTime > LEAVE_DURATION) this.finishNow();
    }
  }

  // 할 일의 양에 맞춰 화면에 나타나는 커서 수 조절
  private updateAgentPool(delta: number) {
    if (this.leaving) return;
    const hasWork = this.hasAvailableWork();
    this.idleTime = hasWork ? 0 : this.idleTime + delta;

    const ramp = Math.floor(FIRST_AGENT_COUNT + (this.elapsed / 1000) * AGENTS_PER_SECOND);
    const desired = this.idleTime > IDLE_DELAY ? AMBIENT_AGENT_COUNT : Math.min(this.agents.length, ramp);

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
    agent.busy = true;
    if (this.leaving) {
      agent.steps = [{ duration: 1000 }];
      return;
    }
    agent.steps = this.claimGroupWork(agent) ?? this.claimLayerWork(agent) ?? this.idleSteps(agent);
  }

  private claimGroupWork(agent: Agent) {
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
      if (this.isLayerAvailable(layer)) candidates.push(layer);
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

  // 글자를 한 줄씩 왼쪽부터 드러내는 입력 동작 생성
  private typeSteps(agent: Agent, layer: Layer): Step[] {
    const el = layer.el as HTMLElement;
    const length = el.textContent?.trim().length ?? 0;
    const isInline = getComputedStyle(el).display === "inline";
    const start = { x: layer.rect.x, y: layer.rect.y };

    if (isInline) {
      return [this.moveTo(agent, start), { duration: 120, finish: () => this.revealLayer(layer) }];
    }

    const lines = measureTextLines(layer.el);
    const widths = lines.map((line) => line.right - line.left);
    const totalWidth = widths.reduce((sum, width) => sum + width, 0) || 1;
    const glyphs = Math.max(length, 1);
    const caretStart = { x: start.x + lines[0].left, y: start.y + lines[0].top };
    let started = false;

    return [
      ...(layer.isFramedText
        ? this.frameBeforeTypingSteps(agent, layer, caretStart)
        : [this.moveTo(agent, caretStart)]),
      {
        duration: clamp(length * 24, 240, 1000),
        tick: (progress) => {
          if (!started) {
            started = true;
            agent.tool = "text";
            el.setAttribute("data-build-phase", "typing");
            this.overrideInlineStyle(el, { clipPath: "inset(0 100% 0 0)" });
            this.revealLayer(layer);
          }
          let remaining = (Math.floor(progress * glyphs) / glyphs) * totalWidth;
          let index = 0;
          while (index < lines.length - 1 && remaining > widths[index]) {
            remaining -= widths[index];
            index += 1;
          }
          const line = lines[index];
          const edge = line.left + Math.min(remaining, widths[index]);
          const box = el.getBoundingClientRect();
          el.style.clipPath = `polygon(-4px -4px, ${box.width + 4}px -4px, ${box.width + 4}px ${line.top}px, ${edge}px ${line.top}px, ${edge}px ${line.bottom + 2}px, -4px ${line.bottom + 2}px)`;
          const caretX = layer.rect.x + edge;
          const caretY = layer.rect.y + line.top;
          agent.caret = { x: caretX, y: caretY, height: line.bottom - line.top };
          agent.x = caretX + 2;
          agent.y = caretY + (line.bottom - line.top) * 0.75;
        },
        finish: () => {
          this.restoreInlineStyle(el);
          el.removeAttribute("data-build-phase");
          agent.draft = null;
          agent.caret = null;
          agent.tool = "arrow";
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

  // 모든 요소가 완성되면 커서를 상태 막대 쪽으로 모아 제거
  private beginLeaving() {
    this.leaving = true;
    this.leaveTime = 0;
    const dock = this.options.getDockPoint();
    const target = { x: dock.x + window.scrollX, y: dock.y + window.scrollY };
    for (const agent of this.agents) {
      if (!agent.active) continue;
      agent.busy = true;
      agent.draft = null;
      agent.caret = null;
      agent.tool = "arrow";
      agent.stepElapsed = 0;
      const startAlpha = agent.alpha;
      const move = this.travel(agent, target, randomBetween(520, 820));
      const moveTick = move.tick;
      agent.steps = [
        {
          duration: move.duration,
          tick: (progress) => {
            moveTick?.(progress);
            agent.alpha = startAlpha * (1 - easeOut(progress) * 0.9);
          },
        },
        { duration: 1000 },
      ];
    }
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
