import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { generateRoomCode } from '../../utils/code-generator';
import { ChatMessage, Room } from './entities/room.entity';
import { ROOMS_REPOSITORY, RoomsRepository } from './rooms.repository';

const MAX_CODE_ATTEMPTS = 10;

@Injectable()
export class RoomsService {
  constructor(
    @Inject(ROOMS_REPOSITORY) private readonly repository: RoomsRepository,
  ) {}

  /** Creates a room with a unique 6-digit code and joins the creator to it. */
  async create(
    name: string,
    clientId: string,
    nickname: string,
  ): Promise<Room> {
    const code = await this.generateUniqueCode();
    const room = new Room(code, name);
    room.members.push({ clientId, nickname });
    await this.repository.save(room);
    return room;
  }

  /** Adds a member to an existing room. */
  async join(code: string, clientId: string, nickname: string): Promise<Room> {
    const room = await this.getRoomOrFail(code);
    if (room.members.some((m) => m.clientId === clientId)) {
      return room;
    }
    if (room.members.some((m) => m.nickname === nickname)) {
      throw new ConflictException(
        `Nickname "${nickname}" is already taken in this room`,
      );
    }
    room.members.push({ clientId, nickname });
    await this.repository.save(room);
    return room;
  }

  /**
   * Removes a member from a room. Rooms self-destruct when the last
   * member leaves — returns the destroyed flag so the gateway can notify.
   */
  async leave(
    code: string,
    clientId: string,
  ): Promise<{ room: Room; left: string | null; destroyed: boolean }> {
    const room = await this.getRoomOrFail(code);
    const member = room.members.find((m) => m.clientId === clientId);
    room.members = room.members.filter((m) => m.clientId !== clientId);

    if (room.members.length === 0) {
      await this.repository.delete(code);
      return { room, left: member?.nickname ?? null, destroyed: true };
    }

    await this.repository.save(room);
    return { room, left: member?.nickname ?? null, destroyed: false };
  }

  /** Appends a message authored by a current member of the room. */
  async addMessage(
    code: string,
    clientId: string,
    content: string,
  ): Promise<ChatMessage> {
    const room = await this.getRoomOrFail(code);
    const member = room.members.find((m) => m.clientId === clientId);
    if (!member) {
      throw new NotFoundException('You are not a member of this room');
    }
    const message: ChatMessage = {
      author: member.nickname,
      content,
      sentAt: new Date().toISOString(),
    };
    room.messages.push(message);
    await this.repository.save(room);
    return message;
  }

  async getRoomOrFail(code: string): Promise<Room> {
    const room = await this.repository.findByCode(code);
    if (!room) {
      throw new NotFoundException(`Room ${code} not found`);
    }
    return room;
  }

  private async generateUniqueCode(): Promise<string> {
    for (let i = 0; i < MAX_CODE_ATTEMPTS; i++) {
      const code = generateRoomCode();
      if (!(await this.repository.exists(code))) {
        return code;
      }
    }
    throw new ConflictException('Could not allocate a unique room code');
  }
}
