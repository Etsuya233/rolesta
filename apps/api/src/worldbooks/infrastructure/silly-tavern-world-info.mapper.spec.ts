import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { WorldbookApplicationError } from "../application/worldbook-application-error.js";
import type { Worldbook } from "../domain/worldbook.js";
import {
  fromSillyTavernWorldInfo,
  toSillyTavernWorldInfo,
} from "./silly-tavern-world-info.mapper.js";

describe("SillyTavern world info mapper", () => {
  it("imports object entries from the sample worldbook", () => {
    const input = JSON.parse(
      readFileSync(resolve(process.cwd(), "../../tmp/世界书.json"), "utf8"),
    ) as unknown;
    const worldbook = fromSillyTavernWorldInfo(input, "世界书.json");

    expect(worldbook.name).toBe("世界书");
    expect(worldbook.entries).toHaveLength(10);
    expect(worldbook.sourceSnapshot).toBe(input);
    expect(worldbook.entries[0]).toMatchObject({
      enabled: true,
      name: "山下長久",
      primaryKeys: [
        "長久",
        "山下",
        "友達",
        "幼馴染",
        "朋友",
        "发小",
        "长久",
        "阿长",
        "なちゃん",
      ],
      secondaryKeys: [],
      constant: true,
      selective: true,
      conditionLogic: "andAny",
      caseSensitive: "disabled",
      matchWholeWords: "disabled",
      insertionPosition: "beforeCharacterDefinition",
      insertionOrder: 100,
      displayOrder: 0,
      insertionDepth: 4,
      probability: 100,
      scanDepth: 3,
      recursiveScan: false,
      groupWeight: 100,
      useGroupScoring: "inherit",
    });
    expect(worldbook.entries[0]?.tokenCount).toBeGreaterThan(0);
  });

  it("imports array entries and core editable fields", () => {
    const worldbook = fromSillyTavernWorldInfo(
      {
        name: "Array book",
        description: "Lore",
        tags: ["setting"],
        scanDepth: 5,
        tokenBudget: 800,
        recursiveScan: true,
        entries: [
          {
            name: "Gate",
            comment: "Gate comment",
            content: "A silver gate.",
            key: ["gate"],
            keysecondary: ["silver"],
            disable: true,
            constant: true,
            selective: true,
            caseSensitive: true,
            matchWholeWords: true,
            position: 2,
            order: 7,
            displayIndex: 3,
            depth: 3,
            probability: 40,
            unsupported: "snapshot only",
          },
        ],
      },
      "ignored.json",
    );

    expect(worldbook).toMatchObject({
      name: "Array book",
      description: "Lore",
      tags: ["setting"],
      scanDepth: 5,
      tokenBudget: 800,
      recursiveScan: true,
    });
    expect(worldbook.entries[0]).toMatchObject({
      enabled: false,
      name: "Gate",
      comment: "Gate comment",
      primaryKeys: ["gate"],
      secondaryKeys: ["silver"],
      insertionPosition: "beforeAuthorNote",
      insertionOrder: 7,
      displayOrder: 3,
      caseSensitive: "enabled",
      matchWholeWords: "enabled",
    });
    expect(worldbook.entries[0]).not.toHaveProperty("unsupported");
  });

  it("rejects missing or malformed entries", () => {
    expect(() => fromSillyTavernWorldInfo({}, "book.json")).toThrow(
      new WorldbookApplicationError("invalid-worldbook"),
    );
    expect(() =>
      fromSillyTavernWorldInfo({ entries: [{ content: 42 }] }, "book.json"),
    ).toThrow(new WorldbookApplicationError("invalid-worldbook"));
  });

  it("round-trips extended SillyTavern entry fields", () => {
    const imported = fromSillyTavernWorldInfo(
      {
        name: "Extended",
        entries: {
          "0": {
            uid: 9,
            addMemo: false,
            automationId: "quick-reply",
            caseSensitive: null,
            characterFilter: {
              isExclude: true,
              names: ["Alice"],
              tags: ["tag-1"],
            },
            comment: "Depth",
            content: "Depth lore",
            cooldown: 2,
            delay: 3,
            delayUntilRecursion: 4,
            depth: 6,
            disable: false,
            displayIndex: 5,
            excludeRecursion: true,
            group: "lore",
            groupOverride: true,
            groupWeight: 20,
            ignoreBudget: true,
            key: ["depth"],
            keysecondary: ["role"],
            matchCharacterDepthPrompt: true,
            matchCharacterDescription: true,
            matchCharacterPersonality: true,
            matchCreatorNotes: true,
            matchPersonaDescription: true,
            matchScenario: true,
            matchWholeWords: false,
            order: 12,
            outletName: "memory",
            position: 4,
            preventRecursion: true,
            probability: 75,
            role: 1,
            scanDepth: null,
            selective: true,
            selectiveLogic: 2,
            sticky: 1,
            triggers: ["normal", "regenerate"],
            useGroupScoring: true,
            useProbability: false,
            vectorized: true,
          },
        },
      },
      "extended.json",
    );

    expect(imported.entries[0]).toMatchObject({
      externalUid: 9,
      addMemo: false,
      automationId: "quick-reply",
      caseSensitive: "inherit",
      characterFilter: {
        isExclude: true,
        names: ["Alice"],
        tags: ["tag-1"],
      },
      conditionLogic: "notAny",
      cooldown: 2,
      delay: 3,
      delayUntilRecursion: true,
      recursionDelayLevel: 4,
      depthRole: "user",
      displayOrder: 5,
      insertionOrder: 12,
      insertionPosition: "atDepth",
      recursiveScan: false,
      useGroupScoring: "enabled",
      useProbability: false,
      vectorized: true,
    });

    const worldbook: Worldbook = {
      id: "book-1",
      ownerUserId: "owner",
      visibility: "private",
      name: imported.name,
      description: imported.description,
      tags: imported.tags,
      scanDepth: imported.scanDepth,
      tokenBudget: imported.tokenBudget,
      recursiveScan: imported.recursiveScan,
      sourceFormat: "sillytavern_world_info",
      sourceSnapshot: imported.sourceSnapshot,
      createdAtMs: 1,
      updatedAtMs: 1,
      lastUsedAtMs: null,
      usageCount: 0,
      entries: [
        {
          ...imported.entries[0]!,
          id: "entry-1",
          worldbookId: "book-1",
          createdAtMs: 1,
          updatedAtMs: 1,
        },
      ],
    };

    expect(toSillyTavernWorldInfo(worldbook).entries["0"]).toMatchObject({
      uid: 9,
      addMemo: false,
      automationId: "quick-reply",
      caseSensitive: null,
      characterFilter: {
        isExclude: true,
        names: ["Alice"],
        tags: ["tag-1"],
      },
      delayUntilRecursion: 4,
      displayIndex: 5,
      excludeRecursion: true,
      position: 4,
      role: 1,
      selectiveLogic: 2,
      triggers: ["normal", "regenerate"],
      useGroupScoring: true,
    });
  });

  it("exports SillyTavern compatible core fields without source snapshot merging", () => {
    const worldbook: Worldbook = {
      id: "book-1",
      ownerUserId: "owner",
      visibility: "private",
      name: "Exported",
      description: "",
      tags: [],
      scanDepth: 3,
      tokenBudget: 1024,
      recursiveScan: false,
      sourceFormat: "sillytavern_world_info",
      sourceSnapshot: { providerOnly: true },
      createdAtMs: 1,
      updatedAtMs: 1,
      lastUsedAtMs: null,
      usageCount: 0,
      entries: [
        {
          id: "entry-1",
          worldbookId: "book-1",
          enabled: true,
          name: "Main",
          comment: "Main comment",
          content: "Lore",
          primaryKeys: ["lore"],
          secondaryKeys: [],
          externalUid: 12,
          selective: false,
          constant: true,
          addMemo: true,
          conditionLogic: "andAll",
          vectorized: false,
          caseSensitive: "disabled",
          matchWholeWords: "enabled",
          insertionPosition: "afterCharacterDefinition",
          depthRole: "system",
          insertionDepth: 4,
          insertionOrder: 2,
          displayOrder: 0,
          useProbability: true,
          probability: 100,
          scanDepth: null,
          recursiveScan: true,
          preventFurtherRecursion: false,
          delayUntilRecursion: false,
          recursionDelayLevel: null,
          ignoreBudget: false,
          group: "",
          groupOverride: false,
          groupWeight: 100,
          useGroupScoring: "inherit",
          sticky: 0,
          cooldown: 0,
          delay: 0,
          matchPersonaDescription: false,
          matchCharacterDescription: false,
          matchCharacterPersonality: false,
          matchScenario: false,
          matchCreatorNotes: false,
          matchCharacterDepthPrompt: false,
          automationId: "",
          generationTriggers: [],
          outletName: "",
          characterFilter: { isExclude: false, names: [], tags: [] },
          tokenCount: 1,
          createdAtMs: 1,
          updatedAtMs: 1,
        },
      ],
    };

    const output = toSillyTavernWorldInfo(worldbook);

    expect(output.name).toBe("Exported");
    expect(output.entries["0"]).toMatchObject({
      key: ["lore"],
      comment: "Main comment",
      disable: false,
      constant: true,
      matchWholeWords: true,
      position: 1,
      uid: 12,
      selectiveLogic: 3,
    });
    expect(output).not.toHaveProperty("providerOnly");
  });
});
