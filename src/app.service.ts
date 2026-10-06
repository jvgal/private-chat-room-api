import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health(): { status: string; uptime: number } {
    return { status: 'ok', uptime: process.uptime() };
  }
}
