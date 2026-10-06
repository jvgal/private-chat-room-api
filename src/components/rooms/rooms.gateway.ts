import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { RoomsService } from './rooms.service';

@WebSocketGateway({ cors: { origin: true } })
@UsePipes(new ValidationPipe({ transform: true }))
export class RoomsGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomsGateway.name);

  /** Tracks which rooms each socket joined, for disconnect cleanup. */
  private readonly clientRooms = new Map<string, Set<string>>();

  constructor(private readonly roomsService: RoomsService) {}

  @SubscribeMessage('createRoom')
  async create(
    @MessageBody() dto: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.roomsService.create(
      dto.name,
      client.id,
      dto.nickname,
    );
    await client.join(room.code);
    this.track(client.id, room.code);
    this.logger.log(`Room ${room.code} created by ${dto.nickname}`);
    return { event: 'roomCreated', data: room };
  }

  @SubscribeMessage('joinRoom')
  async join(
    @MessageBody() dto: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.roomsService.join(
      dto.code,
      client.id,
      dto.nickname,
    );
    await client.join(room.code);
    this.track(client.id, room.code);
    client.to(room.code).emit('memberJoined', { nickname: dto.nickname });
    return { event: 'roomJoined', data: room };
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(
    @MessageBody() dto: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.roomsService.addMessage(
      dto.code,
      client.id,
      dto.content,
    );
    this.server.to(dto.code).emit('newMessage', message);
    return { event: 'messageSent', data: message };
  }

  @SubscribeMessage('leaveRoom')
  async leave(
    @MessageBody('code') code: string,
    @ConnectedSocket() client: Socket,
  ) {
    await this.leaveRoom(client, code);
    return { event: 'roomLeft', data: { code } };
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const codes = this.clientRooms.get(client.id);
    if (!codes) return;
    for (const code of codes) {
      await this.leaveRoom(client, code, true);
    }
    this.clientRooms.delete(client.id);
  }

  private async leaveRoom(
    client: Socket,
    code: string,
    disconnecting = false,
  ): Promise<void> {
    try {
      const { left, destroyed } = await this.roomsService.leave(
        code,
        client.id,
      );
      if (!disconnecting) {
        await client.leave(code);
      }
      if (destroyed) {
        this.logger.log(`Room ${code} destroyed (last member left)`);
      } else if (left) {
        client.to(code).emit('memberLeft', { nickname: left });
      }
      this.clientRooms.get(client.id)?.delete(code);
    } catch {
      // room already gone — nothing to clean up
    }
  }

  private track(clientId: string, code: string): void {
    if (!this.clientRooms.has(clientId)) {
      this.clientRooms.set(clientId, new Set());
    }
    this.clientRooms.get(clientId)!.add(code);
  }
}
