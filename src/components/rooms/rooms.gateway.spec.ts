/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';
import { InMemoryRoomsRepository } from './in-memory-rooms.repository';
import { ROOMS_REPOSITORY } from './rooms.repository';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';

function fakeSocket(id: string): Socket {
  return {
    id,
    join: jest.fn().mockResolvedValue(undefined),
    leave: jest.fn().mockResolvedValue(undefined),
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
  } as unknown as Socket;
}

describe('RoomsGateway', () => {
  let gateway: RoomsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsGateway,
        RoomsService,
        { provide: ROOMS_REPOSITORY, useClass: InMemoryRoomsRepository },
      ],
    }).compile();

    gateway = module.get(RoomsGateway);
    gateway.server = {
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    } as never;
  });

  it('creates a room and joins the socket to it', async () => {
    const client = fakeSocket('client-1');

    const result = await gateway.create(
      { name: 'room', nickname: 'joao' },
      client,
    );

    expect(result.event).toBe('roomCreated');
    expect(result.data.code).toMatch(/^\d{6}$/);
    expect(client.join).toHaveBeenCalledWith(result.data.code);
  });

  it('broadcasts messages to the room', async () => {
    const client = fakeSocket('client-1');
    const { data: room } = await gateway.create(
      { name: 'room', nickname: 'joao' },
      client,
    );

    const result = await gateway.sendMessage(
      { code: room.code, content: 'hello' },
      client,
    );

    expect(result.event).toBe('messageSent');
    expect(gateway.server.to).toHaveBeenCalledWith(room.code);
  });

  it('cleans up rooms when a client disconnects', async () => {
    const client = fakeSocket('client-1');
    const { data: room } = await gateway.create(
      { name: 'room', nickname: 'joao' },
      client,
    );

    await gateway.handleDisconnect(client);

    const service = (gateway as unknown as { roomsService: RoomsService })
      .roomsService;
    await expect(service.getRoomOrFail(room.code)).rejects.toThrow();
  });
});
