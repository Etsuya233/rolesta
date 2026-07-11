import { expect, test, type Page, type Route } from "@playwright/test";
import { mockAuthenticatedApp } from "./api-mocks";

test("filters presets by permission from the search toolbar", async ({
  page,
}) => {
  await mockAuthenticatedApp(page);
  await mockPresetList(page);
  await page.goto("/app/presets");

  const filterButton = page.getByRole("button", { name: "Filter presets" });
  await filterButton.click();

  const publicRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return (
      url.pathname.endsWith("/api/presets") &&
      url.searchParams.get("scope") === "public"
    );
  });

  await page.getByRole("radio", { name: "Public", exact: true }).click();
  await publicRequest;
  await expect(filterButton).toHaveAttribute("aria-pressed", "true");
});

test("reloads preset details after reopening the preset editor", async ({
  page,
}) => {
  await mockAuthenticatedApp(page);
  await mockPresetList(page);
  await page.route(/\/api\/presets\/preset_e2e$/, async (route) => {
    await fulfillPresetDetail(route);
  });

  await page.goto("/app/presets");
  await page.getByRole("button", { name: /Complete preset/ }).click();

  const nameInput = page.getByRole("textbox", { name: "Name" });
  await expect(nameInput).toHaveValue("Complete preset");

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("heading", { name: "Presets" })).toBeVisible();
  await page.getByRole("button", { name: /Complete preset/ }).click();

  await expect(nameInput).toHaveValue("Complete preset");
});

test("keeps prompt role and position selected after reopening an entry", async ({
  page,
}) => {
  await mockAuthenticatedApp(page);
  await mockPresetList(page);
  await page.route(/\/api\/presets\/preset_e2e$/, async (route) => {
    await fulfillPresetDetail(route);
  });

  await page.goto("/app/presets");
  await page.getByRole("button", { name: /Complete preset/ }).click();
  await page.getByRole("button", { name: "Prompt list" }).click();
  await page.getByRole("button", { name: "Edit entry" }).nth(1).click();

  const roleSelect = page.getByRole("combobox", { name: "Role" });
  const positionSelect = page.getByRole("combobox", { name: "Position" });
  await expect(roleSelect).toHaveText("User");
  await expect(positionSelect).toHaveText("Chat");

  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("button", { name: "Edit entry" }).nth(1).click();

  await expect(roleSelect).toHaveText("User");
  await expect(positionSelect).toHaveText("Chat");
});

test("saves one complete preset document across editor pages", async ({
  page,
}) => {
  let savedDocument: Record<string, unknown> | null = null;

  await mockAuthenticatedApp(page);
  await mockPresetList(page);
  await page.route(/\/api\/presets\/preset_e2e$/, async (route) => {
    if (route.request().method() === "PUT") {
      savedDocument = route.request().postDataJSON() as Record<string, unknown>;
      await fulfillPresetDetail(route, savedDocument);
      return;
    }

    await fulfillPresetDetail(route);
  });

  await page.goto("/app/presets");
  await page.getByRole("button", { name: /Complete preset/ }).click();
  await page.getByRole("button", { name: "Prompt list" }).click();

  const savePromptList = page.getByRole("button", { name: "Save" });
  await expect(savePromptList).toBeDisabled();

  const enabledToggles = page.getByRole("checkbox", { name: "Enable entry" });
  await enabledToggles.first().uncheck();
  await expect(savePromptList).toBeEnabled();

  await page.getByRole("button", { name: "Edit entry" }).nth(1).click();
  await page.getByRole("textbox", { name: "Name" }).fill("Second updated");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByRole("heading", { name: "Edit Entry" })).toBeVisible();
  await expect(savePromptList).toBeDisabled();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(
    page.getByRole("heading", { name: "Prompt list" }),
  ).toBeVisible();
  await expect(enabledToggles.first()).not.toBeChecked();
  await expect
    .poll(() => savedDocument)
    .toMatchObject({
      name: "Complete preset",
      entries: [
        { id: "entry_1", name: "First" },
        { id: "entry_2", name: "Second updated" },
      ],
      promptItems: [
        { entryId: "entry_1", enabled: false },
        { entryId: "entry_2", enabled: true },
      ],
    });
});

async function mockPresetList(page: Page) {
  await page.route(/\/api\/presets(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        code: "SUCCESS",
        msg: "ok",
        data: {
          items: [
            {
              id: "preset_e2e",
              ownerUserId: "user_e2e",
              visibility: "private",
              name: "Complete preset",
              entryCount: 2,
              promptItemCount: 2,
              tokenCount: 4,
              createdAtMs: 1783090000000,
              updatedAtMs: 1783090000000,
              lastUsedAtMs: null,
              usageCount: 0,
            },
          ],
          pageIndex: 0,
          pageSize: 20,
          totalItems: 1,
          totalPages: 1,
        },
      },
    });
  });
}

async function fulfillPresetDetail(
  route: Route,
  document: Record<string, unknown> = {},
) {
  const entries = (document.entries as
    Array<Record<string, unknown>> | undefined) ?? [
    {
      id: "entry_1",
      name: "First",
      role: "system",
      position: "system",
      content: "first content",
    },
    {
      id: "entry_2",
      name: "Second",
      role: "user",
      position: "chat",
      content: "second content",
    },
  ];
  const promptItems = (document.promptItems as
    Array<Record<string, unknown>> | undefined) ?? [
    { entryId: "entry_1", enabled: true },
    { entryId: "entry_2", enabled: true },
  ];

  await route.fulfill({
    contentType: "application/json",
    json: {
      code: "SUCCESS",
      msg: "ok",
      data: {
        id: "preset_e2e",
        ownerUserId: "user_e2e",
        visibility: document.visibility ?? "private",
        name: document.name ?? "Complete preset",
        entryCount: entries.length,
        promptItemCount: promptItems.length,
        tokenCount: 4,
        createdAtMs: 1783090000000,
        updatedAtMs: 1783090001000,
        lastUsedAtMs: null,
        usageCount: 0,
        modelProviderId: null,
        modelSettings: document.modelSettings ?? defaultModelSettings,
        tokenizer: "cl100k_base",
        sourceFormat: "rolesta",
        entries: entries.map((entry, index) => ({
          presetId: "preset_e2e",
          identifier: entry.id,
          tokenCount: 2,
          metadata: {},
          createdAtMs: 1783090000000 + index,
          updatedAtMs: 1783090001000,
          ...entry,
        })),
        promptItems: promptItems.map((item, orderIndex) => ({
          orderIndex,
          ...item,
        })),
      },
    },
  });
}

const defaultModelSettings = {
  contextLength: null,
  maxResponseLength: null,
  stream: true,
  temperature: null,
  presencePenalty: null,
  frequencyPenalty: null,
  repetitionPenalty: null,
  topP: null,
  topK: null,
  minP: null,
  topA: null,
  seed: null,
  n: null,
  reasoningEffort: "",
  verbosity: "",
  showThoughts: false,
};
