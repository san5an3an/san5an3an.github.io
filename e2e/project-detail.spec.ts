import { expect, test, type Page } from "@playwright/test";

const SLUGS = ["cbm-monitoring", "minari-design-storybook", "paytap-owner", "we-on", "greeon"];

const statusBar = (page: Page) => page.getByTestId("build-status");
const hiddenElements = (page: Page) => page.locator("[data-build-hidden]");
const replayButton = (page: Page) => page.getByRole("button", { name: "다시 보기" });
const cursorCanvas = (page: Page) => page.locator("canvas[data-build-canvas]");
const skipButton = (page: Page) => statusBar(page).getByRole("button", { name: "애니메이션 건너뛰기" });
const projectCard = (page: Page, name: string) =>
  page.locator('#projects [data-slot="card"]').filter({ has: page.locator('[data-slot="card-title"]', { hasText: name }) });

test.describe("프로젝트 상세 화면 이동", () => {
  test("카드의 상세 보기 링크를 누르면 상세 화면으로 이동해 제목과 저장소 링크를 표시함", async ({ page }) => {
    await page.goto("/");
    await skipButton(page).click();
    await projectCard(page, "WE-ON").getByRole("link", { name: "상세 보기" }).click();

    await expect(page).toHaveURL(/\/projects\/we-on\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "WE-ON" })).toBeAttached();
    await expect(page.locator("article header").getByRole("link", { name: "Repository 보기" })).toHaveAttribute(
      "href",
      "https://github.com/san5an3an/WE-ON",
    );
  });

  test("카드의 저장소 링크는 상세 화면을 거치지 않고 GitHub 저장소를 가리킴", async ({ page }) => {
    await page.goto("/");
    await skipButton(page).click();
    const repoLink = projectCard(page, "GREEON").getByRole("link", { name: "Repository" });
    await expect(repoLink).toHaveAttribute("href", "https://github.com/san5an3an/GREEON_swift");
    await expect(repoLink).toHaveAttribute("target", "_blank");
  });

  test("상세 화면의 다음 프로젝트 링크를 누르면 다음 프로젝트 상세 화면으로 이동함", async ({ page }) => {
    await page.goto("/projects/cbm-monitoring/");
    await skipButton(page).click();
    await page.getByRole("navigation", { name: "다른 프로젝트" }).getByRole("link", { name: /다음 프로젝트/ }).click();
    await expect(page).toHaveURL(/\/projects\/minari-design-storybook\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "minari-design-storybook" })).toBeAttached();
  });

  test("프로젝트 카드를 CBM, minari, PAYTAP 점주앱, WE-ON, GREEON 순서로 넓은 폭에서 한 줄에 2개씩 표시함", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await skipButton(page).click();
    const titles = page.locator('#projects [data-slot="card-title"]');
    await expect(titles).toHaveText(["CBM 모니터링 시스템", "minari-design-storybook", "PAYTAP 점주앱", "WE-ON", "GREEON"]);

    const tops = await page.locator('#projects [data-slot="card"]').evaluateAll((cards) =>
      cards.map((card) => Math.round(card.getBoundingClientRect().top)),
    );
    expect(tops[0]).toBe(tops[1]);
    expect(tops[2]).toBe(tops[3]);
    expect(tops[2]).toBeGreaterThan(tops[0]);
    expect(tops[4]).toBeGreaterThan(tops[2]);
  });

  test("상세 화면의 프로젝트 목록 링크를 누르면 첫 페이지의 Projects 섹션으로 돌아옴", async ({ page }) => {
    await page.goto("/projects/greeon/");
    await skipButton(page).click();
    await page.locator("article header").getByRole("link", { name: "프로젝트 목록" }).click();
    await expect(page).toHaveURL(/\/#projects$/);
    await expect(page.locator("#projects h2")).toBeAttached();
  });

  // 개발 서버는 상세 경로를 처음 컴파일하기 전에는 없는 주소에 500 을 돌려주므로 실제 상세 화면을 먼저 엶
  async function openMissingPage(page: Page) {
    await page.goto("/projects/greeon/");
    return page.goto("/projects/not-a-project/");
  }

  test("없는 프로젝트 주소를 열면 404 응답을 돌려줌", async ({ page }) => {
    const response = await openMissingPage(page);
    expect(response?.status()).toBe(404);
  });

  test("없는 주소 화면에 기존 머리글, 안내 문구, 돌아갈 링크를 표시함", async ({ page }) => {
    await openMissingPage(page);
    await skipButton(page).click();

    await expect(page).toHaveTitle("404 | San Kang");
    await expect(page.getByRole("link", { name: "San Kang" })).toBeVisible();
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveCSS("font-weight", "800");
    const description = page.getByText("찾을 수 없는 페이지예요. 요청하신 페이지가 사라졌거나, 잘못 들어오신 것 같네요 :)", { exact: true });
    await expect(description).toBeVisible();
    expect(await description.evaluate((element) => (element as HTMLElement).innerText)).toContain("페이지예요.\n요청하신");
    await expect(page.getByRole("main").getByRole("link", { name: "프로젝트 보기" })).toHaveAttribute("href", "/#projects");

    await page.getByRole("link", { name: "첫 페이지로" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("#top h1")).toBeVisible();
  });

  test("404 숫자만 칩 없이 자이언츠체 Inline 으로 크게 표시함", async ({ page }) => {
    await openMissingPage(page);
    await skipButton(page).click();

    const number = page.getByRole("main").getByText("404", { exact: true });
    await expect(number).toHaveCSS("font-family", /giantsInline/);
    await expect(page.getByRole("main").locator('[data-slot="badge"]')).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveCSS("font-family", /giantsInline/);
    const fontSize = await number.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    expect(fontSize).toBeGreaterThan(100);
    await expect.poll(() =>
      number.evaluate((element) => document.fonts.check(`16px ${getComputedStyle(element).fontFamily}`, "404")),
    ).toBe(true);
  });

  for (const [randomValue, title] of [
    [0, "어라....?"],
    [0.5, "여긴 어디 나는 누구"],
    [0.99, "헤헤 잘못 들어왔당"],
  ] as const) {
    test(`무작위 값이 ${randomValue} 이면 없는 주소 제목을 "${title}" 로 표시함`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript((value) => {
        Math.random = () => value;
      }, randomValue);
      await openMissingPage(page);
      await skipButton(page).click();

      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
      expect(errors).toEqual([]);
    });
  }

  test("자바스크립트가 꺼져 있으면 없는 주소에 기본 제목을 표시함", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await openMissingPage(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("어라....?");
    await context.close();
  });

  test("404 숫자를 브랜드 파란색으로 표시함", async ({ page }) => {
    await openMissingPage(page);
    await skipButton(page).click();
    const colors = await page.getByRole("main").getByText("404", { exact: true }).evaluate((element) => {
      const probe = document.createElement("span");
      probe.style.color = "var(--semantic-fg-brand-default)";
      document.body.append(probe);
      const expected = getComputedStyle(probe).color;
      probe.remove();
      return { actual: getComputedStyle(element).color, expected };
    });
    expect(colors.actual).toBe(colors.expected);
  });

  test("넓은 폭에서는 404 옆에 제목, 설명, 버튼을 세로로 놓고 좁은 폭에서는 아래로 쌓음", async ({ page }) => {
    const boxes = async () => {
      const main = page.getByRole("main");
      return {
        number: await main.getByText("404", { exact: true }).boundingBox(),
        title: await main.getByRole("heading", { level: 1 }).boundingBox(),
        description: await main.getByText("찾을 수 없는 페이지예요", { exact: false }).boundingBox(),
        button: await main.getByRole("link", { name: "첫 페이지로" }).boundingBox(),
      };
    };

    await page.setViewportSize({ width: 1280, height: 800 });
    await openMissingPage(page);
    await skipButton(page).click();
    const wide = await boxes();
    expect(wide.title!.x).toBeGreaterThanOrEqual(wide.number!.x + wide.number!.width);
    expect(wide.description!.x).toBe(wide.title!.x);
    expect(wide.button!.x).toBe(wide.title!.x);
    expect(wide.description!.y).toBeGreaterThan(wide.title!.y);
    expect(wide.button!.y).toBeGreaterThan(wide.description!.y);

    await page.setViewportSize({ width: 390, height: 844 });
    const narrow = await boxes();
    expect(narrow.title!.y).toBeGreaterThanOrEqual(narrow.number!.y + narrow.number!.height);
    expect(narrow.title!.x).toBe(narrow.number!.x);
  });

  test("없는 주소 화면을 열지 않으면 자이언츠체 파일을 받지 않음", async ({ page }) => {
    const fontRequests: string[] = [];
    page.on("request", (request) => {
      if (/giants.*\.otf/i.test(request.url())) fontRequests.push(request.url());
    });
    await page.goto("/");
    await skipButton(page).click();
    await page.goto("/projects/greeon/");
    await skipButton(page).click();
    expect(fontRequests).toEqual([]);
  });

  test("없는 주소 화면도 조립 뒤 돌아다니는 커서 3개만 남김", async ({ page }) => {
    await openMissingPage(page);
    await expect(statusBar(page)).toBeVisible();
    await expect(replayButton(page)).toBeVisible({ timeout: 20000 });
    await expect(hiddenElements(page)).toHaveCount(0);
    await expect(cursorCanvas(page)).toHaveAttribute("data-build-cursors", "3", { timeout: 5000 });
  });

  test("모바일 폭의 없는 주소 화면이 가로로 넘치지 않음", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openMissingPage(page);
    await skipButton(page).click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("프로젝트 상세 화면 조립 애니메이션", () => {
  for (const slug of SLUGS) {
    test(`${slug} 상세 화면을 직접 열어 끝까지 스크롤하면 숨겨진 요소 없이 완성됨`, async ({ page }) => {
      await page.goto(`/projects/${slug}/`);
      await expect(statusBar(page)).toBeVisible();
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, document.documentElement.scrollHeight);
      });
      await expect(replayButton(page)).toBeVisible({ timeout: 25000 });
      await expect(hiddenElements(page)).toHaveCount(0);
    });
  }

  test("첫 페이지에서 상세 화면으로 이동하면 상세 화면도 조립을 시작함", async ({ page }) => {
    await page.goto("/");
    await skipButton(page).click();
    await projectCard(page, "minari-design-storybook").getByRole("link", { name: "상세 보기" }).click();
    await expect(page).toHaveURL(/\/projects\/minari-design-storybook\/$/);
    await expect(statusBar(page)).toBeVisible();
    await expect(page.locator("#scope h2")).toHaveAttribute("data-build-hidden");
  });

  test("이미 본 첫 페이지로 뒤로 가면 다시 재생하지 않고 다시 보기 버튼만 표시함", async ({ page }) => {
    await page.goto("/");
    await skipButton(page).click();
    await projectCard(page, "WE-ON").getByRole("link", { name: "상세 보기" }).click();
    await expect(page).toHaveURL(/\/projects\/we-on\/$/);
    await page.goBack();

    await expect(page.locator("#top h1")).toBeVisible();
    await expect(replayButton(page)).toBeVisible();
    await expect(statusBar(page)).toHaveCount(0);
    await expect(hiddenElements(page)).toHaveCount(0);
  });

  test("다시 보기 버튼을 누르면 이미 본 페이지도 조립을 다시 시작함", async ({ page }) => {
    await page.goto("/");
    await skipButton(page).click();
    await projectCard(page, "WE-ON").getByRole("link", { name: "상세 보기" }).click();
    await expect(page).toHaveURL(/\/projects\/we-on\/$/);
    await page.goBack();

    await replayButton(page).click();
    await expect(statusBar(page)).toBeVisible();
  });

  test("이미 본 페이지를 새로고침하면 조립을 다시 재생함", async ({ page }) => {
    await page.goto("/");
    await skipButton(page).click();
    await page.reload();
    await expect(statusBar(page)).toBeVisible();
  });

  test("이미 본 페이지의 주소를 직접 다시 열면 조립을 다시 재생함", async ({ page }) => {
    await page.goto("/projects/greeon/");
    await skipButton(page).click();
    await page.goto("/projects/greeon/");
    await expect(statusBar(page)).toBeVisible();
  });

  test("이미 본 상세 화면도 카드의 링크로 다시 들어가면 조립을 재생함", async ({ page }) => {
    await page.goto("/");
    await skipButton(page).click();
    await projectCard(page, "WE-ON").getByRole("link", { name: "상세 보기" }).click();
    await expect(page).toHaveURL(/\/projects\/we-on\/$/);
    await skipButton(page).click();

    await page.goBack();
    await expect(replayButton(page)).toBeVisible();
    await projectCard(page, "WE-ON").getByRole("link", { name: "상세 보기" }).click();
    await expect(page).toHaveURL(/\/projects\/we-on\/$/);

    await expect(statusBar(page)).toBeVisible();
    await expect(replayButton(page)).toHaveCount(0);
    await expect(page.locator("article h1")).toHaveAttribute("data-build-hidden");
  });

  test("이미 본 상세 화면으로 앞으로 가기로 돌아가면 재생하지 않고 다시 보기 버튼과 돌아다니는 커서 3개만 표시함", async ({ page }) => {
    await page.goto("/");
    await skipButton(page).click();
    await projectCard(page, "WE-ON").getByRole("link", { name: "상세 보기" }).click();
    await expect(page).toHaveURL(/\/projects\/we-on\/$/);
    await skipButton(page).click();

    await page.goBack();
    await expect(replayButton(page)).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(/\/projects\/we-on\/$/);

    await expect(page.locator("article h1")).toBeVisible();
    await expect(replayButton(page)).toBeVisible();
    await expect(statusBar(page)).toHaveCount(0);
    await expect(hiddenElements(page)).toHaveCount(0);
    await expect(cursorCanvas(page)).toHaveAttribute("data-build-cursors", "3", { timeout: 5000 });
  });

  test("이미 본 첫 페이지로 프로젝트 목록 링크를 눌러 돌아오면 재생하지 않음", async ({ page }) => {
    await page.goto("/");
    await skipButton(page).click();
    await projectCard(page, "WE-ON").getByRole("link", { name: "상세 보기" }).click();
    await expect(page).toHaveURL(/\/projects\/we-on\/$/);
    await skipButton(page).click();

    await page.locator("article header").getByRole("link", { name: "프로젝트 목록" }).click();
    await expect(page).toHaveURL(/\/#projects$/);

    await expect(replayButton(page)).toBeVisible();
    await expect(statusBar(page)).toHaveCount(0);
    await expect(hiddenElements(page)).toHaveCount(0);
  });

  test("같은 페이지에서 해시 이동을 뒤로 간 다음 누른 상세 보기 링크는 조립을 재생함", async ({ page }) => {
    await page.goto("/projects/we-on/");
    await skipButton(page).click();
    await page.locator("article header").getByRole("link", { name: "프로젝트 목록" }).click();
    await expect(page).toHaveURL(/\/#projects$/);
    await skipButton(page).click();

    await page.locator("header nav").getByRole("link", { name: "Skills" }).click();
    await expect(page).toHaveURL(/#skills$/);
    await page.goBack();
    await expect(page).toHaveURL(/#projects$/);

    await projectCard(page, "WE-ON").getByRole("link", { name: "상세 보기" }).click();
    await expect(page).toHaveURL(/\/projects\/we-on\/$/);
    await expect(statusBar(page)).toBeVisible();
  });
});

test.describe("minari 상세 화면 컬러칩", () => {
  test.use({ viewport: { width: 1440, height: 1200 } });

  const chips = (page: Page) => page.getByTestId("system-chip");

  // 컬러칩이 화면 안에서 모서리 효과까지 마친 뒤 나머지 요소를 스크롤로 완성
  async function playChipEffectsThenFinish(page: Page) {
    await expect(statusBar(page)).toBeVisible();
    await expect(page.locator('[data-testid="system-chip"][data-build-hidden]')).toHaveCount(0, { timeout: 15000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await expect(replayButton(page)).toBeVisible({ timeout: 25000 });
  }

  test("조립 애니메이션이 끝까지 재생된 뒤 컬러칩 20개의 모서리 값이 모두 같음", async ({ page }) => {
    await page.goto("/projects/minari-design-storybook/");
    await playChipEffectsThenFinish(page);

    await expect(chips(page)).toHaveCount(20);
    const radii = await chips(page).evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).borderTopLeftRadius),
    );
    expect(new Set(radii)).toEqual(new Set(["8px"]));
  });

  test("조립 효과가 끝나면 요소에 직접 지정된 모서리 값을 지우지 않고 되돌림", async ({ page }) => {
    await page.goto("/projects/minari-design-storybook/");
    await skipButton(page).click();
    await chips(page).evaluateAll((elements) => {
      for (const element of elements) (element as HTMLElement).style.borderRadius = "10px";
    });

    await replayButton(page).click();
    await playChipEffectsThenFinish(page);

    const radii = await chips(page).evaluateAll((elements) =>
      elements.map((element) => (element as HTMLElement).style.borderRadius),
    );
    expect(new Set(radii)).toEqual(new Set(["10px"]));
  });
});

test.describe("상세 화면 실제 화면 이미지", () => {
  const screens = (page: Page) => page.getByTestId("project-screens");

  test("minari 상세 화면에 고해상도 화면 이미지 4장과 설명을 표시함", async ({ page }) => {
    await page.goto("/projects/minari-design-storybook/");
    await skipButton(page).click();
    await screens(page).scrollIntoViewIfNeeded();

    const images = screens(page).getByRole("img");
    await expect(images).toHaveCount(4);
    await expect(screens(page).locator("figcaption")).toHaveCount(4);
    await expect(images.first()).toHaveAttribute("alt", /Usage 대시보드/);

    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(2880);
    }
  });

  test("이미지를 불러오기 전과 후의 위치가 같아 조립 위치가 틀어지지 않음", async ({ page }) => {
    await page.goto("/projects/minari-design-storybook/");
    await skipButton(page).click();
    const image = screens(page).getByRole("img").last();
    const box = () => image.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { width: Math.round(rect.width), height: Math.round(rect.height) };
    });

    const before = await box();
    expect(before.height).toBeGreaterThan(0);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).complete)).toBe(true);
    expect(await box()).toEqual(before);
  });

  test("이미지 영역도 조립 대상이라 스크롤 전에는 숨겨져 있고 끝까지 조립하면 보임", async ({ page }) => {
    await page.goto("/projects/minari-design-storybook/");
    await expect(statusBar(page)).toBeVisible();
    await expect(screens(page).getByRole("img").first()).toHaveAttribute("data-build-hidden");

    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await expect(replayButton(page)).toBeVisible({ timeout: 25000 });
    await expect(screens(page).getByRole("img").first()).toHaveCSS("opacity", "1");
  });

  test("WE-ON 상세 화면에 고해상도 앱 화면 4장과 설명을 표시함", async ({ page }) => {
    await page.goto("/projects/we-on/");
    await skipButton(page).click();
    await screens(page).scrollIntoViewIfNeeded();

    await expect(screens(page).locator("figcaption")).toHaveText(["홈", "검색", "가계부", "내 정보"]);
    const images = screens(page).getByRole("img");
    await expect(images).toHaveCount(4);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(1206);
    }
  });

  test("PAYTAP 점주앱 상세 화면에 고해상도 앱 화면 4장과 설명을 표시함", async ({ page }) => {
    await page.goto("/projects/paytap-owner/");
    await skipButton(page).click();
    await screens(page).scrollIntoViewIfNeeded();

    await expect(screens(page).locator("figcaption")).toHaveText(["홈", "시간대별 매출 변화", "상품 매출", "영수증 상세"]);
    const images = screens(page).getByRole("img");
    await expect(images).toHaveCount(4);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(1206);
    }
    await expect(page.locator("article header").getByRole("link", { name: "Repository 보기" })).toHaveAttribute(
      "href",
      "https://github.com/san5an3an/paytap_flutter_employee_app",
    );
  });

  test("GREEON 상세 화면에 고해상도 앱 화면 4장과 설명을 표시함", async ({ page }) => {
    await page.goto("/projects/greeon/");
    await skipButton(page).click();
    await screens(page).scrollIntoViewIfNeeded();

    await expect(screens(page).locator("figcaption")).toHaveText(["홈", "충전기 선택", "충전 중", "나의 그리온"]);
    const images = screens(page).getByRole("img");
    await expect(images).toHaveCount(4);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(1206);
    }
  });

  test("CBM 상세 화면에 고해상도 화면 이미지 4장과 설명을 표시함", async ({ page }) => {
    await page.goto("/projects/cbm-monitoring/");
    await skipButton(page).click();
    await screens(page).scrollIntoViewIfNeeded();

    await expect(screens(page).locator("figcaption")).toHaveText(["플릿 개요", "이상 감지 내역", "임계 튜닝", "모델 진단"]);
    const images = screens(page).getByRole("img");
    await expect(images).toHaveCount(4);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(2880);
    }
    await expect(page.locator("article header").getByRole("link", { name: "Repository 보기" })).toHaveAttribute(
      "href",
      "https://github.com/san5an3an/cbm260-aibase-ml-web-react",
    );
  });

  test("예시 값 안내 문구를 CBM, PAYTAP 점주앱, WE-ON, GREEON 상세 화면에만 표시함", async ({ page }) => {
    const note = page.getByText("화면의 값은 예시이며, 실제와는 다를 수 있습니다.", { exact: true });

    for (const slug of ["cbm-monitoring", "paytap-owner", "we-on", "greeon"]) {
      await page.goto(`/projects/${slug}/`);
      await skipButton(page).click();
      await note.scrollIntoViewIfNeeded();
      await expect(note).toBeVisible();
    }

    await page.goto("/projects/minari-design-storybook/");
    await skipButton(page).click();
    await expect(note).toHaveCount(0);
  });

  test("도형으로 그린 프레임 대신 실제 앱 화면만 표시함", async ({ page }) => {
    await page.goto("/projects/greeon/");
    await skipButton(page).click();
    await expect(page.getByText("GREEON / 홈")).toHaveCount(0);

    await page.goto("/projects/we-on/");
    await skipButton(page).click();
    await expect(page.getByText("WE-ON / 홈")).toHaveCount(0);
  });

  test("세로 앱 화면은 넓은 폭에서 한 줄에 4장, 모바일 폭에서 2장씩 표시함", async ({ page }) => {
    const rowTops = () =>
      screens(page).locator("figure").evaluateAll((figures) =>
        figures.map((figure) => Math.round(figure.getBoundingClientRect().top + window.scrollY)),
      );

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/projects/greeon/");
    await skipButton(page).click();
    expect(new Set(await rowTops()).size).toBe(1);

    await page.setViewportSize({ width: 390, height: 844 });
    const [first, second, third, fourth] = await rowTops();
    expect(first).toBe(second);
    expect(third).toBe(fourth);
    expect(third).toBeGreaterThan(first);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("모바일 폭에서도 이미지가 화면 폭을 넘지 않음", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/projects/minari-design-storybook/");
    await skipButton(page).click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const width = await screens(page).getByRole("img").first().evaluate((element) => element.getBoundingClientRect().width);
    expect(width).toBeLessThanOrEqual(390);
  });
});

