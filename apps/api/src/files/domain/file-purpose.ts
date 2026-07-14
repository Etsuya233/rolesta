export const FILE_PURPOSES = ['character-avatar', 'user-avatar'] as const;

export type FilePurpose = (typeof FILE_PURPOSES)[number];
