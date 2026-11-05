"use client";

import { useLayoutEffect, useRef } from "react";

// 화면을 그리기 전에 제목 하나를 무작위로 골라 표시
export function NotFoundTitle({ titles }: { titles: string[] }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    if (headingRef.current) headingRef.current.textContent = titles[Math.floor(Math.random() * titles.length)];
  }, [titles]);

  return (
    <h1 ref={headingRef} className="text-[2.25rem] leading-[1.1] font-extrabold tracking-tight sm:text-5xl">
      {titles[0]}
    </h1>
  );
}
