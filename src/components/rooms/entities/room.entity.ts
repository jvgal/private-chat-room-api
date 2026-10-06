export interface ChatMessage {
  author: string;
  content: string;
  sentAt: string;
}

export interface RoomMember {
  clientId: string;
  nickname: string;
}

export class Room {
  code: string;
  name: string;
  createdAt: string;
  members: RoomMember[];
  messages: ChatMessage[];

  constructor(code: string, name: string) {
    this.code = code;
    this.name = name;
    this.createdAt = new Date().toISOString();
    this.members = [];
    this.messages = [];
  }
}