test.describe("상세 화면 표 배치", () => {
  // 표마다 본문 행 높이의 최대와 최소 차이, 머리글과 첫 행의 열 위치 일치 여부 측정
  function measureTables(page: Page) {
    return page.locator("article table").evaluateAll((tables) =>
      tables.map((table) => {
        const heights = [...table.querySelectorAll("tbody tr")].map((row) => row.getBoundingClientRect().height);
        const left = (cell: Element) => Math.round(cell.getBoundingClientRect().left);
        return {
          rowCount: heights.length,
          spread: Math.max(...heights) - Math.min(...heights),
          headLefts: [...table.querySelectorAll("thead th")].map(left),
          cellLefts: [...table.querySelectorAll("tbody tr:first-child td")].map(left),
        };
      }),
    );
  }

  async function expectEqualRows(page: Page) {
    await page.goto("/projects/we-on/");
    await skipButton(page).click();
    const tables = await measureTables(page);
    expect(tables).toHaveLength(3);
    for (const table of tables) {
      expect(table.rowCount).toBeGreaterThan(1);
      expect(table.spread).toBeLessThanOrEqual(0.1);
      expect(table.cellLefts).toEqual(table.headLefts);
    }
  }

  test("데스크톱 폭에서 표마다 본문 행 높이가 모두 같고 머리글과 열 위치가 일치함", async ({ page }) => {
    await expectEqualRows(page);
  });

  test("모바일 폭에서 표마다 본문 행 높이가 모두 같고 머리글과 열 위치가 일치함", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expectEqualRows(page);
  });

  test("grid 로 배치해도 표와 머리글, 셀의 접근성 역할을 유지함", async ({ page }) => {
    await page.goto("/projects/we-on/");
    await skipButton(page).click();
    await expect(page.getByRole("table")).toHaveCount(3);
    await expect(page.getByRole("columnheader")).toHaveCount(9);
    await expect(page.getByRole("cell")).toHaveCount(36);
    await expect(page.getByRole("cell", { name: "Presentation", exact: true })).toBeAttached();
  });
});

