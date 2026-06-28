import { Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import { EVENT_TYPE } from '../enums/event-type.enum';
import { LoggerService } from '../services/logger.service';
import { LogInterceptor } from './logger.interceptor';

const buildContext = (request: Record<string, unknown>) =>
  ({
    getHandler: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as any;

describe('LogInterceptor', () => {
  let reflector: jest.Mocked<Pick<Reflector, 'get'>>;
  let loggerService: jest.Mocked<Pick<LoggerService, 'save'>>;
  let interceptor: LogInterceptor;

  beforeEach(() => {
    reflector = {
      get: jest.fn(),
    };
    loggerService = {
      save: jest.fn().mockResolvedValue({}),
    };
    interceptor = new LogInterceptor(
      reflector as unknown as Reflector,
      loggerService as unknown as LoggerService,
    );
  });

  it.each([EVENT_TYPE.REGISTER, EVENT_TYPE.SIGNIN])(
    'uses the operation result user for %s instead of a stale token',
    async (event) => {
      reflector.get.mockReturnValue(event);
      const staleToken = [
        'header',
        Buffer.from(JSON.stringify({ sub: 'stale-user-id' })).toString(
          'base64url',
        ),
        'signature',
      ].join('.');
      const context = buildContext({
        method: 'POST',
        url: `/auth/${event}`,
        headers: { authorization: `Bearer ${staleToken}` },
        logInfo: { userId: 'current-user-id', fullname: 'Tarek Mzoughi' },
      });

      await lastValueFrom(
        interceptor.intercept(context, { handle: () => of({}) }),
      );

      expect(loggerService.save).toHaveBeenCalledWith(
        expect.objectContaining({ event, userId: 'current-user-id' }),
      );
    },
  );

  it('uses the validated request user for authenticated events', async () => {
    reflector.get.mockReturnValue(EVENT_TYPE.USER_UPDATED);
    const context = buildContext({
      method: 'PATCH',
      url: '/users/current',
      headers: {},
      user: { sub: 'authenticated-user-id', email: 'user@example.com' },
    });

    await lastValueFrom(
      interceptor.intercept(context, { handle: () => of({}) }),
    );

    expect(loggerService.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'authenticated-user-id' }),
    );
  });

  it('does not fail the request when audit persistence fails', async () => {
    reflector.get.mockReturnValue(EVENT_TYPE.REGISTER);
    loggerService.save.mockRejectedValue(new Error('database unavailable'));
    const loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const context = buildContext({
      method: 'POST',
      url: '/auth/register',
      headers: {},
      logInfo: { userId: 'current-user-id' },
    });

    await expect(
      lastValueFrom(interceptor.intercept(context, { handle: () => of({}) })),
    ).resolves.toEqual({});
    await new Promise((resolve) => setImmediate(resolve));

    expect(loggerError).toHaveBeenCalled();
    loggerError.mockRestore();
  });
});
