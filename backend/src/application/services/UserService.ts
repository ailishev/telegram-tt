import { randomUUID } from 'node:crypto';

import type { User } from '../../domain/entities/User.js';
import type { UserRepository } from '../../domain/repositories/UserRepository.js';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getMe(userId: string): Promise<{ user: User; profile: Awaited<ReturnType<UserRepository['getProfile']>> }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const profile = await this.userRepository.getProfile(userId);
    return { user, profile };
  }

  async createLocalUser(username: string, passwordHash: string): Promise<User> {
    return this.userRepository.create({ username: `${username}-${randomUUID().slice(0, 6)}`, passwordHash });
  }
}
