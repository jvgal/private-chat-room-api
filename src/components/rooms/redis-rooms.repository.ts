import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { Room } from './entities/room.entity';
import { RoomsRepository } from './rooms.repository';

const ROOM_TTL_SECONDS = 60 * 60 * 24; // rooms expire after 24h as a safety net

@Injectable()
export class RedisRoomsRepository implements RoomsRepository, OnModuleDestroy {
  private readonly redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  private key(code: string): string {
    return `room:${code}`;
  }

  async save(room: Room): Promise<void> {
    await this.redis.set(
      this.key(room.code),
      JSON.stringify(room),
      'EX',
      ROOM_TTL_SECONDS,
    );
  }

  async findByCode(code: string): Promise<Room | null> {
    const raw = await this.redis.get(this.key(code));
    if (!raw) return null;
    return Object.assign(new Room('', ''), JSON.parse(raw) as Room);
  }

  async delete(code: string): Promise<void> {
    await this.redis.del(this.key(code));
  }

  async exists(code: string): Promise<boolean> {
    return (await this.redis.exists(this.key(code))) === 1;
  }

  onModuleDestroy(): void {
    this.redis.disconnect();
  }
}
