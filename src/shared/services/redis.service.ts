import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  private readonly client: Redis;

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      return this.client.set(key, value, 'EX', ttl);
    }
    return this.client.set(key, value);
  }

  async del(key: string) {
    return this.client.del(key);
  }

  async incr(key: string) {
    return this.client.incr(key);
  }

  async setLock(key: string, ttl: number): Promise<boolean> {
    const result = await this.client.setnx(key, '1');
    if (result === 1) {
      await this.client.expire(key, ttl);
      return true;
    }
    return false;
  }

  async releaseLock(key: string) {
    return this.client.del(key);
  }

  async flushDb() {
    return this.client.flushdb();
  }

  async keys(pattern: string) {
    return this.client.keys(pattern);
  }
}
