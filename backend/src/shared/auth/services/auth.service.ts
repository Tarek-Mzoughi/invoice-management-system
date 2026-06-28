import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { UserService } from 'src/modules/user-management/services/user.service';
import { ResponseSigninDto } from '../dtos/web/response-signin.dto';
import { OAuth2Client } from 'google-auth-library';
import { ResponseUserDto } from 'src/modules/user-management/dtos/user/response-user.dto';
import {
  GithubEmail,
  GithubUserResponse,
} from '../interfaces/github.interface';
import { OAuthProvider } from '../enums/oauth.enum';
import { UserRepository } from 'src/modules/user-management/repositories/user.repository';
import { RequestResetTokenDto } from '../dtos/web/request-reset-token.dto';
import { ResponseResetTokenDto } from '../dtos/web/response-reset-token.dto';
import { ResponseCheckResetTokenDto } from '../dtos/web/response-check-reset-token.dto';
import { RequestCheckResetTokenDto } from '../dtos/web/request-check-reset-token.dto';
import { AuthNotActiveException } from 'src/shared/auth/errors/auth.notactive.error';
import { UserAlreadyExistsException } from 'src/modules/user-management/errors/user/user.alreadyexists.error';
import { comparePasswords, hashPassword } from 'src/shared/helpers/hash.utils';
import { RequestRegisterDto } from '../dtos/web/request-register.dto';
import { RequestResetPasswordDto } from '../dtos/web/request-reset-password.dto';
import { RoleService } from 'src/modules/user-management/services/role.service';
import { Transactional } from '@nestjs-cls/transactional';
import { UserEntity } from 'src/modules/user-management/entities/user.entity';
import { AuthEmailService } from './auth-email.service';
import { AuthEmailNotVerifiedException } from '../errors/auth.email-not-verified.error';

