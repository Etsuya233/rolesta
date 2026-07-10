import type { Page, Route } from "@playwright/test";

export async function mockAuthenticatedApp(page: Page) {
  await page.route(/\/api\/auth\/setup-status$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        code: "SUCCESS",
        msg: "ok",
        data: { requiresSetup: false },
      },
    });
  });

  await page.route(/\/api\/auth\/current-user$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        code: "SUCCESS",
        msg: "ok",
        data: {
          user: {
            id: "user_e2e",
            username: "e2e",
            displayName: "E2E",
            role: "admin",
          },
        },
      },
    });
  });
}

export async function mockCharacterList(page: Page) {
  await page.route(/\/api\/characters(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        code: "SUCCESS",
        msg: "ok",
        data: {
          items: [
            {
              id: "character_e2e",
              ownerUserId: "user_e2e",
              visibility: "private",
              name: "Seraphina",
              tags: ["fantasy"],
              version: "1.0",
              comment: "Forest guardian",
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

type CharacterDetailOverrides = Partial<{
  alternateGreetings: string[];
  description: string;
  visibility: "private" | "public";
}>;

export async function mockCharacterDetail(
  page: Page,
  overrides: CharacterDetailOverrides = {},
) {
  await page.route(/\/api\/characters\/character_e2e$/, async (route) => {
    await fulfillCharacterDetail(route, overrides);
  });
}

export async function mockCharacterUpdate(
  page: Page,
  onUpdate: (values: Record<string, unknown>) => void,
) {
  await page.route(/\/api\/characters\/character_e2e$/, async (route) => {
    if (route.request().method() === "PATCH") {
      const values = route.request().postDataJSON() as Record<string, unknown>;
      onUpdate(values);
      await fulfillCharacterDetail(route, values);
      return;
    }

    await route.fallback();
  });
}

async function fulfillCharacterDetail(
  route: Route,
  overrides: CharacterDetailOverrides | Record<string, unknown> = {},
) {
  await route.fulfill({
    contentType: "application/json",
    json: {
      code: "SUCCESS",
      msg: "ok",
      data: {
        id: "character_e2e",
        ownerUserId: "user_e2e",
        visibility: "private",
        name: "Seraphina",
        tags: ["fantasy"],
        version: "1.0",
        comment: "Forest guardian",
        createdAtMs: 1783090000000,
        updatedAtMs: 1783090000000,
        lastUsedAtMs: null,
        usageCount: 0,
        nickname: null,
        creator: null,
        description: "A guardian of the old forest.",
        personality: "Patient and careful.",
        scenario: "Deep in the forest.",
        firstMessage: "The leaves shift before you arrive.",
        alternateGreetings: [],
        groupOnlyGreetings: [],
        messageExample: "",
        creatorNotes: "",
        creatorNotesMultilingual: {},
        systemPrompt: "",
        postHistoryInstructions: "",
        characterBook: null,
        assets: [],
        source: [],
        metadata: {},
        sourceFormat: "sillytavern_v2",
        creationDateMs: null,
        modificationDateMs: null,
        ...overrides,
      },
    },
  });
}
