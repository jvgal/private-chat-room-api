import { generateRoomCode, ROOM_CODE_LENGTH } from './code-generator';

describe('generateRoomCode', () => {
  it('generates a numeric code with the configured length', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      expect(code).toMatch(new RegExp(`^\\d{${ROOM_CODE_LENGTH}}$`));
    }
  });

  it('generates reasonably distinct codes', () => {
    const codes = new Set(Array.from({ length: 50 }, generateRoomCode));
    expect(codes.size).toBeGreaterThan(40);
  });
});
