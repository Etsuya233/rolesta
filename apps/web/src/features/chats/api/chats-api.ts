import { openApiClient, requestApi } from "../../../lib/api/client";
import type { components, operations } from "../../../lib/api/generated/schema";

export type ChatDetail = components["schemas"]["ChatDetailResponseDto"];
export type ChatListItem = components["schemas"]["ChatListItemResponseDto"];
export type ChatPage = components["schemas"]["ChatPageResponseDto"];
export type CreateChatValues = components["schemas"]["CreateChatRequestDto"];
export type UpdateChatValues = components["schemas"]["UpdateChatRequestDto"];
export type ListChatsQuery = NonNullable<
  operations["ChatsController_list"]["parameters"]["query"]
>;

export async function listChats(query: ListChatsQuery): Promise<ChatPage> {
  return requestApi(openApiClient.GET("/chats", { params: { query } })).then(
    (result) => result.data,
  );
}

export async function getChat(id: string): Promise<ChatDetail> {
  return requestApi(
    openApiClient.GET("/chats/{id}", { params: { path: { id } } }),
  ).then((result) => result.data);
}

export async function createChat(values: CreateChatValues): Promise<ChatDetail> {
  return requestApi(openApiClient.POST("/chats", { body: values })).then(
    (result) => result.data,
  );
}

export async function updateChat(
  id: string,
  values: UpdateChatValues,
): Promise<ChatDetail> {
  return requestApi(
    openApiClient.PATCH("/chats/{id}", {
      params: { path: { id } },
      body: values,
    }),
  ).then((result) => result.data);
}

export async function deleteChat(id: string): Promise<{ ok?: boolean }> {
  return requestApi(
    openApiClient.DELETE("/chats/{id}", { params: { path: { id } } }),
  ).then((result) => result.data);
}
