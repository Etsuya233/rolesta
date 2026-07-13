export const USER_AVATAR_READER = Symbol('UserAvatarReader');

export interface UserAvatarReader {
  avatarResourceId(userId: string): Promise<string | null>;
}
