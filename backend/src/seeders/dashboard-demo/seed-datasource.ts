/**
 * Standalone TypeORM DataSource for the seed script.
 * Reads .env directly — no NestJS bootstrap needed.
 */

import { DataSource } from 'typeorm';
import * as path from 'path';

export function buildDemoDataSource(): DataSource {
  return new DataSource({
    type: (process.env.DATABASE_TYPE as 'mysql') || 'mysql',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    username: process.env.DATABASE_USERNAME || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'invoicing',
    url: process.env.DATABASE_URL || undefined,
    entities: [
      path.join(__dirname, '../../**/*.entity{.ts,.js}'),
      path.join(__dirname, '../../shared/**/*.entity{.ts,.js}'),
    ],
    synchronize: false,
    logging: process.env.DATABASE_LOGGING === 'true',
  });
}
