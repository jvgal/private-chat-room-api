# 🔒 Private Chat Room – Ephemeral Rooms with Unique Access Codes

A real-time private chat app where users can create and join chat rooms using a unique 6-digit code. When all users leave, the room self-destructs.

---

## ✨ Features

- 🔐 Private rooms with **6-digit access codes**
- 💬 Real-time messaging via **WebSockets**
- 🧨 Rooms **self-destruct** when empty
- ⚡ Built with performance and simplicity in mind
---

## 🧱 Tech Stack

| Layer       | Technology                          |
|------------|--------------------------------------|
| Backend     | **NestJS** with `@nestjs/websockets` |
| Real-Time   | **WebSockets** (Socket.io)           |
| Storage     | **Redis** (ephemeral room data)      |
| Auth (opt.) | JWT or anonymous login               |
| Deployment  | Docker + Railway / Fly.io / Render   |

---

## 📐 Architecture Overview

```mermaid
graph TD
  UI[Frontend UI (React/Next.js)] -->|Create Room / Join Room| API[NestJS Backend]
  API -->|Create Room| Redis[(Redis Store)]
  API -->|WebSocket Connect| WS[WebSocket Gateway]
  WS --> Redis
  WS -->|Broadcast Message| Clients[Connected Clients]
  WS -->|Disconnect| RoomManager[Check Room Members]
  RoomManager -->|If Empty| RedisCleanup[Delete Room]
