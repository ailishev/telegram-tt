export interface Profile {
  id: string;
  userId: string;
  bio: string | null;
  avatarUrl: string | null;
  metadata: Record<string, unknown> | null;
  usernameOverride: string | null;
  avatarOverride: string | null;
  createdAt: Date;
  updatedAt: Date;
}
