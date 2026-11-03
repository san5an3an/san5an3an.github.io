import { Bar, DesignFrame, ListRow, TabBar } from "@/components/mock/design-frame";

// 식비 관리 앱의 화면 구조 표시
function BudgetScreen() {
  return (
    <DesignFrame name="WE-ON / Home">
      <div className="flex items-center justify-between">
        <Bar className="w-2/5" />
        <div className="size-4 rounded-full bg-accent sm:size-5" />
      </div>
      <div className="flex flex-col gap-1.5 rounded-lg bg-primary p-2.5 sm:gap-2 sm:p-3">
        <div className="h-1.5 w-1/2 rounded-full bg-primary-foreground/60 sm:h-2" />
        <div className="h-3 w-4/5 rounded-full bg-primary-foreground sm:h-4" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="aspect-[4/3] rounded-lg bg-accent" />
        <div className="aspect-[4/3] rounded-lg bg-muted" />
      </div>
      <ListRow />
      <ListRow tone="bg-muted-foreground/25" />
      <ListRow className="hidden xl:flex" />
      <TabBar count={3} active={0} />
    </DesignFrame>
  );
}

// 충전소 지도 앱의 화면 구조 표시
function ChargerScreen() {
  return (
    <DesignFrame name="GREEON / Map">
      <div className="relative flex-1 overflow-hidden rounded-lg bg-[var(--semantic-bg-success-subtle)]">
        <div className="absolute top-[18%] left-[20%] size-4 rounded-full bg-[var(--semantic-bg-success-default)] sm:size-5" />
        <div className="absolute top-[42%] left-[62%] size-5 rounded-full bg-[var(--semantic-bg-success-default)] sm:size-6" />
        <div className="absolute top-[68%] left-[30%] size-3 rounded-full bg-[var(--semantic-bg-success-default)] sm:size-4" />
        <div className="absolute top-[12%] left-[70%] size-3 rounded-full bg-[var(--semantic-bg-warning-default)] sm:size-4" />
      </div>
      <div className="flex flex-col gap-2 rounded-lg border p-2 sm:p-2.5">
        <Bar className="w-3/5" />
        <Bar className="w-4/5" />
        <div className="flex gap-1.5 pt-0.5">
          <div className="h-3 w-1/3 rounded-full bg-[var(--semantic-bg-success-subtle)] sm:h-4" />
          <div className="h-3 w-1/4 rounded-full bg-muted sm:h-4" />
        </div>
        <div className="h-5 rounded-md bg-[var(--semantic-bg-success-default)] sm:h-7" />
      </div>
    </DesignFrame>
  );
}

// 디자인 시스템의 컴포넌트 모음 구조 표시
function ComponentScreen() {
  return (
    <DesignFrame name="Cobalt / Components">
      <div className="flex gap-1.5">
        <div className="h-5 flex-1 rounded-md bg-primary sm:h-7" />
        <div className="h-5 flex-1 rounded-md border sm:h-7" />
      </div>
      <div className="h-5 rounded-md border bg-background sm:h-7" />
      <div className="flex items-center justify-between">
        <Bar className="w-1/2" />
        <div className="flex h-3 w-6 items-center justify-end rounded-full bg-primary p-0.5 sm:h-4 sm:w-8">
          <div className="size-2 rounded-full bg-primary-foreground sm:size-3" />
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        <div className="h-3 w-1/4 rounded-full bg-accent sm:h-4" />
        <div className="h-3 w-1/3 rounded-full bg-[var(--semantic-bg-success-subtle)] sm:h-4" />
        <div className="h-3 w-1/5 rounded-full bg-[var(--semantic-bg-warning-subtle)] sm:h-4" />
        <div className="h-3 w-1/4 rounded-full bg-[var(--semantic-bg-danger-subtle)] sm:h-4" />
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <div className="aspect-square rounded-sm bg-primary" />
        <div className="aspect-square rounded-sm border" />
        <div className="aspect-square rounded-full border" />
        <div className="aspect-square rounded-full bg-primary" />
      </div>
      <div className="flex items-center gap-1">
        <div className="h-1 flex-1 rounded-full bg-primary" />
        <div className="size-3 rounded-full border bg-background sm:size-4" />
        <div className="h-1 flex-1 rounded-full bg-muted" />
      </div>
      <div className="mt-auto flex flex-col gap-1.5 rounded-lg bg-muted p-2">
        <Bar className="w-4/5" />
        <Bar className="w-3/5" />
      </div>
    </DesignFrame>
  );
}

// 커서들이 자동 레이아웃으로 정렬할 작업물 프레임 그룹 표시
export function HeroFrames() {
  return (
    <div
      aria-hidden
      data-autolayout
      className="grid min-w-0 grid-cols-3 gap-2.5 pt-5 sm:gap-4"
    >
      <BudgetScreen />
      <ChargerScreen />
      <ComponentScreen />
    </div>
  );
}
