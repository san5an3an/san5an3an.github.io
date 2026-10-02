import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages 배포용 정적 HTML을 out/ 에 생성
  output: "export",
  // /about → /about/index.html 형태로 경로 생성
  trailingSlash: true,
  // 정적 호스팅에서 쓸 수 없는 기본 이미지 최적화 비활성화
  images: { unoptimized: true },
};

export default nextConfig;
