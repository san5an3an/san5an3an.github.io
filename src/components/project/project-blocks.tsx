import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProjectBlock } from "@/lib/projects";

// 백틱으로 감싼 부분을 코드 글꼴로 변환
function InlineText({ text }: { text: string }) {
  return text.split(/(`[^`]+`)/g).map((piece, index) =>
    piece.startsWith("`") ? (
      <code key={index} className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.85em]">
        {piece.slice(1, -1)}
      </code>
    ) : (
      piece
    ),
  );
}

function TextBlock({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="flex flex-col gap-3 leading-7 text-muted-foreground">
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>
          <InlineText text={paragraph} />
        </p>
      ))}
    </div>
  );
}

function BulletsBlock({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2.5 leading-7 text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
          <span className="min-w-0">
            <InlineText text={item} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function CardsBlock({ items }: { items: { title: string; detail: string }[] }) {
  return (
    <div data-autolayout className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.title} className="flex flex-col gap-1.5 rounded-xl border bg-card p-4">
          <h3 className="font-semibold">{item.title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}

const SUBGRID_ROW = "col-span-full grid grid-cols-subgrid";

// 표 렌더링. HTML 표는 행 높이를 내용에 맞추므로 grid 로 배치해 본문 행을 가장 높은 행에 맞춤. display 변경으로 표 의미가 사라지지 않도록 role 을 지정함
function TableBlock({ caption, columns, rows }: { caption?: string; columns: string[]; rows: string[][] }) {
  return (
    <div className="flex flex-col gap-2">
      {caption && <h3 className="font-semibold">{caption}</h3>}
      <div className="rounded-xl border bg-card">
        <Table
          role="table"
          className="grid min-w-[40rem] grid-cols-[minmax(7rem,1fr)_minmax(10rem,2fr)_minmax(14rem,3fr)]"
        >
          <TableHeader role="rowgroup" className={SUBGRID_ROW}>
            <TableRow role="row" className={SUBGRID_ROW}>
              {columns.map((column) => (
                <TableHead key={column} role="columnheader" className="content-center px-3">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody role="rowgroup" className={`${SUBGRID_ROW} auto-rows-fr`}>
            {rows.map((row) => (
              <TableRow key={row[0]} role="row" className={SUBGRID_ROW}>
                {row.map((cell, index) => (
                  <TableCell
                    key={cell}
                    role="cell"
                    className={`content-center px-3 leading-6 whitespace-normal ${index === 0 ? "font-medium" : "text-muted-foreground"}`}
                  >
                    <InlineText text={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// 내용 종류에 맞는 블록 컴포넌트 선택
export function ProjectBlockView({ block }: { block: ProjectBlock }) {
  switch (block.kind) {
    case "text":
      return <TextBlock paragraphs={block.paragraphs} />;
    case "bullets":
      return <BulletsBlock items={block.items} />;
    case "cards":
      return <CardsBlock items={block.items} />;
    case "table":
      return <TableBlock caption={block.caption} columns={block.columns} rows={block.rows} />;
  }
}
