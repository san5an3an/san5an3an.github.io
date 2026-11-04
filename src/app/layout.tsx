import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { BUILD_PREPAINT_SCRIPT } from "@/lib/build/prepaint";
import { profile } from "@/lib/profile";

// SUITE 가변 글꼴 지정. 굵기 300 부터 900 까지 파일 하나로 처리함
const suite = localFont({
  src: "../design-system/fonts/SUITE-Variable.woff2",
  variable: "--font-suite",
  weight: "300 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${profile.name} | ${profile.role}`,
  description: profile.bio,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${suite.variable} h-full antialiased`}
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
