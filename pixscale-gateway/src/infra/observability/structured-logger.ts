import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StructuredLogger {
  private readonly logger = new Logger('PixScale');

  log(event: string, context: Record<string, unknown> = {}) {
    this.logger.log(JSON.stringify({ event, ...context }));
  }

  error(event: string, error: unknown, context: Record<string, unknown> = {}) {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(JSON.stringify({ event, error: message, ...context }));
  }
}
