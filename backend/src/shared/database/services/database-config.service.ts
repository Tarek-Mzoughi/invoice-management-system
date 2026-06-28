import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: this.configService.get<string>('database.type', {
        infer: true,
      }) as any,
      host: this.configService.get<string>('database.host', { infer: true }),
      port: parseInt(
        this.configService.get<string>('database.port', { infer: true }),
        10,
      ),
      username: this.configService.get<string>('database.username', {
        infer: true,
      }),
      password: this.configService.get<string>('database.password', {
        infer: true,
      }),
      database: this.configService.get<string>('database.name', {
        infer: true,
      }),
      url: this.configService.get<string>('database.url', { infer: true }),
      synchronize:
        this.configService.get<boolean>('database.synchronize', {
          infer: true,
        }) ?? false,
      dropSchema:
        this.configService.get<boolean>('database.dropSchema', {
          infer: true,
        }) ?? false,
      logging:
        this.configService.get<boolean>('database.logging', {
          infer: true,
        }) ?? false,
      entities: [
        __dirname + '/../../**/*.entity{.ts,.js}',
        __dirname + '/../../../modules/**/*.entity{.ts,.js}',
      ],
      extra: this.configService.get<boolean>('database.sslEnabled', {
        infer: true,
      })
        ? {
            rejectUnauthorized: this.configService.get<boolean>(
              'database.rejectUnauthorized',
              { infer: true },
            ),
            ca:
              this.configService.get<string>('database.ca', { infer: true }) ??
              undefined,
            key:
              this.configService.get<string>('database.key', { infer: true }) ??
              undefined,
            cert:
              this.configService.get<string>('database.cert', {
                infer: true,
              }) ?? undefined,
          }
        : undefined,
    };
  }
}
