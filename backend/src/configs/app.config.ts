import { registerAs } from '@nestjs/config';
import { ENUM_APP_ENVIRONMENT } from 'src/app/constants/app.enum.constant';

export default registerAs(
  'app',
  (): Record<string, unknown> => ({
    name: process.env.APP_NAME ?? 'Invoice System API Server',
    env: process.env.APP_ENV ?? ENUM_APP_ENVIRONMENT.DEVELOPMENT,

    globalPrefix: '/api',
    http: {
      enable: process.env.HTTP_ENABLE === 'true' || false,
      host: process.env.APP_HOST ?? 'localhost',
      port: process.env.APP_PORT ? Number.parseInt(process.env.APP_PORT) : 3000,
    },

    jobEnable: process.env.JOB_ENABLE === 'true' || false,
    storageDriver: process.env.STORAGE_DRIVER ?? 'local',
    uploadPath: process.env.UPLOAD_PATH ?? '/upload',
    jwtSecret: process.env.JWT_SECRET || 'jwt-secret',
    jwtRefreshTokenSecret:
      process.env.JWT_REFRESH_TOKEN_SECRET ||
      process.env.JWT_SECRET ||
      'jwt-secret',
    jwtAccessTokenExpiration: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '1d',
    jwtRefreshTokenExpiration: process.env.JWT_REFRESH_TOKEN_EXPIRATION || '3d',

    webAppUrl: process.env.WEB_APP_URL || 'http://localhost:3000',

    passwordReset: {
      expirationMinutes: process.env.PASSWORD_RESET_EXPIRATION_MINUTES
        ? Number.parseInt(process.env.PASSWORD_RESET_EXPIRATION_MINUTES, 10)
        : 15,
    },

    emailVerification: {
      expirationMinutes: process.env.EMAIL_VERIFICATION_EXPIRATION_MINUTES
        ? Number.parseInt(process.env.EMAIL_VERIFICATION_EXPIRATION_MINUTES, 10)
        : 30,
    },
  }),
);
