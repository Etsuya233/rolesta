import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBody, ApiParam, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../../auth/http/auth.guard.js";
import type { AuthenticatedRequest } from "../../auth/http/authenticated-request.js";
import { GetPublicFileObjectsUseCase } from "../../files/application/get-public-file-objects.use-case.js";
import { ApiEnvelopeOkResponse } from "../../openapi/api-envelope-response.decorator.js";
import { ChatApplicationError } from "../application/chat-application-error.js";
import { CreateChatUseCase } from "../application/create-chat.use-case.js";
import { DeleteChatUseCase } from "../application/delete-chat.use-case.js";
import { GetChatUseCase } from "../application/get-chat.use-case.js";
import { ListChatsUseCase } from "../application/list-chats.use-case.js";
import { UpdateChatUseCase } from "../application/update-chat.use-case.js";
import type { ChatCharacterSummary, ChatDetail } from "../ports/chat-store.js";
import { toChatApiFailure } from "./chat-application-error.mapper.js";
import {
  CreateChatRequestDto,
  ListChatsQueryDto,
  UpdateChatRequestDto,
} from "./chat-requests.dto.js";
import {
  ChatDetailResponseDto,
  ChatPageResponseDto,
  toChatDetailResponse,
  toChatListItemResponse,
} from "./chat-responses.dto.js";

@ApiTags("chats")
@UseGuards(AuthGuard)
@Controller("chats")
export class ChatsController {
  constructor(
    private readonly createChat: CreateChatUseCase,
    private readonly listChats: ListChatsUseCase,
    private readonly getChat: GetChatUseCase,
    private readonly updateChat: UpdateChatUseCase,
    private readonly deleteChat: DeleteChatUseCase,
    private readonly publicFiles: GetPublicFileObjectsUseCase,
  ) {}

  @Post()
  @ApiBody({ type: CreateChatRequestDto })
  @ApiEnvelopeOkResponse({ type: ChatDetailResponseDto })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateChatRequestDto,
  ): Promise<ChatDetailResponseDto> {
    return this.withErrors(async () =>
      this.detailResponse(
        await this.createChat.execute({
          ownerUserId: request.authUser.id,
          ...body,
        }),
      ),
    );
  }

  @Get()
  @ApiEnvelopeOkResponse({ type: ChatPageResponseDto })
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListChatsQueryDto,
  ): Promise<ChatPageResponseDto> {
    const page = await this.listChats.execute({
      ownerUserId: request.authUser.id,
      ...query,
    });
    const files = await this.publicFiles.execute(
      avatarResourceIds(page.items.map((item) => item.chatCharacter)),
    );
    return {
      ...page,
      items: page.items.map((item) => toChatListItemResponse(item, files)),
    };
  }

  @Get(":id")
  @ApiParam({ name: "id", type: String })
  @ApiEnvelopeOkResponse({ type: ChatDetailResponseDto })
  async get(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
  ): Promise<ChatDetailResponseDto> {
    return this.withErrors(async () =>
      this.detailResponse(await this.getChat.execute(id, request.authUser.id)),
    );
  }

  @Patch(":id")
  @ApiParam({ name: "id", type: String })
  @ApiBody({ type: UpdateChatRequestDto })
  @ApiEnvelopeOkResponse({ type: ChatDetailResponseDto })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: UpdateChatRequestDto,
  ): Promise<ChatDetailResponseDto> {
    return this.withErrors(async () =>
      this.detailResponse(
        await this.updateChat.execute({
          id,
          ownerUserId: request.authUser.id,
          ...body,
        }),
      ),
    );
  }

  @Delete(":id")
  @ApiParam({ name: "id", type: String })
  @ApiEnvelopeOkResponse({
    schema: { type: "object", properties: { ok: { type: "boolean" } } },
  })
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
  ): Promise<{ ok: true }> {
    return this.withErrors(async () => {
      await this.deleteChat.execute(id, request.authUser.id);
      return { ok: true };
    });
  }

  private async detailResponse(
    chat: ChatDetail,
  ): Promise<ChatDetailResponseDto> {
    const files = await this.publicFiles.execute(
      avatarResourceIds([chat.chatCharacter, chat.persona]),
    );
    return toChatDetailResponse(chat, files);
  }

  private async withErrors<TResult>(
    operation: () => Promise<TResult>,
  ): Promise<TResult> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ChatApplicationError) throw toChatApiFailure(error);
      throw error;
    }
  }
}

function avatarResourceIds(
  characters: Array<ChatCharacterSummary | null>,
): string[] {
  return Array.from(
    new Set(
      characters.flatMap((character) => character?.avatarResourceId ?? []),
    ),
  );
}
