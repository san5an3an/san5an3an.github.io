import type { ReactNode } from "react";

// 프레임 이름과 화면 틀 표시. 자동 레이아웃 때 틀 전체가 함께 움직이도록 틀을 최상위 요소로 지정
export function DesignFrame({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="relative aspect-[9/19] min-w-0 rounded-xl border bg-card shadow-sm">
      <span className="absolute bottom-full left-0 mb-1.5 max-w-full truncate text-xs font-medium text-muted-foreground">
        {name}
      </span>
      <div className="flex h-full flex-col gap-2 overflow-hidden rounded-xl p-2.5 sm:gap-2.5 sm:p-3">
        {children}
      </div>
    </div>
  );
}

// 글자 영역을 나타내는 막대 표시
export function Bar({ className = "" }: { className?: string }) {
  return <div className={`h-1.5 rounded-full bg-muted-foreground/25 sm:h-2 ${className}`} />;
}

// 목록의 한 행을 나타내는 원형 아이콘과 막대 표시
export function ListRow({
  tone = "bg-accent",
  className = "flex",
}: {
  tone?: string;
  className?: string;
}) {
  return (
    <div className={`items-center gap-2 rounded-lg border p-1.5 sm:p-2 ${className}`}>
      <div className={`size-5 shrink-0 rounded-full sm:size-6 ${tone}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Bar className="w-4/5" />
        <Bar className="w-1/2" />
      </div>
    </div>
  );
}

// 화면 아래쪽 탭 메뉴와 선택된 탭 표시
export function TabBar({
  count = 4,
  active,
  activeTone = "bg-primary",
}: {
  count?: number;
  active: number;
  activeTone?: string;
}) {
  return (
    <div className="mt-auto flex items-center justify-around pt-1">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={`size-3 rounded-full sm:size-4 ${index === active ? activeTone : "bg-muted-foreground/25"}`}
        />
      ))}
    </div>
  );
}
