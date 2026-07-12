export const USER_AVATAR_STORE = Symbol('UserAvatarStore');

export interface UserAvatarStore {
  replaceAvatar(userId: string, avatarResourceId: string | null, now: string, nowMs: number): Promise<boolean>;
  avatarResourceId(userId: string): Promise<string | null>;
}
