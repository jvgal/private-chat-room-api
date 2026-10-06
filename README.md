# 🔒 Private Chat Room API

Real-time chat API built with **NestJS** and **Socket.io**. Users create private rooms identified by a **6-digit code**, share the code, and chat. Rooms **self-destruct** when the last member leaves — nothing persists beyond the conversation.

## ✨ Features

- Create a private room with a unique, randomly generated 6-digit code
- Join by code with a nickname (duplicated nicknames are rejected)
- Real-time messages broadcast to room members
- Member join/leave notifications
- **Self-destructing rooms**: the room and its messages are deleted when the last member leaves or disconnects
- Pluggable storage: **in-memory** by default, **Redis** when `REDIS_URL` is set (same interface, zero changes elsewhere)
- Payload validation with `class-validator`
- Unit + e2e tests, Docker, docker-compose and CI with GitHub Actions

## 🧱 Stack

| Layer | Tech |
| --- | --- |
| Framework | NestJS 11 |
| Transport | WebSockets (Socket.io) |
| Storage | In-memory / Redis (ioredis) |
| Validation | class-validator / class-transformer |
| Tests | Jest + Supertest |

## 🚀 Running

### With Docker (API + Redis)
```bash
docker compose up --build
```

### Local (in-memory storage)
```bash
npm ci
npm run start:dev
```

Server listens on `http://localhost:3000` (`PORT` to override). Health check at `GET /health`.

### Environment
| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | HTTP/WebSocket port |
| `REDIS_URL` | — | When set, rooms are stored in Redis (e.g. `redis://localhost:6379`) |

## 📡 WebSocket events

Connect with any Socket.io client on the server URL.

| Event (emit) | Payload | Reply event |
| --- | --- | --- |
| `createRoom` | `{ "name": "friends", "nickname": "joao" }` | `roomCreated` → room with `code` |
| `joinRoom` | `{ "code": "123456", "nickname": "maria" }` | `roomJoined` → room state |
| `sendMessage` | `{ "code": "123456", "content": "hi!" }` | `messageSent` |
| `leaveRoom` | `{ "code": "123456" }` | `roomLeft` |

| Event (listen) | Payload |
| --- | --- |
| `newMessage` | `{ author, content, sentAt }` |
| `memberJoined` | `{ nickname }` |
| `memberLeft` | `{ nickname }` |

**Quick test with [socket.io client](https://socket.io/docs/v4/client-api/):**
```js
const socket = io('http://localhost:3000');
socket.emit('createRoom', { name: 'friends', nickname: 'joao' }, console.log);
```

## 🧪 Tests

```bash
npm test        # unit
npm run test:e2e
```

CI runs lint, unit, e2e and a Docker build on every push and pull request.

## 🏗️ Layout

```
src/
  components/rooms/
    rooms.gateway.ts          # Socket.io events + disconnect cleanup
    rooms.service.ts          # business rules (join, leave, self-destruct)
    rooms.repository.ts       # storage contract
    in-memory-rooms.repository.ts
    redis-rooms.repository.ts
    dto/                      # validated payloads
    entities/room.entity.ts
  utils/code-generator.ts     # 6-digit code generation
```

---

**Author:** [João Vitor Galvão](https://www.linkedin.com/in/jvgalvao) — Full Stack Developer (Node.js · TypeScript · Go)
