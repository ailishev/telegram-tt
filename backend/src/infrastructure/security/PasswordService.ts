import bcrypt from 'bcryptjs';

export class PasswordService {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, 12);
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
