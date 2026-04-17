import type { Profile } from '../../domain/entities/Profile.js';
import type { UserRepository } from '../../domain/repositories/UserRepository.js';

export class ProfileService {
  constructor(private readonly userRepository: UserRepository) {}

  async updateProfile(userId: string, input: Partial<Profile>): Promise<Profile> {
    return this.userRepository.upsertProfile(userId, input);
  }

  async getProfile(userId: string): Promise<Profile | null> {
    return this.userRepository.getProfile(userId);
  }
}
