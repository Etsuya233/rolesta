import { expect, test } from "@playwright/test";
import {
  mockAuthenticatedApp,
  mockCharacterDetail,
  mockCharacterList,
  mockCharacterUpdate,
} from "./api-mocks";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("rolesta.locale", "zh-CN");
  });
});

test("renders character manager controls", async ({ page }) => {
  await mockAuthenticatedApp(page);
  await mockCharacterList(page);

  await page.goto("/app/characters");

  await expect(page.getByRole("heading", { name: "角色卡" })).toBeVisible();
  await expect(page.getByLabel("搜索角色卡")).toBeVisible();
  await expect(page.getByLabel("第一页")).toBeVisible();
  await expect(page.getByLabel("上一页")).toBeVisible();
  await expect(page.getByLabel("下一页")).toBeVisible();
  await expect(page.getByLabel("最后一页")).toBeVisible();
});

test("renders character editor sections without advanced page entry", async ({
  page,
}) => {
  await mockAuthenticatedApp(page);
  await mockCharacterList(page);
  await mockCharacterDetail(page);

  await page.goto("/app/characters");
  await page.getByRole("button", { name: "Seraphina" }).click();

  await expect(page.getByRole("heading", { name: "编辑角色卡" })).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "基础信息 角色卡在列表和聊天选择中的基本识别信息",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "角色内容 控制角色人设、对话开场和示例语气",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "提示词覆盖 覆盖上下文组装时使用的提示词片段",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "元数据 可直接维护的创作者信息" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "其他开场" })).toBeVisible();
  const saveButton = page.getByRole("button", { name: "保存" });
  const saveBoxBefore = await saveButton.boundingBox();
  expect(saveBoxBefore).not.toBeNull();
  await page.getByLabel("角色卡主编辑").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  const saveBoxAfter = await saveButton.boundingBox();
  expect(saveBoxAfter).not.toBeNull();
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  expect(saveBoxAfter!.y).toBeCloseTo(saveBoxBefore!.y, 0);
  expect(saveBoxAfter!.y + saveBoxAfter!.height).toBeLessThanOrEqual(
    viewportHeight,
  );
  await expect(page.getByLabel("来源 JSON")).toHaveCount(0);
  await expect(page.getByLabel("素材 JSON")).toHaveCount(0);
  await expect(page.getByLabel("多语言备注 JSON")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "高级定义" })).toHaveCount(0);
});

test("keeps long character textareas partially visible by default", async ({
  page,
}) => {
  const longDescription = Array.from(
    { length: 12 },
    (_, index) => `Forest memory line ${index + 1}.`,
  ).join("\n");
  const longGreeting = Array.from(
    { length: 10 },
    (_, index) => `Greeting branch ${index + 1}.`,
  ).join("\n");

  await mockAuthenticatedApp(page);
  await mockCharacterList(page);
  await mockCharacterDetail(page, {
    alternateGreetings: [longGreeting],
    description: longDescription,
  });

  await page.goto("/app/characters");
  await page.getByRole("button", { name: "Seraphina" }).click();

  const descriptionField = page.getByRole("textbox", { name: "角色描述" });
  await expect(descriptionField).toHaveValue(longDescription);
  const descriptionSize = await descriptionField.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(descriptionSize.clientHeight).toBeLessThan(
    descriptionSize.scrollHeight,
  );

  await page.getByRole("button", { name: "其他开场" }).click();

  const greetingField = page.getByRole("textbox", { name: "开场 1" });
  await expect(greetingField).toHaveValue(longGreeting);
  const greetingSize = await greetingField.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(greetingSize.clientHeight).toBeLessThan(greetingSize.scrollHeight);
});

