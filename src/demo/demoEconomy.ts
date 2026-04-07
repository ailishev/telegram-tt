import type { ApiSavedStarGift, ApiStarGiftRegular, ApiTypeCurrencyAmount } from '../api/types';

import { STARS_CURRENCY_CODE } from '../config';
import { safeStorage } from '../util/browser/safeStorage';

const BALANCE_KEY = 'demo.stars.balance';
const GIFTS_KEY = 'demo.stars.gifts';

const INITIAL_STARS = 5000;

const DEMO_GIFTS: ApiStarGiftRegular[] = [
  {
    type: 'starGift',
    id: 'demo-gift-1',
    title: 'Golden Duck',
    stars: 250,
    starsToConvert: 200,
    sticker: {
      id: '1',
      isCustomEmoji: true,
      emoji: '🦆',
      isLottie: false,
      isWebm: false,
      width: 512,
      height: 512,
      setInfo: { id: '0', accessHash: '0', title: 'Demo Gifts', shortName: 'demo_gifts', count: 1, hash: 0 },
    } as any,
  },
  {
    type: 'starGift',
    id: 'demo-gift-2',
    title: 'Ruby Star',
    stars: 600,
    starsToConvert: 450,
    sticker: {
      id: '2',
      isCustomEmoji: true,
      emoji: '⭐',
      isLottie: false,
      isWebm: false,
      width: 512,
      height: 512,
      setInfo: { id: '0', accessHash: '0', title: 'Demo Gifts', shortName: 'demo_gifts', count: 1, hash: 0 },
    } as any,
  },
];

function readBalance() {
  const value = Number(safeStorage.getItem(BALANCE_KEY));
  return Number.isFinite(value) ? value : INITIAL_STARS;
}

function writeBalance(value: number) {
  safeStorage.setItem(BALANCE_KEY, String(Math.max(0, value)));
}

function readPurchasedGifts(): ApiSavedStarGift[] {
  const raw = safeStorage.getItem(GIFTS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as ApiSavedStarGift[];
  } catch {
    return [];
  }
}

function writePurchasedGifts(gifts: ApiSavedStarGift[]) {
  safeStorage.setItem(GIFTS_KEY, JSON.stringify(gifts));
}

export function getDemoStarGifts() {
  return DEMO_GIFTS;
}

export function getDemoStarsBalance(): ApiTypeCurrencyAmount {
  return {
    currency: STARS_CURRENCY_CODE,
    amount: readBalance(),
    nanos: 0,
  };
}

export function getDemoPurchasedGifts() {
  return readPurchasedGifts();
}

export function syncDemoPurchasedGiftsFromBackend(
  gifts: Array<{ id: string; title?: string; acquiredAt?: string | Date }>,
) {
  if (!gifts?.length) return;

  const current = readPurchasedGifts();
  const existingIds = new Set(current.map((gift) => String(gift.savedId)));

  const normalized = gifts
    .filter((gift) => !existingIds.has(gift.id))
    .map((gift) => {
      const giftType: ApiStarGiftRegular = {
        type: 'starGift',
        id: `backend-gift-${gift.id}`,
        title: gift.title || 'Подарок',
        stars: 0,
        starsToConvert: 0,
        sticker: {
          id: `backend-sticker-${gift.id}`,
          isCustomEmoji: true,
          emoji: '🎁',
          isLottie: false,
          isWebm: false,
          width: 512,
          height: 512,
          setInfo: {
            id: '0',
            accessHash: '0',
            title: 'Backend Gifts',
            shortName: 'backend_gifts',
            count: 1,
            hash: 0,
          },
        } as any,
      };

      const acquiredAt = gift.acquiredAt ? new Date(gift.acquiredAt).getTime() : Date.now();
      const date = Number.isFinite(acquiredAt) ? Math.floor(acquiredAt / 1000) : Math.floor(Date.now() / 1000);

      return {
        date,
        gift: giftType,
        savedId: gift.id,
        message: {
          text: 'Backend gift',
          entities: [],
        },
      } as ApiSavedStarGift;
    });

  if (!normalized.length) return;
  writePurchasedGifts([...normalized, ...current]);
}

export function buyDemoGift(giftId: string) {
  const gift = DEMO_GIFTS.find((item) => item.id === giftId);
  if (!gift) return false;

  const currentBalance = readBalance();
  if (currentBalance < gift.stars) {
    return false;
  }

  writeBalance(currentBalance - gift.stars);

  const purchased = readPurchasedGifts();
  purchased.unshift({
    date: Math.floor(Date.now() / 1000),
    gift,
    savedId: String(Date.now()),
    message: {
      text: 'Demo purchase',
      entities: [],
    },
  } as ApiSavedStarGift);

  writePurchasedGifts(purchased);

  return true;
}

export function resetDemoEconomy() {
  safeStorage.removeItem(BALANCE_KEY);
  safeStorage.removeItem(GIFTS_KEY);
}
