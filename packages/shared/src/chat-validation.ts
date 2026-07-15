import { z } from 'zod';
import { VALIDATION_RULES } from './validation.js';

export const CHAT_ROLE_FILTERS = ['all', 'missing'] as const;
export const CHAT_SORT_KEYS = ['createdAt', 'updatedAt', 'title'] as const;
export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export const CHAT_PAGE_SIZES = [10, 20, 50, 100] as const;

const requiredStringError = (issue: { input?: unknown }) =>
  issue.input === undefined ? VALIDATION_RULES.REQUIRED : VALIDATION_RULES.INVALID_TYPE;

const idSchema = z.string({ error: requiredStringError }).min(1, {
  error: VALIDATION_RULES.REQUIRED,
});

export const chatTitleSchema = z
  .string({ error: requiredStringError })
  .trim()
  .min(1, { error: VALIDATION_RULES.REQUIRED })
  .max(512, { error: VALIDATION_RULES.MAX_LENGTH });

export const createChatInputSchema = z
  .strictObject({
    title: chatTitleSchema,
    chatCharacterId: idSchema,
    personaCharacterId: idSchema.nullable().optional(),
    presetId: idSchema.nullable().optional(),
    modelProviderId: idSchema.nullable().optional(),
  })
  .meta({ id: 'CreateChatRequest' });

export const updateChatInputSchema = z
  .strictObject({
    title: chatTitleSchema.optional(),
    chatCharacterId: idSchema.optional(),
    personaCharacterId: idSchema.nullable().optional(),
    presetId: idSchema.nullable().optional(),
    modelProviderId: idSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    path: [],
    error: VALIDATION_RULES.AT_LEAST_ONE,
  })
  .meta({ id: 'UpdateChatRequest', minProperties: 1 });

const roleFilterSchema = z.union([
  z.enum(CHAT_ROLE_FILTERS, { error: VALIDATION_RULES.INVALID_ENUM }),
  idSchema,
]);

const integerQuerySchema = z.coerce
  .number({ error: VALIDATION_RULES.INVALID_TYPE })
  .int({ error: VALIDATION_RULES.INTEGER });

export const listChatsQuerySchema = z
  .strictObject({
    q: z
      .string({ error: VALIDATION_RULES.INVALID_TYPE })
      .trim()
      .max(512, {
        error: VALIDATION_RULES.MAX_LENGTH,
      })
      .default(''),
    role: roleFilterSchema.default('all'),
    sort: z.enum(CHAT_SORT_KEYS, { error: VALIDATION_RULES.INVALID_ENUM }).default('updatedAt'),
    direction: z.enum(SORT_DIRECTIONS, { error: VALIDATION_RULES.INVALID_ENUM }).default('desc'),
    pageIndex: integerQuerySchema.min(0, { error: VALIDATION_RULES.MINIMUM }).default(0),
    pageSize: integerQuerySchema
      .refine((value) => CHAT_PAGE_SIZES.includes(value as (typeof CHAT_PAGE_SIZES)[number]), {
        error: VALIDATION_RULES.INVALID_ENUM,
      })
      .meta({ enum: [...CHAT_PAGE_SIZES] })
      .default(20),
  })
  .meta({ id: 'ListChatsQuery' });

export type CreateChatInput = z.infer<typeof createChatInputSchema>;
export type UpdateChatInput = z.infer<typeof updateChatInputSchema>;
export type ListChatsQuery = z.infer<typeof listChatsQuerySchema>;
export type ChatSortKey = (typeof CHAT_SORT_KEYS)[number];
export type SortDirection = (typeof SORT_DIRECTIONS)[number];