test("keeps character views alive while editing alternate greetings", async ({
  page,
}) => {
  let updatedValues: Record<string, unknown> | null = null;

  await mockAuthenticatedApp(page);
  await mockCharacterList(page);
  await mockCharacterDetail(page);
  await mockCharacterUpdate(page, (values) => {
    updatedValues = values;
  });

  await page.goto("/app/characters");
  await page.getByLabel("搜索角色卡").fill("Sera");
  await page.getByRole("button", { name: "Seraphina" }).click();

  const mainEditorScreen = page.getByLabel("角色卡主编辑");
  const contentTrigger = page.getByRole("button", {
    name: "角色内容 控制角色人设、对话开场和示例语气",
  });
  await expect(contentTrigger).toHaveAttribute("aria-expanded", "true");

  await mainEditorScreen.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  const bottomScroll = await mainEditorScreen.evaluate(
    (element) => element.scrollTop,
  );
  expect(bottomScroll).toBeGreaterThan(0);

  await page.getByRole("button", { name: "其他开场" }).click();
  const scrollBefore = await mainEditorScreen.evaluate(
    (element) => element.scrollTop,
  );
  expect(scrollBefore).toBeGreaterThan(0);
  await expect(page.getByRole("heading", { name: "开场消息" })).toBeVisible();
  await page.getByRole("button", { name: "添加开场" }).click();
  await page
    .getByRole("textbox", { name: "开场 1" })
    .fill("The wind carries a second hello.");

  await page.getByRole("button", { name: "返回" }).last().click();
  await expect(page.getByRole("heading", { name: "编辑角色卡" })).toBeVisible();
  await expect(page.getByLabel("搜索角色卡")).toHaveValue("Sera");
  await expect(contentTrigger).toHaveAttribute("aria-expanded", "true");
  await expect
    .poll(() => mainEditorScreen.evaluate((element) => element.scrollTop))
    .toBe(scrollBefore);

  await page.getByRole("button", { name: "保存" }).click();
  await expect
    .poll(() => updatedValues?.alternateGreetings)
    .toEqual(["The wind carries a second hello."]);
});

test("keeps list filters alive after visiting character import", async ({
  page,
}) => {
  await mockAuthenticatedApp(page);
  await mockCharacterList(page);

  await page.goto("/app/characters");
  await page.getByLabel("搜索角色卡").fill("Sera");
  await page.getByLabel("导入角色卡").click();

  await expect(page.getByRole("heading", { name: "导入角色卡" })).toBeVisible();

  await page.getByRole("button", { name: "返回" }).last().click();

  await expect(page.getByRole("heading", { name: "角色卡" })).toBeVisible();
  await expect(page.getByLabel("搜索角色卡")).toHaveValue("Sera");
});

test("discards an unsaved edit draft after leaving the editor page", async ({
  page,
}) => {
  await mockAuthenticatedApp(page);
  await mockCharacterList(page);
  await mockCharacterDetail(page);

  await page.goto("/app/characters");
  await page.getByRole("button", { name: "Seraphina" }).click();
  await page.getByRole("textbox", { name: "角色描述" }).fill("Unsaved draft");
  await page.getByRole("button", { name: "返回" }).last().click();

  await expect(page.getByRole("heading", { name: "角色卡" })).toBeVisible();

  await page.getByRole("button", { name: "Seraphina" }).click();

  await expect(page.getByRole("textbox", { name: "角色描述" })).toHaveValue(
    "A guardian of the old forest.",
  );
});

test("discards an unsaved create draft after leaving the create page", async ({
  page,
}) => {
  await mockAuthenticatedApp(page);
  await mockCharacterList(page);

  await page.goto("/app/characters");
  await page.getByLabel("新增角色卡").click();
  await page.getByRole("textbox", { name: "名称" }).fill("Draft name");
  await page.getByRole("button", { name: "返回" }).last().click();

  await expect(page.getByRole("heading", { name: "角色卡" })).toBeVisible();

  await page.getByLabel("新增角色卡").click();

  await expect(page.getByRole("textbox", { name: "名称" })).toHaveValue("");
});