test.describe("상세 화면 표 조립 순서", () => {
  // 지정한 요소의 조립 단계 변화와 그 순간의 숨김 여부를 기록하고 요소를 화면으로 이동
  function recordPhases(page: Page, selector: string) {
    return page.evaluateHandle((target) => {
      const element = document.querySelector(target);
      const history: string[] = [];
      if (!element) return history;
      new MutationObserver(() => {
        const hidden = element.hasAttribute("data-build-hidden") ? "hidden" : "visible";
        history.push(`${element.getAttribute("data-build-phase")}:${hidden}`);
      }).observe(element, { attributes: true, attributeFilter: ["data-build-phase"] });
      document.documentElement.style.scrollBehavior = "auto";
      element.scrollIntoView({ block: "center" });
      return history;
    }, selector);
  }

  test("표 셀은 숨겨진 채 프레임을 먼저 그린 뒤 글자를 입력하고 흔적 없이 끝남", async ({ page }) => {
    await page.goto("/projects/we-on/");
    await expect(statusBar(page)).toBeVisible();
    const history = await recordPhases(page, "#architecture tbody td");

    await expect
      .poll(() => history.evaluate((items) => [...items]), { timeout: 15000 })
      .toEqual(["framing:hidden", "typing:visible", "null:visible"]);

    const cell = page.locator("#architecture tbody td").first();
    await expect(cell).not.toHaveAttribute("data-build-phase");
    expect(await cell.evaluate((element) => (element as HTMLElement).style.clipPath)).toBe("");
  });

  test("표 머리글 셀도 프레임을 먼저 그린 뒤 글자를 입력함", async ({ page }) => {
    await page.goto("/projects/we-on/");
    await expect(statusBar(page)).toBeVisible();
    const history = await recordPhases(page, "#architecture thead th");

    await expect
      .poll(() => history.evaluate((items) => [...items]), { timeout: 15000 })
      .toEqual(["framing:hidden", "typing:visible", "null:visible"]);
  });

  test("표 바깥 문단은 프레임 없이 바로 글자를 입력함", async ({ page }) => {
    await page.goto("/projects/we-on/");
    await expect(statusBar(page)).toBeVisible();
    const history = await recordPhases(page, "#architecture p");

    await expect
      .poll(() => history.evaluate((items) => [...items]), { timeout: 15000 })
      .toEqual(["typing:visible", "null:visible"]);
  });

  test("표 셀을 조립하는 도중 건너뛰어도 단계 표시와 자르기 스타일이 남지 않음", async ({ page }) => {
    await page.goto("/projects/we-on/");
    await expect(statusBar(page)).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      document.querySelector("#architecture table")?.scrollIntoView({ block: "center" });
    });
    await expect(page.locator("#architecture [data-build-phase]").first()).toBeAttached({ timeout: 15000 });
    await skipButton(page).click();

    await expect(page.locator("[data-build-phase]")).toHaveCount(0);
    await expect(hiddenElements(page)).toHaveCount(0);
    const clipped = await page
      .locator("#architecture td, #architecture th")
      .evaluateAll((cells) => cells.filter((cell) => (cell as HTMLElement).style.clipPath).length);
    expect(clipped).toBe(0);
  });
});

