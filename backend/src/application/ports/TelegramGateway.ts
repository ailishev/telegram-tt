export interface TelegramProfile {
  telegramUserId: string;
  username: string | null;
  phone: string | null;
  avatarUrl: string | null;
  session: string;
}

export interface TelegramGateway {
  loginWithPhoneCode(phone: string, code: string): Promise<TelegramProfile>;
  fetchProfileByBotToken(telegramId: string): Promise<Pick<TelegramProfile, 'username' | 'avatarUrl'>>;
}
