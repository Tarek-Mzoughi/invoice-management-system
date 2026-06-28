import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { hashPassword } from 'src/shared/helpers/hash.utils';
import { UserRepository } from 'src/modules/user-management/repositories/user.repository';
import { UserService } from 'src/modules/user-management/services/user.service';
import { RoleService } from 'src/modules/user-management/services/role.service';
import { UserEntity } from 'src/modules/user-management/entities/user.entity';
import { AuthEmailNotVerifiedException } from '../errors/auth.email-not-verified.error';
import { AuthEmailService } from './auth-email.service';
import { AuthService } from './auth.service';

describe('AuthService email verification', () => {
  let service: AuthService;
  let user: UserEntity;
  let userRepository: jest.Mocked<UserRepository>;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    user = {
      id: 'user-1',
      username: 'unverified-user',
      email: 'unverified@example.com',
      password: await hashPassword('Password123!', 4),
      isActive: true,
      isApproved: true,
      emailVerified: null,
      emailVerificationTokenExpiresAt: new Date(Date.now() + 60_000),
      mustChangePassword: false,
    } as UserEntity;

    userRepository = {
      findOne: jest.fn().mockResolvedValue(user),
      update: jest.fn().mockImplementation(async (_id, values) => {
        Object.assign(user, values);
        return undefined as never;
      }),
    } as unknown as jest.Mocked<UserRepository>;
    userService = {
      findOneByUsernameOrEmail: jest.fn().mockImplementation(async () => user),
    } as unknown as jest.Mocked<UserService>;
    jwtService = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token'),
    } as unknown as jest.Mocked<JwtService>;

    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          'app.jwtSecret': 'access-secret',
          'app.jwtAccessTokenExpiration': '15m',
          'app.jwtRefreshTokenSecret': 'refresh-secret',
          'app.jwtRefreshTokenExpiration': '7d',
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    service = new AuthService(
      userRepository,
      userService,
      {} as RoleService,
      jwtService,
      configService,
      {} as AuthEmailService,
    );
  });

  it('rejects an unverified account without generating tokens', async () => {
    await expect(
      service.signin(user.email, 'Password123!'),
    ).rejects.toBeInstanceOf(AuthEmailNotVerifiedException);

    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('allows the same credentials after email verification', async () => {
    await service.verifyEmail('valid-verification-token');

    await expect(service.signin(user.email, 'Password123!')).resolves.toEqual(
      expect.objectContaining({
        user,
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      }),
    );
    expect(user.emailVerified).toBeInstanceOf(Date);
    expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
  });
});
