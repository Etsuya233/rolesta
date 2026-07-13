export const USER_AVATAR_ASSIGNMENT = Symbol('UserAvatarAssignment');

export interface UserAvatarAssignment {
  replace(input: { userId: string; resourceId: string; nowMs: number }): Promise<boolean>;
  remove(input: { userId: string; nowMs: number }): Promise<boolean>;
}
