import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Core } from 'src/app/interface/core.interface';
import { StoreIDs } from 'src/app/enums/store.enum';
import { UserEntity } from 'src/modules/user-management/entities/user.entity';
import { identifyUser } from 'src/modules/user-management/utils/identify-user';
import { EmailVerificationTemplateProps } from 'src/assets/templates/email-verification/type';
import { ForgetPasswordTemplateProps } from 'src/assets/templates/forget-password/type';
import { TemporaryPasswordTemplateProps } from 'src/assets/templates/temporary-password/type';
import { MailService } from 'src/shared/mail/services/mail.service';
import { GenericStore } from 'src/shared/store/interfaces/generic-store.interface';
import { StoreService } from 'src/shared/store/services/store.service';

type AuthEmailTemplateName = 'email-verification' | 'forget-password';

interface AuthEmailOptions {
  user: UserEntity;
  token: string;
  expiresIn: string;
}

@Injectable()
export class AuthEmailService {
  private readonly logger = new Logger(AuthEmailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly storeService: StoreService,
  ) {}

  async sendVerificationEmail({
    user,
    token,
    expiresIn,
  }: AuthEmailOptions): Promise<void> {
    const url = this.buildWebAppUrl('/verify-email', token);
    await this.sendAuthTemplate<EmailVerificationTemplateProps>({
      user,
      subject: 'Verify Your Email Address',
      templateName: 'email-verification',
      title: 'Verify your email address',
      actionLabel: 'Verify Email',
      body: 'Thank you for registering. Please verify your email address to activate your account.',
      url,
      expiresIn,
    });
  }

  async sendResetPasswordEmail({
    user,
    token,
    expiresIn,
  }: AuthEmailOptions): Promise<void> {
    const url = this.buildWebAppUrl('/reset-password', token);
    await this.sendAuthTemplate<ForgetPasswordTemplateProps>({
      user,
      subject: 'Password Reset Request',
      templateName: 'forget-password',
      title: 'Reset your password',
      actionLabel: 'Reset Password',
      body: 'We received a request to reset your password. Use the button below to choose a new password.',
      url,
      expiresIn,
    });
  }

