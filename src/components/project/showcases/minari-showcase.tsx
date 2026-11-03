// 시스템별 토큰 파일에서 가져온 브랜드 색 지정
const designSystems = [
  { name: "cobalt", brand: "#0052cc" },
  { name: "graphite", brand: "#181717" },
  { name: "ember", brand: "#e57616" },
  { name: "jade", brand: "#47a248" },
  { name: "plum", brand: "#9146ff" },
  { name: "slate", brand: "#14233c" },
  { name: "emerald", brand: "#40c68b" },
  { name: "indigo", brand: "#635bff" },
  { name: "sand", brand: "#c5ab77" },
  { name: "teal", brand: "#1c9ad6" },
  { name: "crimson", brand: "#7f1d1d" },
  { name: "moss", brand: "#73bbad" },
  { name: "azure", brand: "#0080ff" },
  { name: "violet", brand: "#5e6ad2" },
  { name: "rust", brand: "#9e6954" },
  { name: "mint", brand: "#71bbb1" },
  { name: "navy", brand: "#0055ff" },
  { name: "saffron", brand: "#ff9900" },
  { name: "fog", brand: "#1d2d35" },
  { name: "berry", brand: "#ea4c89" },
];

// 디자인 시스템 20종을 브랜드 색 타일로 표시
export function MinariShowcase() {
  return (
    <div
      data-autolayout
      className="grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3 lg:grid-cols-10"
    >
      {designSystems.map((system, index) => (
        <div key={system.name} className="flex min-w-0 flex-col gap-1.5 rounded-lg border bg-card p-1.5 sm:p-2">
          <div
            data-testid="system-chip"
            className="aspect-square rounded-lg"
            style={{ backgroundColor: system.brand }}
          />
          <span className="truncate text-[0.6875rem] font-medium text-muted-foreground">
            {String(index + 1).padStart(2, "0")} {system.name}
          </span>
        </div>
      ))}
    </div>
  );
}
