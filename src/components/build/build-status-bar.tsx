import { ChevronDown, Pause, Play, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { BuildStatus } from "@/lib/build/types";

type BuildStatusBarProps = {
  status: BuildStatus;
  onTogglePause: () => void;
  onToggleSpeed: () => void;
  onSkip: () => void;
  onReplay: () => void;
};

// 조립 진행 상황과 재생 제어 버튼 표시
export function BuildStatusBar({
  status,
  onTogglePause,
  onToggleSpeed,
  onSkip,
  onReplay,
}: BuildStatusBarProps) {
  if (status.finished) {
    return (
      <div className="fixed right-4 bottom-4 z-50">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full bg-popover shadow-md"
          onClick={onReplay}
        >
          <RotateCcw data-icon="inline-start" />
          다시 보기
        </Button>
      </div>
    );
  }

  const percent = status.total ? Math.round((status.done / status.total) * 100) : 0;

  return (
    <div
      data-testid="build-status"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-popover py-1 pr-1 pl-3 text-xs whitespace-nowrap text-popover-foreground shadow-lg sm:gap-3"
    >
      <div aria-hidden className="flex -space-x-1">
        {status.colors.map((color, index) => (
          <span
            key={`${color}-${index}`}
            className="size-3 rounded-full ring-2 ring-popover"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <span className="font-semibold tabular-nums" data-testid="build-agents">
        {status.agents} agents
      </span>
      <span className="text-muted-foreground tabular-nums" data-testid="build-layers">
        <span className="font-semibold text-foreground">{status.done}</span> / {status.total} layers
      </span>
      <Progress value={percent} aria-label="조립 진행률" className="hidden w-16 sm:flex" />
      {status.waiting && (
        <span className="hidden items-center gap-0.5 text-muted-foreground sm:inline-flex">
          스크롤
          <ChevronDown className="size-3.5 animate-bounce" aria-hidden />
        </span>
      )}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          aria-label={status.paused ? "애니메이션 재생" : "애니메이션 일시정지"}
          onClick={onTogglePause}
        >
          {status.paused ? <Play /> : <Pause />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full tabular-nums"
          aria-label={`재생 속도 ${status.speed}배, 눌러서 변경`}
          onClick={onToggleSpeed}
        >
          {status.speed}×
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          aria-label="애니메이션 건너뛰기"
          onClick={onSkip}
        >
          <X />
        </Button>
      </div>
    </div>
  );
}
