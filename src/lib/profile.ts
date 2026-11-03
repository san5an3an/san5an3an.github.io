// 포트폴리오 화면에 표시할 소개 문구와 기술 영역 지정
export const profile = {
  name: "San Kang",
  role: "UI/UX Designer & Developer",
  headline: ["Designing interfaces.", "Building systems.", "Shipping products."],
  bio: "UI/UX 디자인부터 실제 제품 구현까지, 디자인과 개발의 경계를 넘나들며 사용자 경험을 만드는 Developer입니다.",
  interest:
    "현재는 Design System과 재사용 가능한 UI Architecture, 그리고 AI Agent를 실제 개발 Workflow에 통합하는 Developer Tooling에 관심을 두고 있습니다.",
  githubUrl: "https://github.com/san5an3an",
  figmaUrl:
    "https://www.figma.com/design/YBcLGvMB0dIIQ6RCiDSIJ2/-PortFolio--SAN-KANG?node-id=0-1",
};

export const skills = [
  { title: "iOS / SwiftUI", detail: "iOS / SwiftUI 기반 UI 개발", icon: "smartphone" },
  { title: "Flutter", detail: "Flutter 기반 Cross-platform App 개발", icon: "layers" },
  { title: "UI/UX Design", detail: "UI/UX Design & Prototyping", icon: "pen-tool" },
  { title: "Design System", detail: "Design System & Reusable Component 설계", icon: "component" },
  { title: "React / TypeScript", detail: "React / TypeScript 기반 Web UI 개발", icon: "code" },
  { title: "AI Workflow", detail: "AI-assisted Development Workflow 설계 및 활용", icon: "sparkles" },
] as const;
