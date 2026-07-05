import { expect, test } from "@playwright/test";
import {
  mockAuthenticatedApp,
  mockCharacterDetail,
  mockCharacterList,
} from "./api-mocks";

test("renders character manager controls", async ({ page }) => {
  await mockAuthenticatedApp(page);
  await mockCharacterList(page);

  await page.goto("/app/characters");

  await expect(page.getByRole("heading", { name: "角色卡" })).toBeVisible();
  await expect(page.getByLabel("搜索角色卡")).toBeVisible();
  await expect(page.getByLabel("第一页")).toBeVisible();
  await expect(page.getByLabel("Go to previous page")).toBeVisible();
  await expect(page.getByLabel("Go to next page")).toBeVisible();
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
  await expect(page.getByLabel("来源 JSON")).toHaveCount(0);
  await expect(page.getByLabel("素材 JSON")).toHaveCount(0);
  await expect(page.getByLabel("多语言备注 JSON")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "高级定义" })).toHaveCount(0);
});
