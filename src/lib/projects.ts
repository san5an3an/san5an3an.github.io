export type ProjectBlock =
  | { kind: "text"; paragraphs: string[] }
  | { kind: "bullets"; items: string[] }
  | { kind: "cards"; items: { title: string; detail: string }[] }
  | { kind: "table"; caption?: string; columns: string[]; rows: string[][] };

export type ProjectSectionContent = {
  id: string;
  title: string;
  blocks: ProjectBlock[];
};

export type ProjectScreen = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

export type Project = {
  slug: string;
  name: string;
  platform: string;
  summary: string;
  lead: string[];
  stack: string[];
  repoUrl: string;
  facts: { label: string; value: string }[];
  screens?: ProjectScreen[];
  screensNote?: string;
  sections: ProjectSectionContent[];
};

// 프로젝트 카드와 상세 화면에 표시할 내용 지정
export const projects: Project[] = [
  {
    slug: "cbm-monitoring",
    name: "CBM 모니터링 시스템",
    platform: "Web",
    summary:
      "서울교통공사 4호선 전동차 260칸의 장치 이상을 AI 모델로 감지하고, 모델 학습과 추론을 관리하는 모니터링 시스템의 웹 화면이에요.",
    lead: [
      "서울교통공사 4호선 전동차 260칸의 장치 이상을 AI 모델로 감지하고, 모델 학습과 추론을 관리하는 모니터링 시스템의 웹 화면이에요.",
      "화면 11개와 로그인을 만들었고, 데이터는 Mock 이라 실제 API 없이 동작해요. 백엔드가 붙일 연결 함수 84개와 반환 타입을 미리 정해 두었어요.",
    ],
    stack: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS 4", "shadcn/ui", "MUI", "Recharts", "Playwright"],
    repoUrl: "https://github.com/san5an3an/cbm260-aibase-ml-web-react",
    facts: [
      { label: "화면", value: "11개와 로그인" },
      { label: "연결 함수", value: "84개" },
      { label: "E2E 테스트", value: "546개" },
      { label: "데이터", value: "Mock" },
    ],
    screens: [
      {
        src: "/screens/cbm/fleet.webp",
        alt: "총 추론 건수와 위험 장치 랭킹, 모델 커버리지를 보여주는 플릿 개요 화면",
        caption: "플릿 개요",
        width: 2880,
        height: 1800,
      },
      {
        src: "/screens/cbm/anomaly-history.webp",
        alt: "장치별 이상 현황 히트맵과 날짜별 상세를 보여주는 이상 감지 내역 화면",
        caption: "이상 감지 내역",
        width: 2880,
        height: 1800,
      },
      {
        src: "/screens/cbm/threshold-tuning.webp",
        alt: "임계값에 따른 이상 비율 분포와 백분위 조정 막대를 보여주는 임계 튜닝 화면",
        caption: "임계 튜닝",
        width: 2880,
        height: 1800,
      },
      {
        src: "/screens/cbm/model-diagnostics.webp",
        alt: "학습 곡선과 원인 분석 리포트를 보여주는 모델 진단 화면",
        caption: "모델 진단",
        width: 2880,
        height: 1800,
      },
    ],
    screensNote: "화면의 값은 예시이며, 실제와는 다를 수 있습니다.",
    sections: [
      {
        id: "features",
        title: "주요 화면",
        blocks: [
          {
            kind: "cards",
            items: [
              {
                title: "CBM 대시보드",
                detail: "플릿 개요, 이상 타임라인, 알람/이벤트, 조치 관리 화면에서 위험 장치와 알람을 확인하고 조치를 기록해요",
              },
              {
                title: "CBM 정보",
                detail: "재학습 설정, 추론, 이상 감지 내역 화면에서 장치별 모델 학습과 추론을 실행하고 결과를 확인해요",
              },
              {
                title: "CBM 모델",
                detail: "모델 커스텀, 모델 비교, 임계 튜닝, 모델 진단 화면에서 모델 설정과 임계치를 조정하고 모델을 비교해요",
              },
              {
                title: "공통 화면",
                detail: "로그인, 세션 만료 경고, 장치 고장 알림, 다크 모드를 모든 화면에 공통으로 적용했어요",
              },
            ],
          },
        ],
      },
      {
        id: "architecture",
        title: "구조",
        blocks: [
          {
            kind: "text",
            paragraphs: [
              "화면은 `src/services` 의 연결 함수로만 데이터를 받아요. 지금은 이 함수들이 Mock 데이터를 돌려주고, 백엔드를 붙일 때는 함수 몸체만 실제 요청으로 바꾸면 화면 코드는 그대로 둘 수 있어요.",
              "반환 타입과 계산 함수는 `src/domain` 에 모으고, 서버 코드를 화면에 보여줄 이름과 색으로 바꾸는 규칙은 `src/domain/labels` 에 따로 두었어요.",
            ],
          },
        ],
      },
      {
        id: "quality",
        title: "검사",
        blocks: [
          {
            kind: "bullets",
            items: [
              "Playwright E2E 테스트 40개 파일, 546개로 화면마다 동작을 확인해요",
              "ESLint 규칙으로 다른 폴더는 `@/` 경로로만 import 하고, 길이는 px 대신 rem 으로 쓰게 했어요",
              "화면 계층은 `src/domain` 과 `src/config` 에서 타입과 표시 규칙만 가져오고, 데이터는 props 로 받게 막았어요",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "minari-design-storybook",
    name: "minari-design-storybook",
    platform: "Design System",
    summary:
      "서로 독립적으로 설계된 20종의 디자인 시스템과 동일한 컴포넌트 규격을 다양한 UI 라이브러리에 적용하여 한 화면에서 비교할 수 있도록 구성한 프로젝트입니다.",
    lead: [
      "서로 독립적으로 설계된 20종의 디자인 시스템과 동일한 컴포넌트 규격을 다양한 UI 라이브러리에 적용하여, 구현 방식과 디자인 토큰의 적용 범위를 한 화면에서 비교할 수 있도록 구성한 프로젝트입니다.",
    ],
    stack: ["React", "TypeScript", "shadcn/ui", "Next.js", "Playwright"],
    repoUrl: "https://github.com/san5an3an/minari-design-storybook",
    facts: [
      { label: "디자인 시스템", value: "20종" },
      { label: "컴포넌트 계약", value: "74종" },
      { label: "UI 라이브러리", value: "18종 이상" },
    ],
    screens: [
      {
        src: "/screens/minari/usage-shadcn-cobalt.webp",
        alt: "shadcn/ui 와 Cobalt 디자인 시스템을 조합한 Usage 대시보드 화면",
        caption: "shadcn/ui + Cobalt, Usage 대시보드",
        width: 2880,
        height: 1800,
      },
      {
        src: "/screens/minari/usage-mui-plum.webp",
        alt: "MUI 와 Plum 디자인 시스템을 조합한 Usage 화면",
        caption: "MUI + Plum, Usage 화면",
        width: 2880,
        height: 1800,
      },
      {
        src: "/screens/minari/usage-antd-ember.webp",
        alt: "Ant Design 과 Ember 디자인 시스템을 조합한 Usage 화면",
        caption: "Ant Design + Ember, Usage 화면",
        width: 2880,
        height: 1800,
      },
      {
        src: "/screens/minari/catalog-button.webp",
        alt: "Cobalt 디자인 시스템의 Button 컴포넌트 카탈로그 화면",
        caption: "Cobalt, Button 컴포넌트 카탈로그",
        width: 2880,
        height: 1800,
      },
    ],
    sections: [
      {
        id: "overview",
        title: "무엇을 만든 건가",
        blocks: [
          {
            kind: "text",
            paragraphs: [
              "`01-cobalt`부터 `20-berry`까지 총 20종의 디자인 시스템을 설계했습니다.",
              "하나의 디자인 시스템에 테마만 변경하는 방식이 아니라, 각 시스템이 독립적인 컬러 체계, Radius, 간격, 컴포넌트 표현 방식과 시각적 특성을 갖도록 구성했습니다. 시스템 간에 디자인 토큰 값을 공유하지 않으며, 공통으로 적용되는 것은 품질 및 설계 규칙입니다.",
              "또한 동일한 컴포넌트 계약 74종을 shadcn/ui, MUI, Ant Design, Chakra UI, Mantine, Fluent UI, Carbon, Blueprint, Bootstrap, daisyUI, Flowbite, Grommet, HeroUI, Cloudscape, PrimeReact, Primer, Spectrum, Lightning 등 다양한 UI 라이브러리에 적용했습니다.",
              "이를 통해 동일한 디자인 토큰과 컴포넌트 규격이 각 UI 라이브러리에서 어떻게 표현되고, 어느 범위까지 적용되는지 직접 비교할 수 있습니다.",
            ],
          },
        ],
      },
      {
        id: "features",
        title: "주요 화면 및 기능",
        blocks: [
          {
            kind: "cards",
            items: [
              {
                title: "컴포넌트 카탈로그",
                detail:
                  "74종의 공통 컴포넌트를 디자인 시스템 × UI 라이브러리 조합으로 렌더링하여 비교합니다. 컴포넌트 속성 정보는 수동으로 작성하지 않고 설치된 패키지의 타입 정의를 기반으로 추출합니다.",
              },
              {
                title: "라이브러리 예제 비교",
                detail: "각 UI 라이브러리의 컴포넌트 및 예제를 동일한 환경에서 확인하고 비교할 수 있습니다.",
              },
              {
                title: "Usage 대시보드",
                detail:
                  "UI 라이브러리별로 서로 다른 성격의 제품 화면을 구성하여 디자인 토큰과 컴포넌트가 실제 화면에서 어떻게 조합되는지 확인합니다.",
              },
              {
                title: "디자인 시스템 내보내기",
                detail: "선택한 디자인 시스템의 토큰, 테마 및 컴포넌트를 하나의 묶음으로 내보낼 수 있습니다.",
              },
            ],
          },
        ],
      },
      {
        id: "scope",
        title: "이 프로젝트에서 설계·구현한 영역",
        blocks: [
          {
            kind: "bullets",
            items: [
              "서로 독립된 20종 디자인 시스템의 토큰 체계 및 설계 규칙",
              "다양한 UI 라이브러리를 하나의 컴포넌트 계약 74종으로 연결하는 추상화 계층",
              "공통 컴포넌트 계약을 각 UI 라이브러리에 연결하는 어댑터",
              "디자인 토큰을 라이브러리별 테마 체계로 변환하는 테마 번역 구조",
              "디자인 시스템 × UI 라이브러리 조합을 탐색할 수 있는 컴포넌트 카탈로그",
              "설치된 패키지의 타입 정의를 기반으로 컴포넌트 속성 정보를 추출하는 기능",
              "UI 라이브러리 전환, 검색 및 내비게이션을 포함한 미리보기 환경",
              "디자인 토큰, 테마 및 컴포넌트를 묶어 내보내는 기능",
              "HTML에서 컴포넌트 후보를 추출하는 가져오기 기능",
              "디자인 시스템과 UI 라이브러리의 실제 적용을 확인하기 위한 Usage 제품 화면",
            ],
          },
        ],
      },
      {
        id: "nature",
        title: "프로젝트 성격",
        blocks: [
          {
            kind: "text",
            paragraphs: [
              "본 repository는 포트폴리오 및 기술 시연을 목적으로 구성된 프로젝트입니다.",
              "각 UI 라이브러리가 제공하는 컴포넌트 자체를 직접 구현한 것이 아니라, 각 라이브러리의 기존 컴포넌트를 공통 계약에 연결하고 디자인 토큰을 적용하기 위한 추상화 계층, 어댑터 및 테마 변환 구조를 설계·구현했습니다.",
              "본 프로젝트는 명시된 UI 라이브러리 및 제공자와 공식적인 제휴·후원·인증 관계가 없습니다. 라이브러리 및 제품명은 프로젝트에서 사용한 기술과 출처를 명확하게 표시하기 위한 목적으로만 사용합니다.",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "paytap-owner",
    name: "PAYTAP 점주앱",
    platform: "iOS, Android",
    summary:
      "매장 점주가 포스와 키오스크 매출을 시간대, 상품, 카드사별로 확인하고 영수증까지 찾아볼 수 있는 Flutter 앱이에요.",
    lead: [
      "매장 점주가 포스와 키오스크 매출을 시간대, 상품, 카드사별로 확인하고 영수증까지 찾아볼 수 있는 Flutter 앱이에요.",
      "회사에서 만든 앱으로, 기획과 디자인을 맡았고 공용 위젯, 차트, 검색 필터 같은 공통 부분과 홈, 매출 변화, 상품 매출 화면을 만들었어요.",
    ],
    stack: ["Flutter", "Dart", "Riverpod 3", "go_router 17", "fl_chart", "Firebase Cloud Messaging"],
    repoUrl: "https://github.com/san5an3an/paytap_flutter_employee_app",
    facts: [
      { label: "화면", value: "29개" },
      { label: "화면 경로", value: "35개" },
      { label: "공용 위젯", value: "25개" },
      { label: "Dart 코드", value: "약 2만 5천 줄" },
    ],
    screens: [
      {
        src: "/screens/paytap/home.webp",
        alt: "오늘, 이번 주, 이번 달 총 매출과 결제 수단별 오늘 매출을 보여주는 PAYTAP 점주앱 홈 화면",
        caption: "홈",
        width: 1206,
        height: 2622,
      },
      {
        src: "/screens/paytap/time-sales.webp",
        alt: "선택한 날의 시간대별 매출을 기간 평균과 나란히 비교하는 막대 차트 화면",
        caption: "시간대별 매출 변화",
        width: 1206,
        height: 2622,
      },
      {
        src: "/screens/paytap/goods-sales.webp",
        alt: "총 매출 금액과 가장 많이 팔린 상품 다섯 개를 도넛 차트로 보여주는 상품 매출 화면",
        caption: "상품 매출",
        width: 1206,
        height: 2622,
      },
      {
        src: "/screens/paytap/receipt-detail.webp",
        alt: "주문 상품, 할인, 공급가와 부가세, 카드 결제 정보를 보여주는 영수증 상세 화면",
        caption: "영수증 상세",
        width: 1206,
        height: 2622,
      },
    ],
    screensNote: "화면의 값은 예시이며, 실제와는 다를 수 있습니다.",
    sections: [
      {
        id: "features",
        title: "주요 기능",
        blocks: [
          {
            kind: "cards",
            items: [
              {
                title: "홈",
                detail: "오늘, 이번 주, 이번 달 총 매출과 카드, 현금, 간편결제, 포인트로 나눈 오늘 매출을 보여줘요",
              },
              {
                title: "매출 조회",
                detail:
                  "당일 판매와 반품 합계, 영수증 목록과 상세, 결제 수단별 내역, 일별과 월별 합계를 볼 수 있어요",
              },
              {
                title: "매출 변화",
                detail: "시간대별, 요일별, 월별 매출을 기간 평균과 나란히 놓고 막대 차트로 비교해요",
              },
              {
                title: "상품, 카드사, 할인 유형별 매출",
                detail: "기간과 포스를 골라 다시 조회하고, 상품은 판매 순위와 도넛 차트로 보여줘요",
              },
              {
                title: "정산과 승인",
                detail: "정산 내역과 카드, 간편결제, 현금영수증 승인 내역, 주문 취소 내역을 볼 수 있어요",
              },
              {
                title: "마이페이지",
                detail: "매장 정보, 알림센터, 공지와 자주 묻는 질문, 비밀번호 변경, 약관을 볼 수 있어요",
              },
            ],
          },
        ],
      },
      {
        id: "scope",
        title: "이 프로젝트에서 맡은 영역",
        blocks: [
          {
            kind: "bullets",
            items: [
              "앱 기획과 화면 디자인",
              "레이아웃, 입력창, 칩, 모달, 날짜 선택처럼 여러 화면이 함께 쓰는 공용 위젯",
              "fl_chart 로 만든 세로 막대 차트와 도넛 차트, 금액 비율을 보여주는 가로 막대 목록",
              "기간과 포스를 골라 다시 조회하는 검색 필터(화면 19곳에서 사용)",
              "홈 화면",
              "시간대별, 요일별, 월별 매출 변화 화면",
              "매출 탭의 도넛 차트와 상품 탭의 판매 순위로 나눈 상품 매출 화면",
            ],
          },
        ],
      },
      {
        id: "architecture",
        title: "구조",
        blocks: [
          {
            kind: "text",
            paragraphs: [
              "기능별 폴더 안에 화면, 화면 모델, 그 화면에서만 쓰는 위젯을 함께 두었어요.",
              "화면 상태는 Riverpod 3 의 Notifier 로 관리하고, 화면을 벗어나면 상태가 정리되도록 대부분 autoDispose 로 등록했어요.",
              "서버 요청은 서비스 클래스에서만 하고, 화면 모델은 서비스를 불러 결과만 받아요.",
              "경로는 go_router 로 매출과 마이페이지를 파일별로 나눠 등록했어요.",
            ],
          },
        ],
      },
      {
        id: "stack",
        title: "기술 스택",
        blocks: [
          {
            kind: "table",
            columns: ["기술 스택", "적용 영역"],
            rows: [
              ["Flutter", "iOS 와 Android 앱 화면 전체"],
              ["Riverpod 3", "화면 모델의 상태 관리"],
              ["go_router 17", "경로 35개와 화면 이동"],
              ["fl_chart", "매출 변화 막대 차트와 상품 매출 도넛 차트"],
              ["Firebase Cloud Messaging", "푸시 알림 받기, 앱을 쓰는 중에는 flutter_local_notifications 로 알림 표시"],
              ["flutter_secure_storage", "자동 로그인 정보와 매장 정보 저장"],
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "we-on",
    name: "WE-ON",
    platform: "iOS",
    summary:
      "결식 우려 아동이 아동급식카드로 이용할 수 있는 동네 식당을 찾고, 한 달 식비를 관리할 수 있는 iOS 앱이에요.",
    lead: [
      "결식 우려 아동이 아동급식카드로 이용할 수 있는 동네 식당을 찾고, 한 달 식비를 관리할 수 있는 iOS 앱이에요.",
      "백엔드는 Cloudflare Workers 와 D1 을 사용해서 만들었어요.",
    ],
    stack: ["Swift 6", "SwiftUI", "Cloudflare Workers", "Hono", "Cloudflare D1"],
    repoUrl: "https://github.com/san5an3an/WE-ON",
    facts: [
      { label: "최소 버전", value: "iOS 17.0" },
      { label: "앱 테스트", value: "단위 32개, UI 1개" },
      { label: "서버 테스트", value: "24개" },
      { label: "가게 데이터", value: "약 30만 곳" },
    ],
    screens: [
      {
        src: "/screens/we-on/home.webp",
        alt: "가장 가까운 식당과 이번 달 가계부 요약을 보여주는 WE-ON 홈 화면",
        caption: "홈",
        width: 1206,
        height: 2622,
      },
      {
        src: "/screens/we-on/search.webp",
        alt: "동네 이름으로 찾은 가게 목록과 가맹 종류 필터를 보여주는 검색 화면",
        caption: "검색",
        width: 1206,
        height: 2622,
      },
      {
        src: "/screens/we-on/account.webp",
        alt: "이번 달 예산 사용률과 날짜별 지출 내역을 보여주는 가계부 화면",
        caption: "가계부",
        width: 1206,
        height: 2622,
      },
      {
        src: "/screens/we-on/my-page.webp",
        alt: "프로필과 이번 달 사용액, 설정 메뉴를 보여주는 내 정보 화면",
        caption: "내 정보",
        width: 1206,
        height: 2622,
      },
    ],
    screensNote: "화면의 값은 예시이며, 실제와는 다를 수 있습니다.",
    sections: [
      {
        id: "features",
        title: "주요 기능",
        blocks: [
          {
            kind: "cards",
            items: [
              {
                title: "홈",
                detail:
                  "현재 위치 주소, 가장 가까운 식당 바로가기, 이번 달 가계부 요약, 아동급식카드 가맹점과 선한 영향력 가게 바로가기, 내 주변 식당 목록",
              },
              {
                title: "검색",
                detail: "가게 이름, 동네 이름, 주소로 검색하고 가맹 종류로 걸러 볼 수 있어요",
              },
              {
                title: "가계부",
                detail:
                  "월별 사용액과 잔액을 도넛 차트로 보여주고, 날짜별로 묶은 지출 내역을 추가, 수정, 삭제할 수 있어요",
              },
              {
                title: "내 정보",
                detail:
                  "이번 달 사용액, 남은 예산, 지출 건수를 보여주고 닉네임 변경, 로그아웃, 계정 탈퇴를 할 수 있어요",
              },
            ],
          },
          {
            kind: "text",
            paragraphs: [
              "가게 상세 화면에서는 선한 영향력 가게의 혜택과 제공 조건, 위생등급, 카카오맵 위치, 리뷰를 볼 수 있어요.",
              "리뷰는 별점, 본문, 사진으로 남길 수 있고 내가 쓴 리뷰만 수정하거나 지울 수 있어요.",
            ],
          },
        ],
      },
      {
        id: "architecture",
        title: "아키텍처",
        blocks: [
          {
            kind: "text",
            paragraphs: [
              "앱은 Presentation, Domain, Data 세 계층으로 나눴어요.",
              "화면은 Domain 에 정의한 인터페이스만 알고, 실제로 서버나 기기 기능을 부르는 코드는 Data 계층에만 있어요.",
              "그래서 서버 형식이 바뀌어도 Data 계층만 고치면 되고, 화면 로직은 가짜 구현으로 바꿔 끼워 테스트할 수 있어요.",
            ],
          },
          {
            kind: "table",
            columns: ["계층", "담당 역할", "대표 타입"],
            rows: [
              [
                "Presentation",
                "화면을 그리고, 사용자 입력을 받아 ViewModel 에 넘겨요. ViewModel 은 화면에 보여줄 상태를 들고 있어요",
                "`HomeView`, `HomeViewModel`, `SessionStore`",
              ],
              [
                "Domain",
                "앱이 다루는 데이터와 규칙을 정의해요. SwiftUI 와 UIKit 을 쓰지 않아서 화면과 상관없이 테스트할 수 있어요",
                "`StoreDetail`, `StoreRepository`, `InputValidationUseCase`",
              ],
              [
                "Data",
                "Domain 의 인터페이스를 실제로 구현해요. 서버 요청, Firebase 인증, 위치, 알림 권한을 다뤄요",
                "`RemoteStoreRepository`, `APIClient`, `FirebaseAuthClient`",
              ],
            ],
          },
        ],
      },
      {
        id: "backend",
        title: "백엔드 구성",
        blocks: [
          {
            kind: "text",
            paragraphs: ["무료로 운영할 수 있는 구조로 만들었어요."],
          },
          {
            kind: "bullets",
            items: [
              "Cloudflare Workers 위에서 앱이 쓰는 API 20개를 제공해요.",
              "로그인은 Firebase Authentication 을 쓰고, 서버는 요청마다 Firebase ID 토큰의 서명과 발급 프로젝트를 확인해요.",
              "데이터는 Cloudflare D1 에 저장해요. 주변 가게는 위도와 경도 범위로 먼저 거른 뒤 실제 거리를 계산해서 가까운 순서로 돌려줘요.",
              "검색은 현재 위치 20km 안에서만 해요. 가게 30만 곳을 매번 다 훑으면 D1 무료 읽기 한도를 금방 넘기 때문이에요.",
              "다른 사람의 리뷰나 지출은 수정하거나 지울 수 없고, 탈퇴하면 남긴 데이터도 함께 지워요.",
              "매일 저녁 8시에 지출 알림을 켠 사용자에게 기록 알림을 보내요.",
            ],
          },
        ],
      },
      {
        id: "stack",
        title: "기술 스택",
        blocks: [
          {
            kind: "table",
            caption: "iOS",
            columns: ["기술 스택", "적용 영역", "선정 근거"],
            rows: [
              [
                "SwiftUI",
                "모든 화면과 공용 Component",
                "화면 상태가 바뀌면 자동으로 다시 그려져서 UIKit 보다 코드가 훨씬 짧아졌어요",
              ],
              [
                "Observation",
                "모든 ViewModel 과 `SessionStore`",
                "`@Observable` 은 실제로 읽은 값이 바뀔 때만 화면을 다시 그려서 ObservableObject 보다 가벼워요. 그래서 최소 버전을 iOS 17 로 정했어요",
              ],
              [
                "Swift Concurrency",
                "서버 요청, 위치 조회, 권한 요청",
                "ViewModel 은 `@MainActor` 에서 돌리고, 기다릴 필요 없는 요청은 `async let` 으로 동시에 보내요. 위치는 TaskGroup 으로 5초 제한을 걸었고, FCM 토큰은 actor 에 보관해요",
              ],
              [
                "Swift 6 엄격한 동시성 검사",
                "프로젝트 전체",
                "데이터 경합을 컴파일 단계에서 막으려고 켰고, 경고 없이 빌드돼요",
              ],
              [
                "카카오맵 SDK",
                "가게 위치 미리보기, 큰 지도, 가게 위치 마커",
                "주소 검색에 쓰는 카카오 개발자 앱 하나로 지도 키까지 관리할 수 있어요. SDK 가 UIKit 뷰만 제공해서 `UIViewRepresentable` 로 연결하고, 지도 엔진은 화면이 사라질 때 멈추게 했어요",
              ],
              [
                "Swift Charts",
                "가계부 사용액과 잔액 도넛 차트",
                "기본 프레임워크라 라이브러리를 추가하지 않아도 됐어요",
              ],
            ],
          },
          {
            kind: "table",
            caption: "서버",
            columns: ["기술 스택", "적용 영역", "선정 근거"],
            rows: [
              [
                "Cloudflare Workers",
                "API 서버와 매일 저녁 알림 예약",
                "카드 등록 없이 무료로 쓸 수 있고, 정해진 시간에 실행하는 Cron 도 무료예요",
              ],
              [
                "Hono",
                "라우트 나누기와 에러 응답 통일",
                "Workers 에서 가볍게 돌아가고, 라우트를 기능별 파일로 나누기 쉬웠어요",
              ],
              [
                "Cloudflare D1",
                "회원, 가게, 리뷰, 가계부, 알림 저장",
                "Workers 와 바로 연결되는 SQLite 라서 SQL 로 조회하고 마이그레이션 파일로 테이블을 관리해요",
              ],
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "greeon",
    name: "GREEON",
    platform: "iOS",
    summary: "전기차 충전소를 찾고 충전까지 이어주는 iOS 앱이에요.",
    lead: ["전기차 충전소를 찾고 충전까지 이어주는 iOS 앱이에요."],
    stack: ["Swift", "UIKit", "KakaoMapsSDK"],
    repoUrl: "https://github.com/san5an3an/GREEON_swift",
    facts: [
      { label: "UI", value: "UIKit" },
      { label: "지도", value: "KakaoMapsSDK" },
      { label: "개발 기간", value: "2024.02 ~ 2026.07" },
    ],
    screens: [
      {
        src: "/screens/greeon/home.webp",
        alt: "충전 내역과 자주 이용한 충전소를 보여주는 GREEON 홈 화면",
        caption: "홈",
        width: 1206,
        height: 2622,
      },
      {
        src: "/screens/greeon/charger-select.webp",
        alt: "충전기별 상태와 충전시작 버튼을 보여주는 충전기 선택 화면",
        caption: "충전기 선택",
        width: 1206,
        height: 2622,
      },
      {
        src: "/screens/greeon/charging.webp",
        alt: "충전 진행률과 충전량, 충전 금액을 보여주는 충전 중 화면",
        caption: "충전 중",
        width: 1206,
        height: 2622,
      },
      {
        src: "/screens/greeon/my-greeon.webp",
        alt: "포인트와 메뉴를 보여주는 나의 그리온 화면",
        caption: "나의 그리온",
        width: 1206,
        height: 2622,
      },
    ],
    screensNote: "화면의 값은 예시이며, 실제와는 다를 수 있습니다.",
    sections: [
      {
        id: "screens",
        title: "화면 구성",
        blocks: [
          {
            kind: "cards",
            items: [
              {
                title: "홈",
                detail: "바로가기, 즐겨찾기 충전기, 충전 패턴, 충전 이력을 한 화면에서 보여줘요.",
              },
              {
                title: "지도",
                detail: "카카오맵 위에서 현재 위치와 충전소 위치를 확인할 수 있어요.",
              },
              {
                title: "충전",
                detail: "QR 코드나 충전기 번호로 충전기를 고르고 충전 진행 상태를 확인할 수 있어요.",
              },
              {
                title: "고객 지원",
                detail: "공지사항과 FAQ, 1:1 문의, 고장 신고, 불편 민원 신고 화면을 제공해요.",
              },
            ],
          },
        ],
      },
    ],
  },
];
