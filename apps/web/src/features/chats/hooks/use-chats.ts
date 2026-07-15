import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createChat,
  deleteChat,
  getChat,
  listChats,
  updateChat,
  type CreateChatValues,
  type ListChatsQuery,
  type UpdateChatValues,
} from '../api/chats-api';

export const chatKeys = {
  all: ['chats'] as const,
  lists: ['chats', 'list'] as const,
  list: (query: ListChatsQuery) => ['chats', 'list', query] as const,
  detail: (id: string) => ['chats', 'detail', id] as const,
};

export function useChats(query: ListChatsQuery) {
  return useQuery({ queryKey: chatKeys.list(query), queryFn: () => listChats(query) });
}

export function useChat(id: string | null) {
  return useQuery({
    queryKey: chatKeys.detail(id ?? ''),
    queryFn: () => getChat(id!),
    enabled: id !== null,
  });
}

export function useCreateChat() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateChatValues) => createChat(values),
    async onSuccess(chat) {
      cache.setQueryData(chatKeys.detail(chat.id), chat);
      await cache.invalidateQueries({ queryKey: chatKeys.lists });
    },
  });
}

export function useUpdateChat() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateChatValues }) =>
      updateChat(id, values),
    async onSuccess(chat) {
      cache.setQueryData(chatKeys.detail(chat.id), chat);
      await cache.invalidateQueries({ queryKey: chatKeys.lists });
    },
  });
}

export function useDeleteChat() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: deleteChat,
    async onSuccess(_result, id) {
      cache.removeQueries({ queryKey: chatKeys.detail(id) });
      await cache.invalidateQueries({ queryKey: chatKeys.lists });
    },
  });
}