  async sendTemporaryPasswordEmail(
    user: UserEntity,
    temporaryPassword: string,
  ): Promise<void> {
    const webAppUrl = (
      this.configService.get<string>('app.webAppUrl') || 'http://localhost:3001'
    ).replace(/\/$/, '');
    const loginUrl = `${webAppUrl}/auth`;
    const core = (await this.storeService.findOneById(
      StoreIDs.CORE,
    )) as GenericStore<Core>;

    const variables = {
      name: core.value.name,
      address: core.value.address,
      support: core.value.support,
      logo: `${webAppUrl}/logo.png`,
      client: identifyUser(user),
      email: user.email,
      temporaryPassword,
      loginUrl,
    };

    try {
      await this.mailService.sendTemplate<TemporaryPasswordTemplateProps>(
        user.email,
        'Your Account Access',
        'temporary-password',
        variables,
      );
    } catch (error) {
      this.logger.warn(
        `Falling back to inline temporary password email template: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      await this.mailService.sendMail(
        user.email,
        'Your Account Access',
        this.renderTemporaryPasswordFallbackEmail(variables),
      );
    }
  }

  private renderTemporaryPasswordFallbackEmail({
    name,
    address,
    support,
    logo,
    client,
    email,
    temporaryPassword,
    loginUrl,
  }: {
    name: string;
    address: string;
    support: string;
    logo: string;
    client: string;
    email: string;
    temporaryPassword: string;
    loginUrl: string;
  }): string {
    const escapedName = this.escapeHtml(name);
    const escapedClient = this.escapeHtml(client);
    const escapedEmail = this.escapeHtml(email);
    const escapedPassword = this.escapeHtml(temporaryPassword);
    const escapedLoginUrl = this.escapeHtml(loginUrl);
    const escapedSupport = this.escapeHtml(support);
    const escapedAddress = this.escapeHtml(address);
    const escapedLogo = this.escapeHtml(logo ?? '');

    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; color: #343a40; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            ${escapedLogo ? `<img src="${escapedLogo}" alt="${escapedName}" style="max-height: 64px; margin-bottom: 16px;" />` : ''}
            <h1 style="font-size: 20px; margin: 0; color: #111827;">${escapedName}</h1>
          </div>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; margin: 0 0 16px;">Your Account Has Been Created</h2>
            <p style="margin: 0 0 12px;">Hi ${escapedClient},</p>
            <p style="margin: 0 0 12px;">An administrator has created an account for you. Below are your temporary login credentials.</p>
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0 0 8px; font-size: 14px;"><strong>Email:</strong> ${escapedEmail}</p>
              <p style="margin: 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${escapedPassword}</code></p>
            </div>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${escapedLoginUrl}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; padding: 10px 18px; font-weight: 700;">Log In</a>
            </p>
            <p style="font-size: 13px; color: #dc2626; margin: 0 0 8px;"><strong>Important:</strong> For security reasons, you will be required to change this password after your first login.</p>
            <p style="font-size: 14px; margin: 0;">If the button does not work, copy and paste this link into your browser:</p>
            <p style="font-size: 14px; word-break: break-word; color: #2563eb; margin: 0;">${escapedLoginUrl}</p>
          </div>
          <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 13px; color: #6b7280;">
            <p style="margin: 0 0 8px;">Need help? Contact <a href="mailto:${escapedSupport}" style="color: #2563eb;">${escapedSupport}</a>.</p>
            <p style="margin: 0 0 8px;">${escapedName}<br />${escapedAddress}</p>
            <p style="margin: 0;">This email was sent to ${escapedEmail}.</p>
          </div>
        </body>
      </html>
    `;
  }

  private async sendAuthTemplate<T extends object>({
    user,
    subject,
    templateName,
    title,
    actionLabel,
    body,
    url,
    expiresIn,
  }: {
    user: UserEntity;
    subject: string;
    templateName: AuthEmailTemplateName;
    title: string;
    actionLabel: string;
    body: string;
    url: string;
    expiresIn: string;
  }): Promise<void> {
    const variables = await this.buildTemplateVariables(user, url, expiresIn);

    try {
      await this.mailService.sendTemplate<T>(
        user.email,
        subject,
        templateName,
        variables as T,
      );
    } catch (error) {
      this.logger.warn(
        `Falling back to inline auth email template for ${templateName}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      await this.mailService.sendMail(
        user.email,
        subject,
        this.renderFallbackEmail({
          ...variables,
          title,
          actionLabel,
          body,
        }),
      );
    }
  }

  private async buildTemplateVariables(
    user: UserEntity,
    url: string,
    expiresIn: string,
  ): Promise<EmailVerificationTemplateProps & ForgetPasswordTemplateProps> {
    const webAppUrl =
      this.configService.get<string>('app.webAppUrl') ||
      'http://localhost:3001';
    const core = (await this.storeService.findOneById(
      StoreIDs.CORE,
    )) as GenericStore<Core>;

    return {
      name: core.value.name,
      address: core.value.address,
      support: core.value.support,
      logo: `${webAppUrl}/logo.png`,
      client: identifyUser(user),
      email: user.email,
      url,
      expiresIn,
    };
  }

  private buildWebAppUrl(pathname: string, token: string): string {
    const webAppUrl = (
      this.configService.get<string>('app.webAppUrl') || 'http://localhost:3001'
    ).replace(/\/$/, '');
    const url = new URL(pathname, `${webAppUrl}/`);
    url.searchParams.set('token', token);
    return url.toString();
  }

  private renderFallbackEmail({
    name,
    address,
    support,
    logo,
    client,
    email,
    url,
    expiresIn,
    title,
    actionLabel,
    body,
  }: EmailVerificationTemplateProps &
    ForgetPasswordTemplateProps & {
      title: string;
      actionLabel: string;
      body: string;
    }): string {
    const escapedTitle = this.escapeHtml(title);
    const escapedName = this.escapeHtml(name);
    const escapedClient = this.escapeHtml(client);
    const escapedBody = this.escapeHtml(body);
    const escapedUrl = this.escapeHtml(url);
    const escapedSupport = this.escapeHtml(support);
    const escapedAddress = this.escapeHtml(address);
    const escapedEmail = this.escapeHtml(email);
    const escapedLogo = this.escapeHtml(logo ?? '');
    const escapedActionLabel = this.escapeHtml(actionLabel);
    const escapedExpiresIn = this.escapeHtml(expiresIn);

    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; color: #343a40; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            ${escapedLogo ? `<img src="${escapedLogo}" alt="${escapedName}" style="max-height: 64px; margin-bottom: 16px;" />` : ''}
            <h1 style="font-size: 20px; margin: 0; color: #111827;">${escapedName}</h1>
          </div>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; margin: 0 0 16px;">${escapedTitle}</h2>
            <p style="margin: 0 0 12px;">Hi ${escapedClient},</p>
            <p style="margin: 0 0 24px;">${escapedBody}</p>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${escapedUrl}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; padding: 10px 18px; font-weight: 700;">${escapedActionLabel}</a>
            </p>
            <p style="font-size: 14px; margin: 0 0 8px;">If the button does not work, copy and paste this link into your browser:</p>
            <p style="font-size: 14px; word-break: break-word; color: #2563eb; margin: 0 0 16px;">${escapedUrl}</p>
            <p style="font-size: 13px; color: #6b7280; margin: 0;">This link expires in ${escapedExpiresIn}.</p>
          </div>
          <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 13px; color: #6b7280;">
            <p style="margin: 0 0 8px;">Need help? Contact <a href="mailto:${escapedSupport}" style="color: #2563eb;">${escapedSupport}</a>.</p>
            <p style="margin: 0 0 8px;">${escapedName}<br />${escapedAddress}</p>
            <p style="margin: 0;">This email was sent to ${escapedEmail}.</p>
          </div>
        </body>
      </html>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
