import type { Metadata } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { BUILD_PREPAINT_SCRIPT } from "@/lib/build/prepaint";
import { profile } from "@/lib/profile";

export const metadata: Metadata = {
  title: `${profile.name} | ${profile.role}`,
  description: profile.bio,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BUILD_PREPAINT_SCRIPT }} />
      </head>
      <body className="canvas-surface flex min-h-full flex-col">{children}</body>
    </html>
  );
}
