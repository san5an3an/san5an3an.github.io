import { Bar, DesignFrame, ListRow, TabBar } from "@/components/mock/design-frame";

const ACTIVE_TAB = "bg-[#80AF7B]";

// 앱 아이콘에서 가져온 실제 색으로 WE-ON 의 네 가지 탭 화면 구조 표시
export function WeOnShowcase() {
  return (
    <div
      aria-hidden
      data-autolayout
      className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-x-3 gap-y-8 pt-5 md:grid-cols-4 md:gap-4"
    >
      <DesignFrame name="WE-ON / 홈">
        <Bar className="w-3/5" />
        <div className="flex flex-col gap-1.5 rounded-lg bg-[#80AF7B] p-2.5 sm:gap-2 sm:p-3">
          <div className="h-1.5 w-1/2 rounded-full bg-white/70 sm:h-2" />
          <div className="h-3 w-4/5 rounded-full bg-white sm:h-4" />
        </div>
        <div className="flex flex-col gap-1.5 rounded-lg border p-2">
          <Bar className="w-2/5" />
          <div className="h-1.5 rounded-full bg-[#A3CB96]" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="aspect-[3/2] rounded-lg bg-[#FCCF88]" />
          <div className="aspect-[3/2] rounded-lg bg-[#FFB177]" />
        </div>
        <ListRow tone="bg-[#A3CB96]" />
        <ListRow tone="bg-[#FCCF88]" />
        <TabBar active={0} activeTone={ACTIVE_TAB} />
      </DesignFrame>

      <DesignFrame name="WE-ON / 검색">
        <div className="flex items-center gap-1.5 rounded-full border p-1.5 sm:p-2">
          <div className="size-3 shrink-0 rounded-full bg-[#80AF7B] sm:size-4" />
          <Bar className="w-3/5" />
        </div>
        <div className="flex gap-1">
          <div className="h-3 w-1/3 rounded-full bg-[#FCCF88] sm:h-4" />
          <div className="h-3 w-1/3 rounded-full bg-[#FFB177] sm:h-4" />
        </div>
        <ListRow tone="bg-[#FCCF88]" />
        <ListRow tone="bg-[#FFB177]" />
        <ListRow tone="bg-[#FCCF88]" />
        <ListRow tone="bg-[#A3CB96]" />
        <TabBar active={1} activeTone={ACTIVE_TAB} />
      </DesignFrame>

      <DesignFrame name="WE-ON / 가계부">
        <div className="flex items-center justify-between">
          <div className="size-3 rounded-full bg-muted-foreground/25" />
          <Bar className="w-2/5" />
          <div className="size-3 rounded-full bg-muted-foreground/25" />
        </div>
        <div
          className="relative mx-auto aspect-square w-3/4 rounded-full"
          style={{ background: "conic-gradient(#80AF7B 0 62%, #FCCF88 62% 84%, #FFB177 84% 100%)" }}
        >
          <div className="absolute inset-[22%] rounded-full bg-card" />
        </div>
        <div className="flex justify-between">
          <Bar className="w-1/3" />
          <Bar className="w-1/4" />
        </div>
        <ListRow tone="bg-[#FCCF88]" />
        <ListRow tone="bg-[#FFB177]" />
        <TabBar active={2} activeTone={ACTIVE_TAB} />
      </DesignFrame>

      <DesignFrame name="WE-ON / 내 정보">
        <div className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#A3CB96] to-[#80AF7B] p-2.5 sm:p-3">
          <div className="size-6 shrink-0 rounded-full bg-white sm:size-8" />
          <div className="h-2 w-1/2 rounded-full bg-white/80" />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="aspect-square rounded-lg bg-muted" />
          <div className="aspect-square rounded-lg bg-muted" />
          <div className="aspect-square rounded-lg bg-muted" />
        </div>
        <ListRow tone="bg-muted-foreground/25" />
        <ListRow tone="bg-muted-foreground/25" />
        <ListRow tone="bg-muted-foreground/25" />
        <TabBar active={3} activeTone={ACTIVE_TAB} />
      </DesignFrame>
    </div>
  );
}
