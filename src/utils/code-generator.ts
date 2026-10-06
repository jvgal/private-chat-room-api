import { randomInt } from 'crypto';

export const ROOM_CODE_LENGTH = 6;

/** Generates a random numeric room code with 6 digits (zero-padded). */
export function generateRoomCode(): string {
  return randomInt(0, 10 ** ROOM_CODE_LENGTH)
    .toString()
    .padStart(ROOM_CODE_LENGTH, '0');
}
