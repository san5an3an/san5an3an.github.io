import { Bar, DesignFrame, ListRow, TabBar } from "@/components/mock/design-frame";

const GREEN = "bg-[var(--semantic-bg-success-default)]";
const GREEN_SOFT = "bg-[var(--semantic-bg-success-subtle)]";

// GREEON 의 홈, 지도, 충전 화면 구조 표시
export function GreeonShowcase() {
  return (
    <div
      aria-hidden
      data-autolayout
      className="mx-auto grid w-full max-w-3xl grid-cols-3 gap-2.5 pt-5 sm:gap-4"
    >
      <DesignFrame name="GREEON / 홈">
        <Bar className="w-2/5" />
        <div className="grid grid-cols-3 gap-1.5">
          <div className={`aspect-square rounded-lg ${GREEN_SOFT}`} />
          <div className={`aspect-square rounded-lg ${GREEN_SOFT}`} />
          <div className={`aspect-square rounded-lg ${GREEN_SOFT}`} />
        </div>
        <ListRow tone={GREEN} />
        <div className="flex h-12 items-end gap-1 rounded-lg border p-1.5 sm:h-16 sm:p-2">
          <div className={`h-1/3 flex-1 rounded-sm ${GREEN_SOFT}`} />
          <div className={`h-2/3 flex-1 rounded-sm ${GREEN}`} />
          <div className={`h-1/2 flex-1 rounded-sm ${GREEN_SOFT}`} />
          <div className={`h-full flex-1 rounded-sm ${GREEN}`} />
          <div className={`h-2/5 flex-1 rounded-sm ${GREEN_SOFT}`} />
        </div>
        <ListRow tone="bg-muted-foreground/25" />
        <TabBar active={0} activeTone={GREEN} />
      </DesignFrame>

      <DesignFrame name="GREEON / 지도">
        <div className={`relative flex-1 overflow-hidden rounded-lg ${GREEN_SOFT}`}>
          <div className={`absolute top-[16%] left-[22%] size-4 rounded-full sm:size-5 ${GREEN}`} />
          <div className={`absolute top-[38%] left-[60%] size-4 rounded-full sm:size-5 ${GREEN}`} />
          <div className={`absolute top-[62%] left-[28%] size-4 rounded-full sm:size-5 ${GREEN}`} />
          <div className="absolute right-[8%] bottom-[8%] size-5 rounded-full border bg-card sm:size-7" />
        </div>
        <TabBar active={1} activeTone={GREEN} />
      </DesignFrame>

      <DesignFrame name="GREEON / 충전">
        <div
          className="relative mx-auto mt-2 aspect-square w-3/4 rounded-full"
          style={{
            background:
              "conic-gradient(var(--semantic-bg-success-default) 0 68%, var(--semantic-bg-success-subtle) 68% 100%)",
          }}
        >
          <div className="absolute inset-[16%] rounded-full bg-card" />
        </div>
        <ListRow tone={GREEN_SOFT} />
        <ListRow tone={GREEN_SOFT} />
        <div className={`mt-auto h-5 rounded-md sm:h-7 ${GREEN}`} />
      </DesignFrame>
    </div>
  );
}