test.describe("상세 화면 사진 끌어다 놓기", () => {
  const firstScreen = "[data-testid='project-screens'] img";

  // 첫 사진의 조립 단계 변화와 그 순간의 숨김 여부를 기록하고 사진을 화면으로 이동
  function recordDrop(page: Page) {
    return page.evaluateHandle((target) => {
      const element = document.querySelector(target);
      const history: string[] = [];
      if (!element) return history;
      new MutationObserver(() => {
        const hidden = element.hasAttribute("data-build-hidden") ? "hidden" : "visible";
        history.push(`${element.getAttribute("data-build-phase")}:${hidden}`);
      }).observe(element, { attributes: true, attributeFilter: ["data-build-phase"] });
      document.documentElement.style.scrollBehavior = "auto";
      element.scrollIntoView({ block: "center" });
      return history;
    }, firstScreen);
  }

  test("사진은 숨긴 채 화면 밖에서 끌고 온 뒤 놓으면서 표시하고 흔적 없이 끝남", async ({ page }) => {
    await page.goto("/projects/cbm-monitoring/");
    await expect(statusBar(page)).toBeVisible();
    const history = await recordDrop(page);

    await expect
      .poll(() => history.evaluate((items) => [...items]), { timeout: 20000 })
      .toEqual(["dragging:hidden", "dropping:visible", "null:visible"]);

    const image = page.locator(firstScreen).first();
    expect(await image.evaluate((element) => (element as HTMLElement).style.transform)).toBe("");
    expect(await image.evaluate((element) => element.getAnimations().length)).toBe(0);
  });

  test("사진을 끌고 오는 도중 건너뛰어도 단계 표시와 숨김이 남지 않음", async ({ page }) => {
    await page.goto("/projects/cbm-monitoring/");
    await expect(statusBar(page)).toBeVisible();
    await recordDrop(page);
    await expect(page.locator(`${firstScreen}[data-build-phase='dragging']`).first()).toBeAttached({ timeout: 20000 });
    await skipButton(page).click();

    await expect(page.locator("[data-build-phase]")).toHaveCount(0);
    await expect(hiddenElements(page)).toHaveCount(0);
  });

  test("아이콘은 끌어다 놓지 않고 그리는 방식을 유지함", async ({ page }) => {
    // 상세 화면 끝까지 조립을 기다리므로 기본 제한 시간보다 길게 잡음
    test.setTimeout(60000);
    await page.addInitScript(() => {
      const phases: string[] = [];
      (window as unknown as { iconPhases: string[] }).iconPhases = phases;
      new MutationObserver((records) => {
        for (const record of records) {
          const target = record.target as Element;
          if (target.tagName.toLowerCase() === "svg" && target.hasAttribute("data-build-phase")) {
            phases.push(target.getAttribute("data-build-phase") ?? "");
          }
        }
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-build-phase"] });
    });
    await page.goto("/projects/cbm-monitoring/");
    await expect(statusBar(page)).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, document.documentElement.scrollHeight);
    });

    await expect(replayButton(page)).toBeVisible({ timeout: 45000 });
    expect(await page.evaluate(() => (window as unknown as { iconPhases: string[] }).iconPhases)).toEqual([]);
  });
});

