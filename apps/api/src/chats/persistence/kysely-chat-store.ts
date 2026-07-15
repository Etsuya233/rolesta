import { Injectable } from "@nestjs/common";
import type { Database } from "@rolesta/db";
import { getTotalPages, type PageResponse } from "@rolesta/shared";
import type { SelectQueryBuilder } from "kysely";
import { KyselyDatabaseContext } from "../../database/kysely-database-context.js";
import type { Chat } from "../domain/chat.js";
import type {
  ChatCharacterSummary,
  ChatDetail,
  ChatListItem,
  ChatStore,
  ListChatsRequest,
} from "../ports/chat-store.js";
import {
  toChat,
  toChatRow,
  toChatUpdateRow,
  type ChatRow,
} from "./chat-row-mapper.js";

@Injectable()
export class KyselyChatStore implements ChatStore {
  constructor(private readonly context: KyselyDatabaseContext) {}

  async list(request: ListChatsRequest): Promise<PageResponse<ChatListItem>> {
    const countRow = await withListFilters(
      this.context.database.selectFrom("chats"),
      request,
    )
      .select((builder) => builder.fn.countAll<number>().as("count"))
      .executeTakeFirstOrThrow();
    const rows = await withListFilters(
      this.context.database.selectFrom("chats"),
      request,
    )
      .leftJoin(
        "characters as chat_character",
        "chat_character.id",
        "chats.chat_character_id",
      )
      .select([
        "chats.id",
        "chats.title",
        "chats.updated_at_ms",
        "chat_character.id as character_id",
        "chat_character.name as character_name",
        "chat_character.avatar_resource_id as character_avatar_resource_id",
      ])
      .orderBy(`chats.${sortColumns[request.sort]}`, request.direction)
      .orderBy("chats.id", "asc")
      .limit(request.pageSize)
      .offset(request.pageIndex * request.pageSize)
      .execute();
    const totalItems = Number(countRow.count);

    return {
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        updatedAtMs: Number(row.updated_at_ms),
        chatCharacter: characterSummary(
          row.character_id,
          row.character_name,
          row.character_avatar_resource_id,
        ),
      })),
      pageIndex: request.pageIndex,
      pageSize: request.pageSize,
      totalItems,
      totalPages: getTotalPages(totalItems, request.pageSize),
    };
  }

  async findOwnedDetail(
    id: string,
    ownerUserId: string,
  ): Promise<ChatDetail | null> {
    const row = await this.detailQuery()
      .where("chats.id", "=", id)
      .where("chats.owner_user_id", "=", ownerUserId)
      .executeTakeFirst();
    return row ? toChatDetail(row) : null;
  }

  async save(chat: Chat): Promise<ChatDetail> {
    await this.context.database
      .insertInto("chats")
      .values(toChatRow(chat))
      .execute();
    return this.requireOwnedDetail(chat.id, chat.ownerUserId);
  }

  async update(chat: Chat): Promise<ChatDetail> {
    await this.context.database
      .updateTable("chats")
      .set(toChatUpdateRow(chat))
      .where("id", "=", chat.id)
      .where("owner_user_id", "=", chat.ownerUserId)
      .execute();
    return this.requireOwnedDetail(chat.id, chat.ownerUserId);
  }

  async deleteOwned(id: string, ownerUserId: string): Promise<boolean> {
    const result = await this.context.database
      .deleteFrom("chats")
      .where("id", "=", id)
      .where("owner_user_id", "=", ownerUserId)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }

  async clearCharacterAssociations(
    characterId: string,
    exceptOwnerUserId?: string,
  ): Promise<void> {
    let chatCharacter = this.context.database
      .updateTable("chats")
      .set({ chat_character_id: null })
      .where("chat_character_id", "=", characterId);
    let persona = this.context.database
      .updateTable("chats")
      .set({ persona_character_id: null })
      .where("persona_character_id", "=", characterId);
    if (exceptOwnerUserId !== undefined) {
      chatCharacter = chatCharacter.where(
        "owner_user_id",
        "!=",
        exceptOwnerUserId,
      );
      persona = persona.where("owner_user_id", "!=", exceptOwnerUserId);
    }
    await chatCharacter.execute();
    await persona.execute();
  }

  async clearPresetAssociations(
    presetId: string,
    exceptOwnerUserId?: string,
  ): Promise<void> {
    let query = this.context.database
      .updateTable("chats")
      .set({ preset_id: null })
      .where("preset_id", "=", presetId);
    if (exceptOwnerUserId !== undefined) {
      query = query.where("owner_user_id", "!=", exceptOwnerUserId);
    }
    await query.execute();
  }

  async clearModelProviderAssociations(
    modelProviderId: string,
    ownerUserId: string,
  ): Promise<void> {
    await this.context.database
      .updateTable("chats")
      .set({ model_provider_id: null })
      .where("model_provider_id", "=", modelProviderId)
      .where("owner_user_id", "=", ownerUserId)
      .execute();
  }

  private detailQuery() {
    return this.context.database
      .selectFrom("chats")
      .leftJoin(
        "characters as chat_character",
        "chat_character.id",
        "chats.chat_character_id",
      )
      .leftJoin(
        "characters as persona",
        "persona.id",
        "chats.persona_character_id",
      )
      .leftJoin("presets", "presets.id", "chats.preset_id")
      .leftJoin(
        "model_provider_configs",
        "model_provider_configs.id",
        "chats.model_provider_id",
      )
      .selectAll("chats")
      .select([
        "chat_character.id as character_id",
        "chat_character.name as character_name",
        "chat_character.avatar_resource_id as character_avatar_resource_id",
        "persona.id as persona_id",
        "persona.name as persona_name",
        "persona.avatar_resource_id as persona_avatar_resource_id",
        "presets.id as preset_summary_id",
        "presets.name as preset_name",
        "model_provider_configs.id as model_provider_summary_id",
        "model_provider_configs.name as model_provider_name",
        "model_provider_configs.provider_kind",
        "model_provider_configs.default_model_name",
      ]);
  }

  private async requireOwnedDetail(
    id: string,
    ownerUserId: string,
  ): Promise<ChatDetail> {
    const row = await this.detailQuery()
      .where("chats.id", "=", id)
      .where("chats.owner_user_id", "=", ownerUserId)
      .executeTakeFirstOrThrow();
    return toChatDetail(row);
  }
}

