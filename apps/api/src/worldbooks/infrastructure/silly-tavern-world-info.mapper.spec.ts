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
      vectorized: false,
      selective: true,
      caseSensitive: false,
      matchWholeWords: false,
      insertionPosition: "beforeCharacterDefinition",
      selectiveLogic: "andAny",
      insertionRole: "system",
      scanDepth: 3,
      excludeRecursion: true,
      preventRecursion: false,
      delayUntilRecursion: false,
      insertionOrder: 0,
      depth: 4,
      probability: 100,
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
            vectorized: true,
            selective: true,
            caseSensitive: true,
            matchWholeWords: true,
            position: 2,
            role: 2,
            selectiveLogic: 3,
            order: 7,
            depth: 3,
            scanDepth: 6,
            excludeRecursion: true,
            preventRecursion: true,
            delayUntilRecursion: true,
            outletName: "gate-anchor",
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
      insertionPosition: "beforeAuthorsNote",
      insertionRole: "assistant",
      selectiveLogic: "andAll",
      vectorized: true,
      scanDepth: 6,
      excludeRecursion: true,
      preventRecursion: true,
      delayUntilRecursion: true,
      anchorName: "gate-anchor",
      insertionOrder: 7,
    });
    expect(worldbook.entries[0]).not.toHaveProperty("unsupported");
  });

  it("imports compatible extension fields", () => {
    const worldbook = fromSillyTavernWorldInfo(
      {
        entries: [
          {
            comment: "Anchor",
            content: "Anchored lore.",
            extensions: {
              position: 7,
              role: 1,
              selectiveLogic: 2,
              vectorized: true,
              scan_depth: 9,
              exclude_recursion: true,
              prevent_recursion: true,
              delay_until_recursion: true,
              outlet_name: "anchor-slot",
            },
          },
        ],
      },
      "anchors.json",
    );

    expect(worldbook.entries[0]).toMatchObject({
      insertionPosition: "atAnchor",
      insertionRole: "user",
      selectiveLogic: "notAny",
      vectorized: true,
      scanDepth: 9,
      excludeRecursion: true,
      preventRecursion: true,
      delayUntilRecursion: true,
      anchorName: "anchor-slot",
    });
  });

  it("rejects missing or malformed entries", () => {
    expect(() => fromSillyTavernWorldInfo({}, "book.json")).toThrow(
      new WorldbookApplicationError("invalid-worldbook"),
    );
    expect(() =>
      fromSillyTavernWorldInfo({ entries: [{ content: 42 }] }, "book.json"),
    ).toThrow(new WorldbookApplicationError("invalid-worldbook"));
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
          selective: false,
          constant: true,
          vectorized: true,
          caseSensitive: false,
          matchWholeWords: true,
          selectiveLogic: "notAll",
          insertionPosition: "atDepth",
          insertionOrder: 2,
          depth: 4,
          insertionRole: "assistant",
          anchorName: "slot",
          scanDepth: 8,
          excludeRecursion: true,
          preventRecursion: true,
          delayUntilRecursion: true,
          probability: 100,
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
      vectorized: true,
      matchWholeWords: true,
      position: 4,
      role: 2,
      selectiveLogic: 1,
      scanDepth: 8,
      excludeRecursion: true,
      preventRecursion: true,
      delayUntilRecursion: true,
      outletName: "slot",
    });
    expect(output).not.toHaveProperty("providerOnly");
  });
});
