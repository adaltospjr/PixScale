import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { CacheService } from '../../../domain/cache/cache-service.interface';

@Injectable()
export class RedisCacheService implements CacheService, OnModuleInit, OnModuleDestroy {
  private redisClient!: Redis;

  async onModuleInit() {
    const redisPort = Number(process.env.REDIS_PORT) || 6379;
    
    this.redisClient = new Redis({
      host: 'localhost',
      port: redisPort,
      maxRetriesPerRequest: 3,
    });

    console.log(`[PixScale] [Infra] Escudo do Redis conectado com sucesso na porta: ${redisPort}`);
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    // Salva a chave com um tempo de expiração (TTL) para não lotar a memória RAM do servidor para sempre
    await this.redisClient.set(key, value, 'EX', ttlSeconds);
  }
}
