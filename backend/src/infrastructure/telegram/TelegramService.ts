import axios, { AxiosError } from 'axios';
import { Api, TelegramClient } from 'gramjs';
import { StringSession } from 'gramjs/sessions/index.js';

import type { TelegramGateway, TelegramProfile } from '../../application/ports/TelegramGateway.js';
import { env } from '../config/env.js';
import { logger } from '../logging/logger.js';

export class TelegramService implements TelegramGateway {
  private readonly client: TelegramClient;

  constructor() {
    this.client = new TelegramClient(
      new StringSession(''),
      Number(env.TELEGRAM_API_ID),
      env.TELEGRAM_API_HASH,
      { connectionRetries: 3 }
    );
  }

  async loginWithPhoneCode(phone: string, code: string): Promise<TelegramProfile> {
    await this.client.start({
      phoneNumber: async () => phone,
      phoneCode: async () => code,
      password: async () => '',
      onError: (error) => {
        throw error;
      }
    });

    const me = await this.withRetry(async () => this.client.getMe());
    const profilePhoto = me?.photo ? `tg://user?id=${me.id}` : null;

    return {
      telegramUserId: String(me?.id),
      username: me?.username ?? null,
      phone: me?.phone ?? null,
      avatarUrl: profilePhoto,
      session: this.client.session.save()
    };
  }

  async fetchProfileByBotToken(telegramId: string): Promise<Pick<TelegramProfile, 'username' | 'avatarUrl'>> {
    const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getChat`;

    try {
      const { data } = await this.withRetry(() => axios.get(url, { params: { chat_id: telegramId } }));
      if (!data.ok) {
        throw new Error(data.description ?? 'Bot API getChat failed');
      }

      return {
        username: data.result.username ?? null,
        avatarUrl: data.result.photo?.small_file_id ?? null
      };
    } catch (error) {
      logger.warn({ error, telegramId }, 'Bot API fallback failed');
      return { username: null, avatarUrl: null };
    }
  }

  async listenToUpdates(onMessage: (payload: { text: string; fromId: string }) => Promise<void>): Promise<void> {
    this.client.addEventHandler(async (event) => {
      if (!event.message?.message || !event.message.senderId) {
        return;
      }
      await onMessage({
        text: event.message.message,
        fromId: String(event.message.senderId)
      });
    }, new Api.UpdateNewMessage());
  }

  private async withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const retryable = error instanceof AxiosError || error instanceof Error;
        if (!retryable || attempt === maxAttempts) {
          throw error;
        }

        logger.warn({ attempt, error }, 'Telegram request failed, retrying');
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
      }
    }

    throw lastError;
  }
}
