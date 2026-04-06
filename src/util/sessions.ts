import type { ApiSessionData } from '../api/types';
import type { DcId, SharedSessionData } from '../types';

import {
  DC_IDS,
  DEBUG, IS_SCREEN_LOCKED_CACHE_KEY,
  SESSION_ACCOUNT_PREFIX,
  SESSION_LEGACY_USER_KEY,
} from '../config';
import { ACCOUNT_SLOT, storeAccountData, writeSlotSession } from './multiaccount';

const safeStorage: Storage = typeof globalThis !== 'undefined' && 'localStorage' in globalThis
  ? globalThis.localStorage
  : {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
    clear: () => undefined,
    key: () => null,
    length: 0,
  };

export function hasStoredSession() {
  if (checkSessionLocked()) {
    return true;
  }

  const slotData = loadSlotSession(ACCOUNT_SLOT);
  if (slotData) return Boolean(slotData.dcId);

  if (!ACCOUNT_SLOT) {
    const legacyAuthJson = safeStorage.getItem(SESSION_LEGACY_USER_KEY);
    if (legacyAuthJson) {
      try {
        const userAuth = JSON.parse(legacyAuthJson);
        return Boolean(userAuth && userAuth.id && userAuth.dcID);
      } catch (err) {
        // Do nothing.
        return false;
      }
    }
  }

  return false;
}

export function storeSession(sessionData: ApiSessionData) {
  const {
    mainDcId, keys, isTest,
  } = sessionData;

  const currentSlotData = loadSlotSession(ACCOUNT_SLOT);
  const newSlotData: SharedSessionData = {
    ...currentSlotData,
    dcId: mainDcId,
    isTest,
  };

  Object.keys(keys).map(Number).forEach((dcId) => {
    newSlotData[`dc${dcId as DcId}_auth_key`] = keys[dcId];
  });

  if (!ACCOUNT_SLOT) {
    storeLegacySession(sessionData, currentSlotData?.userId);
  }

  writeSlotSession(ACCOUNT_SLOT, newSlotData);
}

function storeLegacySession(sessionData: ApiSessionData, currentUserId?: string) {
  const {
    mainDcId, keys, isTest,
  } = sessionData;

  safeStorage.setItem(SESSION_LEGACY_USER_KEY, JSON.stringify({
    dcID: mainDcId,
    id: currentUserId,
    test: isTest,
  }));
  safeStorage.setItem('dc', String(mainDcId));
  Object.keys(keys).map(Number).forEach((dcId) => {
    safeStorage.setItem(`dc${dcId}_auth_key`, JSON.stringify(keys[dcId]));
  });
}

export function clearStoredSession(slot?: number) {
  if (!slot) {
    clearStoredLegacySession();
  }

  safeStorage.removeItem(`${SESSION_ACCOUNT_PREFIX}${slot || 1}`);
}

function clearStoredLegacySession() {
  [
    SESSION_LEGACY_USER_KEY,
    'dc',
    ...DC_IDS.map((dcId) => `dc${dcId}_auth_key`),
    ...DC_IDS.map((dcId) => `dc${dcId}_hash`),
    ...DC_IDS.map((dcId) => `dc${dcId}_server_salt`),
  ].forEach((key) => {
    safeStorage.removeItem(key);
  });
}

export function loadStoredSession(): ApiSessionData | undefined {
  if (!hasStoredSession()) {
    return undefined;
  }

  const slotData = loadSlotSession(ACCOUNT_SLOT);

  if (!slotData) {
    if (ACCOUNT_SLOT) return undefined;
    return loadStoredLegacySession();
  }

  const sessionData: ApiSessionData = {
    mainDcId: slotData.dcId,
    keys: DC_IDS.reduce((acc, dcId) => {
      const key = slotData[`dc${dcId}_auth_key` as const];
      if (key) {
        acc[dcId] = key;
      }
      return acc;
    }, {} as Record<number, string>),
    isTest: slotData.isTest || undefined,
  };

  return sessionData;
}

function loadStoredLegacySession(): ApiSessionData | undefined {
  if (!hasStoredSession()) {
    return undefined;
  }

  const userAuth = JSON.parse(safeStorage.getItem(SESSION_LEGACY_USER_KEY) || 'null');
  if (!userAuth) {
    return undefined;
  }
  const mainDcId = Number(userAuth.dcID);
  const isTest = userAuth.test;
  const keys: Record<number, string> = {};

  DC_IDS.forEach((dcId) => {
    try {
      const key = safeStorage.getItem(`dc${dcId}_auth_key`);
      if (key) {
        keys[dcId] = JSON.parse(key);
      }
    } catch (err) {
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load stored session', err);
      }
      // Do nothing.
    }
  });

  if (!Object.keys(keys).length) return undefined;

  return {
    mainDcId,
    keys,
    isTest,
  };
}

export function loadSlotSession(slot: number | undefined): SharedSessionData | undefined {
  try {
    const data = JSON.parse(safeStorage.getItem(`${SESSION_ACCOUNT_PREFIX}${slot || 1}`) || '{}') as SharedSessionData;
    if (!data.dcId) return undefined;
    return data;
  } catch (e) {
    return undefined;
  }
}

export function updateSessionUserId(currentUserId: string) {
  const slotData = loadSlotSession(ACCOUNT_SLOT);
  if (!slotData) return;
  storeAccountData(ACCOUNT_SLOT, { userId: currentUserId });
}

export function importTestSession() {
  const sessionJson = process.env.TEST_SESSION!;
  try {
    const sessionData = JSON.parse(sessionJson) as ApiSessionData & { userId: string };
    storeLegacySession(sessionData, sessionData.userId);
  } catch (err) {
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load test session', err);
    }
  }
}

export function checkSessionLocked() {
  return safeStorage.getItem(IS_SCREEN_LOCKED_CACHE_KEY) === 'true';
}
