import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InMemoryRoomsRepository } from './in-memory-rooms.repository';
import { RedisRoomsRepository } from './redis-rooms.repository';
import { ROOMS_REPOSITORY } from './rooms.repository';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';

@Module({
  providers: [
    RoomsGateway,
    RoomsService,
    {
      provide: ROOMS_REPOSITORY,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        return redisUrl
          ? new RedisRoomsRepository(redisUrl)
          : new InMemoryRoomsRepository();
      },
    },
  ],
})
export class RoomsModule {}
