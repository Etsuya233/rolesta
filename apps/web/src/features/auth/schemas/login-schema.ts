import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(255),
  password: z.string().min(12),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const setupAdminSchema = loginSchema;

export type SetupAdminFormValues = z.infer<typeof setupAdminSchema>;