type ChatSelectQuery = SelectQueryBuilder<
  Database,
  "chats",
  Record<string, never>
>;
type ChatDetailRow = ChatRow & {
  character_id: string | null;
  character_name: string | null;
  character_avatar_resource_id: string | null;
  persona_id: string | null;
  persona_name: string | null;
  persona_avatar_resource_id: string | null;
  preset_summary_id: string | null;
  preset_name: string | null;
  model_provider_summary_id: string | null;
  model_provider_name: string | null;
  provider_kind:
    | "openai-compatible"
    | "openai"
    | "claude"
    | "z-ai"
    | "deepseek"
    | null;
  default_model_name: string | null;
};

const sortColumns = {
  createdAt: "created_at_ms",
  updatedAt: "updated_at_ms",
  title: "title",
} as const;

function withListFilters(
  query: ChatSelectQuery,
  request: ListChatsRequest,
): ChatSelectQuery {
  let filtered = query.where("chats.owner_user_id", "=", request.ownerUserId);
  if (request.q.length > 0) {
    filtered = filtered.where("chats.title", "like", `%${request.q}%`);
  }
  if (request.role === "missing") {
    filtered = filtered.where("chats.chat_character_id", "is", null);
  } else if (request.role !== "all") {
    filtered = filtered.where("chats.chat_character_id", "=", request.role);
  }
  return filtered;
}

function characterSummary(
  id: string | null,
  name: string | null,
  avatarResourceId: string | null,
): ChatCharacterSummary | null {
  return id === null || name === null ? null : { id, name, avatarResourceId };
}

function toChatDetail(row: ChatDetailRow): ChatDetail {
  return {
    ...toChat(row),
    chatCharacter: characterSummary(
      row.character_id,
      row.character_name,
      row.character_avatar_resource_id,
    ),
    persona: characterSummary(
      row.persona_id,
      row.persona_name,
      row.persona_avatar_resource_id,
    ),
    preset:
      row.preset_summary_id === null || row.preset_name === null
        ? null
        : { id: row.preset_summary_id, name: row.preset_name },
    modelProvider:
      row.model_provider_summary_id === null ||
      row.model_provider_name === null ||
      row.provider_kind === null ||
      row.default_model_name === null
        ? null
        : {
            id: row.model_provider_summary_id,
            name: row.model_provider_name,
            providerKind: row.provider_kind,
            defaultModelName: row.default_model_name,
          },
  };
}
