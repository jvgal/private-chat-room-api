import { Room } from './entities/room.entity';

export const ROOMS_REPOSITORY = Symbol('ROOMS_REPOSITORY');

/**
 * Storage contract for rooms. The default implementation is in-memory;
 * a Redis implementation is used when REDIS_URL is set, keeping the
 * service and gateway unaware of where data lives.
 */
export interface RoomsRepository {
  save(room: Room): Promise<void>;
  findByCode(code: string): Promise<Room | null>;
  delete(code: string): Promise<void>;
  exists(code: string): Promise<boolean>;
}