interface OneTimeToken {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

interface VerificationTokenPayload {
  token: string;
  expiresIn: string;
}

interface RegistrationResult {
  user: UserEntity;
  verificationToken: VerificationTokenPayload;
}

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private userService: UserService,
    private roleService: RoleService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authEmailService: AuthEmailService,
  ) {}

  private async generateTokens(id: string, email: string) {
    const payload = { sub: id, email: email };

    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('app.jwtSecret'),
      expiresIn: this.configService.get('app.jwtAccessTokenExpiration'),
    });

    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('app.jwtRefreshTokenSecret'),
      expiresIn: this.configService.get('app.jwtRefreshTokenExpiration'),
    });

    return { access_token, refresh_token };
  }

  private createOneTimeToken(expirationMinutes: number): OneTimeToken {
    const token = randomBytes(32).toString('base64url');
    return {
      token,
      tokenHash: this.hashOneTimeToken(token),
      expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000),
    };
  }

  private hashOneTimeToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getExpirationMinutes(path: string, fallback: number): number {
    const value = this.configService.get<number>(path);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private formatExpiration(minutes: number): string {
    if (minutes % 60 === 0) {
      const hours = minutes / 60;
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }

    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }

  private isExpired(expiresAt?: Date | null): boolean {
    return !expiresAt || new Date(expiresAt).getTime() <= Date.now();
  }

  private genericPasswordResetResponse(): ResponseResetTokenDto {
    return {
      success: true,
      message: 'If an account exists, a password reset link has been sent.',
    };
  }

  private async createVerificationTokenForUser(
    user: UserEntity,
  ): Promise<VerificationTokenPayload> {
    const expirationMinutes = this.getExpirationMinutes(
      'app.emailVerification.expirationMinutes',
      30,
    );
    const oneTimeToken = this.createOneTimeToken(expirationMinutes);

    await this.userRepository.update(user.id, {
      emailVerificationTokenHash: oneTimeToken.tokenHash,
      emailVerificationTokenExpiresAt: oneTimeToken.expiresAt,
    });

    return {
      token: oneTimeToken.token,
      expiresIn: this.formatExpiration(expirationMinutes),
    };
  }

  private queueVerificationEmail(
    user: UserEntity,
    verificationToken: VerificationTokenPayload,
    context: string,
  ): void {
    void this.authEmailService
      .sendVerificationEmail({
        user,
        token: verificationToken.token,
        expiresIn: verificationToken.expiresIn,
      })
      .catch((error) => {
        console.error(`Failed to send verification email (${context}):`, error);
      });
  }

  async register(registerDto: RequestRegisterDto): Promise<UserEntity> {
    const { user, verificationToken } =
      await this.createRegistrationWithVerificationToken(registerDto);

    this.queueVerificationEmail(user, verificationToken, 'register');

    return user;
  }

  @Transactional()
  async createRegistrationWithVerificationToken(
    registerDto: RequestRegisterDto,
  ): Promise<RegistrationResult> {
    const username = registerDto.username?.trim();
    const email = registerDto.email.trim();
    const userByUsername = username
      ? await this.userService.findOneByUsername(username)
      : null;
    const userByEmail = await this.userService.findOneByEmail(email);

    if (userByUsername || userByEmail) throw new UserAlreadyExistsException();

    const adminRole = await this.roleService.findOneByLabel('admin');

    if (!adminRole?.id) {
      throw new InternalServerErrorException('Admin role is not configured');
    }

    const profile = {
      phone: registerDto.phone?.trim() || undefined,
      cin: registerDto.cin?.trim() || undefined,
      bio: registerDto.bio?.trim() || undefined,
      gender: registerDto.gender,
      isPrivate: registerDto.isPrivate,
      pictureId: registerDto.profilePictureId,
    };
    const hasProfile = Object.values(profile).some(
      (value) => value !== undefined && value !== null,
    );

    const createdUser = await this.userService.saveWithProfile({
      firstName: registerDto.firstName?.trim(),
      lastName: registerDto.lastName?.trim(),
      dateOfBirth: registerDto.dateOfBirth
        ? new Date(registerDto.dateOfBirth)
        : undefined,
      username,
      email,
      password: registerDto.password,
      isActive: true,
      isApproved: true,
      roleId: adminRole.id,
      profile: hasProfile ? profile : undefined,
    });

    const user = await this.userService.findOneById(createdUser.id);
    const verificationToken = await this.createVerificationTokenForUser(user);

    return { user, verificationToken };
  }

  async signin(
    usernameOrEmail: string,
    password: string,
  ): Promise<ResponseSigninDto> {
    const user =
      await this.userService.findOneByUsernameOrEmail(usernameOrEmail);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new AuthNotActiveException();
    }

    if (!user.isApproved) {
      throw new UnauthorizedException('User not approved');
    }

    if (!user.emailVerified) {
      throw new AuthEmailNotVerifiedException();
    }

    const { access_token, refresh_token } = await this.generateTokens(
      user.id,
      user.email,
    );

    return {
      user,
      access_token,
      refresh_token,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async refreshToken(refreshToken: string): Promise<ResponseSigninDto> {
    try {
      const payload: { sub: string; email: string } =
        await this.jwtService.verifyAsync(refreshToken, {
          secret: this.configService.get('app.jwtRefreshTokenSecret'),
        });

      const user = await this.userService.findOneById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User does not exist');
      }

      if (!user.emailVerified) {
        throw new AuthEmailNotVerifiedException();
      }

      const { access_token, refresh_token } = await this.generateTokens(
        user.id,
        user.email,
      );

      return {
        user,
        access_token,
        refresh_token,
        mustChangePassword: user.mustChangePassword,
      };
    } catch (error) {
      throw new UnauthorizedException(
        `Invalid or expired refresh token ${error}`,
      );
    }
  }

  async handleOAuth(
    provider: OAuthProvider,
    idToken: string,
  ): Promise<{
    user: ResponseUserDto;
    access_token: string;
    refresh_token: string;
  }> {
    let email: string | undefined | null;
    let username: string | undefined;
    let providerEmailVerified = false;

    if (provider == OAuthProvider.GOOGLE) {
      const client = new OAuth2Client(process.env.GOOGLE_ID);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_ID,
      });
      const payload = ticket.getPayload();
      email = payload?.email;
      username = payload?.name || payload?.email?.split('@')[0];
      providerEmailVerified = payload?.email_verified === true;
    } else if (provider == OAuthProvider.GITHUB) {
      const userResponse: GithubUserResponse = await fetch(
        'https://api.github.com/user',
        { headers: { Authorization: `Bearer ${idToken}` } },
      ).then((res) => res.json());

      username = userResponse.login;
      const emails: GithubEmail[] = await fetch(
        'https://api.github.com/user/emails',
        { headers: { Authorization: `Bearer ${idToken}` } },
      ).then((res) => res.json());

      const primaryVerified = emails.find((e) => e.primary && e.verified);
      const publicVerified = emails.find(
        (e) => e.email === userResponse.email && e.verified,
      );
      email = primaryVerified?.email || publicVerified?.email;
      providerEmailVerified = Boolean(email);
    } else {
      throw new UnauthorizedException('Unsupported OAuth provider');
    }

    if (!email || !username) {
      throw new UnauthorizedException(
        'Could not retrieve valid email or username from provider',
      );
    }

    let user = await this.userService.findOneByEmail(email);

    if (user && !user.emailVerified && providerEmailVerified) {
      user =
        (await this.userRepository.update(user.id, {
          emailVerified: new Date(),
        })) || user;
    }

    if (!user) {
      user = await this.userService.save({
        email,
        username,
        emailVerified: providerEmailVerified ? new Date() : null,
        isApproved: false,
      });
    }

    if (!user.emailVerified) {
      const verificationToken = await this.createVerificationTokenForUser(user);
      this.queueVerificationEmail(user, verificationToken, 'oauth');
      throw new AuthEmailNotVerifiedException();
    }

    const { access_token, refresh_token } = await this.generateTokens(
      user.id,
      user.email,
    );

    return { user, access_token, refresh_token };
  }

  async requestResetToken(
    requestResetTokenDto: RequestResetTokenDto,
  ): Promise<ResponseResetTokenDto> {
    const user = await this.userService.findOneByUsernameOrEmail(
      requestResetTokenDto.usernameOrEmail.trim(),
    );

    if (!user) {
      return this.genericPasswordResetResponse();
    }

    try {
      const expirationMinutes = this.getExpirationMinutes(
        'app.passwordReset.expirationMinutes',
        15,
      );
      const oneTimeToken = this.createOneTimeToken(expirationMinutes);

      await this.userRepository.update(user.id, {
        passwordResetTokenHash: oneTimeToken.tokenHash,
        passwordResetTokenExpiresAt: oneTimeToken.expiresAt,
      });

      await this.authEmailService.sendResetPasswordEmail({
        user,
        token: oneTimeToken.token,
        expiresIn: this.formatExpiration(expirationMinutes),
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
    }

    return this.genericPasswordResetResponse();
  }

  async checkRestTokenValidity(
    requestCheckResetTokenDto: RequestCheckResetTokenDto,
  ): Promise<ResponseCheckResetTokenDto> {
    const tokenHash = this.hashOneTimeToken(requestCheckResetTokenDto.token);
    const user = await this.userRepository.findOne({
      where: { passwordResetTokenHash: tokenHash },
    });

    if (!user || this.isExpired(user.passwordResetTokenExpiresAt)) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    return { token: requestCheckResetTokenDto.token, valid: true };
  }

  async resetPassword(
    resetPasswordDto: RequestResetPasswordDto,
  ): Promise<{ message: string }> {
    const tokenHash = this.hashOneTimeToken(resetPasswordDto.token);
    const user = await this.userRepository.findOne({
      where: { passwordResetTokenHash: tokenHash },
    });

    if (!user || this.isExpired(user.passwordResetTokenExpiresAt)) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(resetPasswordDto.password);
    await this.userRepository.update(user.id, {
      password: hashedPassword,
      passwordResetTokenHash: null,
      passwordResetTokenExpiresAt: null,
    });

    return { message: 'Password has been reset successfully' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const tokenHash = this.hashOneTimeToken(token);
    const user = await this.userRepository.findOne({
      where: { emailVerificationTokenHash: tokenHash },
    });

    if (!user || this.isExpired(user.emailVerificationTokenExpiresAt)) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    await this.userRepository.update(user.id, {
      emailVerified: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null,
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(
    usernameOrEmail: string,
  ): Promise<{ message: string }> {
    const user = await this.userService.findOneByUsernameOrEmail(
      usernameOrEmail.trim(),
    );

    if (user && !user.emailVerified) {
      try {
        const verificationToken =
          await this.createVerificationTokenForUser(user);
        this.queueVerificationEmail(user, verificationToken, 'resend');
      } catch (error) {
        console.error('Error sending verification email:', error);
      }
    }

    return {
      message:
        'If an account exists and requires verification, a verification email has been sent.',
    };
  }
}
