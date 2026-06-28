import { NestApplication, NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app/app.module';
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { MigrationService } from './shared/database/services/database-migration.service';
import { join } from 'path';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app: NestApplication = await NestFactory.create(AppModule);
  app.enableCors();
  // Increase body size limit to 10MB for AI file attachments (base64)
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const logger = new Logger();

  //Config Variables =====================================================
  const configService = app.get(ConfigService);
  const host: string = configService.get<string>('app.http.host');
  const port: number = configService.get<number>('app.http.port');

  const docName: string = configService.get<string>('doc.name');
  const docDesc: string = configService.get<string>('doc.description');
  const docVersion: string = configService.get<string>('doc.version');
  const docPrefix: string = configService.get<string>('doc.prefix');

  //Swagger ==============================================================

  const documentBuild = new DocumentBuilder()
    .setTitle(docName)
    .setDescription(docDesc)
    .setVersion(docVersion)
    .addServer(`http://${host}:${port}/`, 'Local environment')
    .addServer('https://staging.yourapi.com/', 'Staging')
    .addServer('https://production.yourapi.com/', 'Production')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'accessToken',
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'refreshToken',
    )
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-api-key' }, 'apiKey')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-permission-token',
        description: 'grant permission for /admin prefix endpoints',
      },
      'permissionToken',
    )
    .build();

  const document = SwaggerModule.createDocument(app, documentBuild, {
    deepScanRoutes: true,
    extraModels: [],
  });

  SwaggerModule.setup(docPrefix, app, document, {
    explorer: true,
    customSiteTitle: docName,
  });

  //Migrations ==========================================================
  const synchronize = configService.get<boolean>('database.synchronize');
  if (!synchronize) {
    const migrationService = app.get(MigrationService);
    const migrationPath = join(__dirname, 'migrations');
    try {
      // Create migrations table if it does not exist
      await migrationService.createMigrationsTableIfNotExists();

      const migrationFiles =
        await migrationService.loadMigrationFiles(migrationPath);

      const existingMigrations = await migrationService.findAll({});

      // Check if there are any migrations to run
      const needToRunMigrations = await migrationService.runNeeded(
        migrationFiles,
        existingMigrations,
      );

      if (needToRunMigrations) {
        await migrationService.runMigrations(migrationPath, migrationFiles);
      }
    } catch (error) {
      logger.error('Migration process failed', error.stack);
      throw error;
    }
  }
  //===================================================================

  await app.listen(port);
  logger.log(`==========================================================`);
  logger.log(`Http Server running on ${await app.getUrl()}`, 'NestApplication');
  logger.log(
    `Storage driver is set to ${configService.get<string>('app.storageDriver')}`,
  );
  logger.log(`==========================================================`);
}

bootstrap();
