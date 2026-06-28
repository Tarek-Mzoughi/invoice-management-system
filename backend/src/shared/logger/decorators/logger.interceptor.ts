import { Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { tap } from 'rxjs';
import { LoggerService } from '../services/logger.service';
import { getTokenPayload } from 'src/shared/auth/utils/token-payload';
import { AdvancedRequest } from 'src/types';
import { EVENT_TYPE } from '../enums/event-type.enum';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly loggerService: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      tap(() => {
        const event = this.reflector.get<EVENT_TYPE>(
          'event',
          context.getHandler(),
        );

        if (!event) return;

        const request: AdvancedRequest = context.switchToHttp().getRequest();
        const { method, url, logInfo } = request;
        const userId = this.resolveUserId(event, request);

        void this.loggerService
          .save({
            event,
            logInfo,
            api: url,
            method,
            userId,
          })
          .catch((error: unknown) => {
            const trace = error instanceof Error ? error.stack : String(error);
            this.logger.error(
              `Unable to persist audit log for event "${event}"`,
              trace,
            );
          });
      }),
    );
  }

  private resolveUserId(
    event: EVENT_TYPE,
    request: AdvancedRequest,
  ): string | undefined {
    if (event === EVENT_TYPE.SIGNIN || event === EVENT_TYPE.REGISTER) {
      const authenticatedUserId = request.logInfo?.userId;
      return typeof authenticatedUserId === 'string'
        ? authenticatedUserId
        : undefined;
    }

    if (typeof request.user?.sub === 'string') {
      return request.user.sub;
    }

    const payload = getTokenPayload(request);
    return typeof payload?.sub === 'string' ? payload.sub : undefined;
  }
}
