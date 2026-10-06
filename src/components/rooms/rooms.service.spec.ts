import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InMemoryRoomsRepository } from './in-memory-rooms.repository';
import { ROOMS_REPOSITORY } from './rooms.repository';
import { RoomsService } from './rooms.service';

describe('RoomsService', () => {
  let service: RoomsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: ROOMS_REPOSITORY, useClass: InMemoryRoomsRepository },
      ],
    }).compile();

    service = module.get(RoomsService);
  });

  it('creates a room with a 6-digit code and the creator as member', async () => {
    const room = await service.create('my room', 'client-1', 'joao');

    expect(room.code).toMatch(/^\d{6}$/);
    expect(room.name).toBe('my room');
    expect(room.members).toEqual([{ clientId: 'client-1', nickname: 'joao' }]);
  });

  it('lets another member join by code', async () => {
    const room = await service.create('my room', 'client-1', 'joao');
    const joined = await service.join(room.code, 'client-2', 'maria');

    expect(joined.members).toHaveLength(2);
  });

  it('is idempotent when the same client joins twice', async () => {
    const room = await service.create('my room', 'client-1', 'joao');
    await service.join(room.code, 'client-2', 'maria');
    const again = await service.join(room.code, 'client-2', 'maria');

    expect(again.members).toHaveLength(2);
  });

  it('rejects a duplicated nickname', async () => {
    const room = await service.create('my room', 'client-1', 'joao');

    await expect(
      service.join(room.code, 'client-2', 'joao'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects joining an unknown room', async () => {
    await expect(
      service.join('000000', 'client-1', 'joao'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('stores messages authored by members', async () => {
    const room = await service.create('my room', 'client-1', 'joao');
    const message = await service.addMessage(room.code, 'client-1', 'hello!');

    expect(message.author).toBe('joao');
    const stored = await service.getRoomOrFail(room.code);
    expect(stored.messages).toHaveLength(1);
  });

  it('rejects messages from non-members', async () => {
    const room = await service.create('my room', 'client-1', 'joao');

    await expect(
      service.addMessage(room.code, 'intruder', 'hi'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('keeps the room when a member leaves but others remain', async () => {
    const room = await service.create('my room', 'client-1', 'joao');
    await service.join(room.code, 'client-2', 'maria');

    const { destroyed, left } = await service.leave(room.code, 'client-2');

    expect(destroyed).toBe(false);
    expect(left).toBe('maria');
    await expect(service.getRoomOrFail(room.code)).resolves.toBeDefined();
  });

  it('self-destructs when the last member leaves', async () => {
    const room = await service.create('my room', 'client-1', 'joao');

    const { destroyed } = await service.leave(room.code, 'client-1');

    expect(destroyed).toBe(true);
    await expect(service.getRoomOrFail(room.code)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
