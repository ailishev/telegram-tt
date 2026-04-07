import { CHANNEL_ID_BASE } from '../../config';
import { toJSNumber } from '../numbers';

export function isNumericPeerId(id: string) {
  return /^-?\d+$/.test(id);
}

export function isUserId(entityId: string) {
  return !entityId.startsWith('-');
}

export function isChannelId(entityId: string) {
  if (!isNumericPeerId(entityId)) {
    return false;
  }
  const n = BigInt(entityId);
  return n < -CHANNEL_ID_BASE;
}

export function toChannelId(mtpId: string) {
  if (!isNumericPeerId(mtpId)) {
    return String(-CHANNEL_ID_BASE - 1n);
  }
  const n = BigInt(mtpId);
  return String(-CHANNEL_ID_BASE - n);
}

export function getRawPeerId(id: string) {
  if (!isNumericPeerId(id)) {
    return 0n;
  }
  const n = BigInt(id);
  if (isUserId(id)) {
    return n;
  }

  if (isChannelId(id)) {
    return -n - CHANNEL_ID_BASE;
  }

  return n * -1n;
}

export function getPeerIdDividend(peerId: string) {
  return toJSNumber(getRawPeerId(peerId));
}
