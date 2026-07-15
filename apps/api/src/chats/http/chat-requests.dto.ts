import {
  createChatInputSchema,
  listChatsQuerySchema,
  updateChatInputSchema,
} from '@rolesta/shared';
import { createZodDto } from 'nestjs-zod';

export class CreateChatRequestDto extends createZodDto(createChatInputSchema) {}
export class UpdateChatRequestDto extends createZodDto(updateChatInputSchema) {}
export class ListChatsQueryDto extends createZodDto(listChatsQuerySchema) {}
