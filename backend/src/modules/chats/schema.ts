import { z } from 'zod';

export const createChatSchema = z.object({
  type: z.enum(['private', 'group', 'channel']),
  title: z.string().min(1).max(120).optional(),
  userIds: z.array(z.string().regex(/^[0-9]+$/)).min(1).max(100),
});

export const updateMembersSchema = z.object({
  userId: z.string().regex(/^[0-9]+$/),
  role: z.enum(['owner', 'admin', 'member']).optional(),
});