test.describe("프로젝트 상세 화면 접근성과 대체 화면", () => {
  for (const slug of SLUGS) {
    test(`자바스크립트가 꺼져 있어도 ${slug} 상세 화면의 제목과 내용을 표시함`, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      await page.goto(`/projects/${slug}/`);
      await expect(page.locator("article h1")).toBeVisible();
      await expect(page.locator("article h1")).toHaveCSS("opacity", "1");
      await expect(page.locator("article section h2").first()).toBeVisible();
      await context.close();
    });
  }

  test("움직임 줄이기 설정에서는 상세 화면으로 이동해도 재생 없이 바로 표시함", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    await page.locator('#projects [data-slot="card"]').first().getByRole("link", { name: "상세 보기" }).click();
    await expect(page).toHaveURL(/\/projects\/cbm-monitoring\/$/);
    await expect(page.locator("article h1")).toHaveCSS("opacity", "1");
    await expect(hiddenElements(page)).toHaveCount(0);
    await expect(statusBar(page)).toHaveCount(0);
    await context.close();
  });
});

test.describe("프로젝트 상세 화면 모바일", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const slug of SLUGS) {
    test(`모바일 폭의 ${slug} 상세 화면에 페이지 가로 스크롤이 생기지 않음`, async ({ page }) => {
      await page.goto(`/projects/${slug}/`);
      await skipButton(page).click();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
