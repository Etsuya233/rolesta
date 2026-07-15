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

export async function mockChatManagement(page: Page) {
  let chats = [chatDetail("chat_e2e", "Existing chat", "character_e2e", "Seraphina")];

  await page.route(/\/api\/chat-preferences\/assets$/, async (route) => {
    await route.fulfill({ contentType: "application/json", json: success({
      personaCharacterId: null,
      presetId: null,
      modelProviderId: null,
    }) });
  });
  await page.route(/\/api\/chats(?:\?.*)?$/, async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON() as { title: string; chatCharacterId: string };
      const name = body.chatCharacterId === "character_luna" ? "Luna" : "Seraphina";
      const created = chatDetail("chat_created", body.title, body.chatCharacterId, name);
      chats = [created, ...chats];
      await route.fulfill({ contentType: "application/json", json: success(created) });
      return;
    }
    await route.fulfill({ contentType: "application/json", json: success({
      items: chats.map((chat) => ({
        id: chat.id,
        title: chat.title,
        updatedAtMs: chat.updatedAtMs,
        chatCharacter: chat.chatCharacter,
      })),
      pageIndex: 0,
      pageSize: 20,
      totalItems: chats.length,
      totalPages: 1,
    }) });
  });
  await page.route(/\/api\/chats\/([^/?]+)$/, async (route) => {
    const id = route.request().url().split("/").pop()!;
    const chat = chats.find((item) => item.id === id);
    if (!chat) {
      await route.fulfill({ status: 404, contentType: "application/json", json: {
        code: "NOT_FOUND", msg: "i18n:errors.notFound", data: {},
      } });
      return;
    }
    if (route.request().method() === "DELETE") {
      chats = chats.filter((item) => item.id !== id);
      await route.fulfill({ contentType: "application/json", json: success({ ok: true }) });
      return;
    }
    if (route.request().method() === "PATCH") {
      const body = route.request().postDataJSON() as Partial<typeof chat>;
      Object.assign(chat, body, { updatedAtMs: chat.updatedAtMs + 1 });
    }
    await route.fulfill({ contentType: "application/json", json: success(chat) });
  });
  await page.route(/\/api\/characters(?:\?.*)?$/, async (route) => {
    await route.fulfill({ contentType: "application/json", json: success({
      items: [
        characterSummary("character_e2e", "Seraphina"),
        characterSummary("character_luna", "Luna"),
      ],
      pageIndex: 0,
      pageSize: 100,
      totalItems: 2,
      totalPages: 1,
    }) });
  });
}

function success(data: unknown) {
  return { code: "SUCCESS", msg: "ok", data };
}

function characterSummary(id: string, name: string) {
  return {
    id,
    ownerUserId: "user_e2e",
    visibility: "private",
    name,
    tags: [],
    version: "1.0",
    comment: "",
    createdAtMs: 1783090000000,
    updatedAtMs: 1783090000000,
    lastUsedAtMs: null,
    usageCount: 0,
    avatar: null,
  };
}

function chatDetail(id: string, title: string, characterId: string, characterName: string) {
  return {
    id,
    title,
    chatCharacterId: characterId,
    personaCharacterId: null,
    presetId: null,
    modelProviderId: null,
    createdAtMs: 1783090000000,
    updatedAtMs: 1783090000000,
    chatCharacter: { id: characterId, name: characterName, avatar: null },
    persona: null,
    preset: null,
    modelProvider: null,
  };
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
