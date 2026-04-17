export interface User {
  id: string;
  telegramId: string | null;
  phone: string | null;
  username: string;
  passwordHash: string | null;
  createdAt: Date;
}
