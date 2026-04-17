import type { Profile } from '../entities/Profile.js';
import type { User } from '../entities/User.js';

export interface CreateUserInput {
  telegramId?: string;
  phone?: string;
  username: string;
  passwordHash?: string;
}

export interface UserRepository {
  findById(userId: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByTelegramId(telegramId: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  updateTelegramFields(userId: string, telegramId: string, username: string, phone?: string): Promise<User>;
  getProfile(userId: string): Promise<Profile | null>;
  upsertProfile(userId: string, profile: Partial<Profile>): Promise<Profile>;
}
