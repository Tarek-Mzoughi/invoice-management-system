import { registerAs } from '@nestjs/config';

export default registerAs(
  's3',
  (): Record<string, any> => ({
    bucket: process.env.S3_BUCKET || 'invoicing',
    endpoint: process.env.S3_ENDPOINT || 'localhost',
    port: process.env.S3_PORT ? Number.parseInt(process.env.S3_PORT) : 9000,
    useSSL: process.env.S3_USE_SSL === 'true' || false,
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin123',
  }),
);
