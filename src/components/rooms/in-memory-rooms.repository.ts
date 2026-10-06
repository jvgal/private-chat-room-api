import { Injectable } from '@nestjs/common';
import { Room } from './entities/room.entity';
import { RoomsRepository } from './rooms.repository';

@Injectable()
export class InMemoryRoomsRepository implements RoomsRepository {
  private readonly rooms = new Map<string, Room>();

  save(room: Room): Promise<void> {
    this.rooms.set(room.code, room);
    return Promise.resolve();
  }

  findByCode(code: string): Promise<Room | null> {
    return Promise.resolve(this.rooms.get(code) ?? null);
  }

  delete(code: string): Promise<void> {
    this.rooms.delete(code);
    return Promise.resolve();
  }

  exists(code: string): Promise<boolean> {
    return Promise.resolve(this.rooms.has(code));
  }
}
