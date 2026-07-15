import { ApiProperty } from '@nestjs/swagger';
import type { FileObject } from '../../files/domain/file-resource.js';
import type {
  ChatCharacterSummary,
  ChatDetail,
  ChatListItem,
  ChatModelProviderSummary,
} from '../ports/chat-store.js';

export class ChatAvatarResponseDto {
  @ApiProperty({ type: String })
  resourceId!: string;

  @ApiProperty({ type: Object, additionalProperties: { type: 'string' } })
  sources!: Record<string, string>;
}

export class ChatCharacterSummaryResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ nullable: true, type: () => ChatAvatarResponseDto })
  avatar!: ChatAvatarResponseDto | null;
}

export class ChatPresetSummaryResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  name!: string;
}

export class ChatModelProviderSummaryResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({
    enum: ['openai-compatible', 'openai', 'claude', 'z-ai', 'deepseek'],
  })
  providerKind!: ChatModelProviderSummary['providerKind'];

  @ApiProperty({ type: String })
  defaultModelName!: string;
}

export class ChatListItemResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  title!: string;

  @ApiProperty({ type: Number })
  updatedAtMs!: number;

  @ApiProperty({ nullable: true, type: () => ChatCharacterSummaryResponseDto })
  chatCharacter!: ChatCharacterSummaryResponseDto | null;
}

export class ChatPageResponseDto {
  @ApiProperty({ type: () => [ChatListItemResponseDto] })
  items!: ChatListItemResponseDto[];

  @ApiProperty({ type: Number })
  pageIndex!: number;

  @ApiProperty({ type: Number })
  pageSize!: number;

  @ApiProperty({ type: Number })
  totalItems!: number;

  @ApiProperty({ type: Number })
  totalPages!: number;
}

export class ChatDetailResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  title!: string;

  @ApiProperty({ nullable: true, type: String })
  chatCharacterId!: string | null;

  @ApiProperty({ nullable: true, type: String })
  personaCharacterId!: string | null;

  @ApiProperty({ nullable: true, type: String })
  presetId!: string | null;

  @ApiProperty({ nullable: true, type: String })
  modelProviderId!: string | null;

  @ApiProperty({ type: Number })
  createdAtMs!: number;

  @ApiProperty({ type: Number })
  updatedAtMs!: number;

  @ApiProperty({ nullable: true, type: () => ChatCharacterSummaryResponseDto })
  chatCharacter!: ChatCharacterSummaryResponseDto | null;

  @ApiProperty({ nullable: true, type: () => ChatCharacterSummaryResponseDto })
  persona!: ChatCharacterSummaryResponseDto | null;

  @ApiProperty({ nullable: true, type: () => ChatPresetSummaryResponseDto })
  preset!: ChatPresetSummaryResponseDto | null;

  @ApiProperty({
    nullable: true,
    type: () => ChatModelProviderSummaryResponseDto,
  })
  modelProvider!: ChatModelProviderSummaryResponseDto | null;
}

export function toChatListItemResponse(
  chat: ChatListItem,
  fileObjects: Map<string, FileObject[]>,
): ChatListItemResponseDto {
  return {
    id: chat.id,
    title: chat.title,
    updatedAtMs: chat.updatedAtMs,
    chatCharacter: toCharacterResponse(chat.chatCharacter, fileObjects),
  };
}

export function toChatDetailResponse(
  chat: ChatDetail,
  fileObjects: Map<string, FileObject[]>,
): ChatDetailResponseDto {
  return {
    id: chat.id,
    title: chat.title,
    chatCharacterId: chat.chatCharacterId,
    personaCharacterId: chat.personaCharacterId,
    presetId: chat.presetId,
    modelProviderId: chat.modelProviderId,
    createdAtMs: chat.createdAtMs,
    updatedAtMs: chat.updatedAtMs,
    chatCharacter: toCharacterResponse(chat.chatCharacter, fileObjects),
    persona: toCharacterResponse(chat.persona, fileObjects),
    preset: chat.preset,
    modelProvider: chat.modelProvider,
  };
}

function toCharacterResponse(
  character: ChatCharacterSummary | null,
  fileObjects: Map<string, FileObject[]>,
): ChatCharacterSummaryResponseDto | null {
  if (character === null) return null;
  return {
    id: character.id,
    name: character.name,
    avatar: toAvatarResponse(
      character.avatarResourceId,
      character.avatarResourceId === null ? undefined : fileObjects.get(character.avatarResourceId),
    ),
  };
}

function toAvatarResponse(
  resourceId: string | null,
  objects: FileObject[] | undefined,
): ChatAvatarResponseDto | null {
  if (resourceId === null || objects === undefined) return null;
  const sources = Object.fromEntries(
    objects.map((object) => [object.role, `/api/files/${object.id}/content`]),
  );
  return Object.keys(sources).length === 0 ? null : { resourceId, sources };
}
