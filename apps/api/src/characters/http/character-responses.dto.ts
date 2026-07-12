import { ApiProperty } from '@nestjs/swagger';
import type { PageResponse } from '@rolesta/shared';
import type { CharacterCard } from '../domain/character-card.js';
import {
  CHARACTER_VISIBILITIES,
  type CharacterVisibility,
} from '../domain/character-visibility.js';
import type { FileObject } from '../../files/domain/file-resource.js';

export class AvatarResourceResponseDto {
  @ApiProperty({ type: String })
  resourceId!: string;

  @ApiProperty({ type: Object, additionalProperties: { type: 'string' } })
  sources!: Record<string, string>;
}

export class CharacterSummaryResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  ownerUserId!: string;

  @ApiProperty({ enum: CHARACTER_VISIBILITIES })
  visibility!: CharacterVisibility;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty({ type: String })
  version!: string;

  @ApiProperty({ type: String })
  comment!: string;

  @ApiProperty({ type: Number })
  createdAtMs!: number;

  @ApiProperty({ type: Number })
  updatedAtMs!: number;

  @ApiProperty({ nullable: true, type: Number })
  lastUsedAtMs!: number | null;

  @ApiProperty({ type: Number })
  usageCount!: number;

  @ApiProperty({ nullable: true, type: () => AvatarResourceResponseDto })
  avatar!: AvatarResourceResponseDto | null;
}

export class CharacterDetailResponseDto extends CharacterSummaryResponseDto {
  @ApiProperty({ nullable: true, type: String })
  nickname!: string | null;

  @ApiProperty({ nullable: true, type: String })
  creator!: string | null;

  @ApiProperty({ type: String })
  description!: string;

  @ApiProperty({ type: String })
  personality!: string;

  @ApiProperty({ type: String })
  scenario!: string;

  @ApiProperty({ type: String })
  firstMessage!: string;

  @ApiProperty({ type: [String] })
  alternateGreetings!: string[];

  @ApiProperty({ type: [String] })
  groupOnlyGreetings!: string[];

  @ApiProperty({ type: String })
  messageExample!: string;

  @ApiProperty({ type: String })
  creatorNotes!: string;

  @ApiProperty({ type: Object })
  creatorNotesMultilingual!: Record<string, string>;

  @ApiProperty({ type: String })
  systemPrompt!: string;

  @ApiProperty({ type: String })
  postHistoryInstructions!: string;

  @ApiProperty({ nullable: true, type: Object })
  characterBook!: Record<string, unknown> | null;

  @ApiProperty({ type: [Object] })
  assets!: unknown[];

  @ApiProperty({ type: [String] })
  source!: string[];

  @ApiProperty({ type: Object })
  metadata!: Record<string, unknown>;

  @ApiProperty({ enum: ['sillytavern_v1', 'sillytavern_v2', 'sillytavern_v3'] })
  sourceFormat!: CharacterCard['sourceFormat'];

  @ApiProperty({ nullable: true, type: Number })
  creationDateMs!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  modificationDateMs!: number | null;
}

export class CharacterPageResponseDto {
  @ApiProperty({ type: () => [CharacterSummaryResponseDto] })
  items!: CharacterSummaryResponseDto[];

  @ApiProperty({ type: Number })
  pageIndex!: number;

  @ApiProperty({ type: Number })
  pageSize!: number;

  @ApiProperty({ type: Number })
  totalItems!: number;

  @ApiProperty({ type: Number })
  totalPages!: number;
}

export class CharacterImportPreviewResponseDto extends CharacterDetailResponseDto {}

export function toCharacterSummaryResponse(
  card: CharacterCard,
  avatar: AvatarResourceResponseDto | null = null,
): CharacterSummaryResponseDto {
  return {
    id: card.id,
    ownerUserId: card.ownerUserId,
    visibility: card.visibility,
    name: card.name,
    tags: card.tags,
    version: card.version,
    comment: card.comment,
    createdAtMs: card.createdAtMs,
    updatedAtMs: card.updatedAtMs,
    lastUsedAtMs: card.lastUsedAtMs,
    usageCount: card.usageCount,
    avatar,
  };
}

export function toCharacterDetailResponse(
  card: CharacterCard,
  avatar: AvatarResourceResponseDto | null = null,
): CharacterDetailResponseDto {
  return {
    ...toCharacterSummaryResponse(card, avatar),
    nickname: card.nickname,
    creator: card.creator,
    description: card.description,
    personality: card.personality,
    scenario: card.scenario,
    firstMessage: card.firstMessage,
    alternateGreetings: card.alternateGreetings,
    groupOnlyGreetings: card.groupOnlyGreetings,
    messageExample: card.messageExample,
    creatorNotes: card.creatorNotes,
    creatorNotesMultilingual: card.creatorNotesMultilingual,
    systemPrompt: card.systemPrompt,
    postHistoryInstructions: card.postHistoryInstructions,
    characterBook: card.characterBook,
    assets: card.assets,
    source: card.source,
    metadata: card.metadata,
    sourceFormat: card.sourceFormat,
    creationDateMs: card.creationDateMs,
    modificationDateMs: card.modificationDateMs,
  };
}

export function toCharacterPageResponse(
  page: PageResponse<CharacterCard>,
  avatars: Map<string, AvatarResourceResponseDto> = new Map(),
): CharacterPageResponseDto {
  return {
    items: page.items.map((item) => toCharacterSummaryResponse(item, avatars.get(item.id) ?? null)),
    pageIndex: page.pageIndex,
    pageSize: page.pageSize,
    totalItems: page.totalItems,
    totalPages: page.totalPages,
  };
}

export function avatarResponse(
  resourceId: string | null,
  objects: FileObject[] | undefined,
): AvatarResourceResponseDto | null {
  if (!resourceId || !objects) {
    return null;
  }

  const sources = Object.fromEntries(
    objects.map((object) => [object.role, `/api/files/${object.id}/content`]),
  );

  return Object.keys(sources).length > 0 ? { resourceId, sources } : null;
}
