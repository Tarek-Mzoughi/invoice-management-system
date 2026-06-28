import { Injectable, Logger } from '@nestjs/common';
import { MigrationNotFoundException } from '../errors/migration.notfound.error';
import { IQueryObject } from '../interfaces/database-query-options.interface';
import { DataSource, FindManyOptions } from 'typeorm';
import * as fs from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';
import { MigrationChecksumValidationException } from '../errors/migration.checksum-validation.error';
import { MigrationMissingMigrationFilesException } from '../errors/migration.missing-file.error';
import { MigrationRepository } from '../repositories/migration.repository';
import { MigrationEntity } from '../entities/migration.entity';
import { QueryBuilder } from '../utils/database-query-builder';
import { MigrationFile } from '../utils/migration-file';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);
  private readonly REPLAY_SAFE_MYSQL_ERRNOS = new Set([
    1022, // duplicate key/write conflict while adding keys
    1050, // table already exists
    1060, // duplicate column
    1061, // duplicate key name
    1062, // duplicate entry
    1068, // multiple primary keys
    1091, // can't drop missing column/key
    1826, // duplicate foreign key constraint name
  ]);
  private readonly MIGRATION_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    version TEXT,
    script TEXT,
    description TEXT,
    checksum INTEGER,
    success BOOLEAN,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW(),
    deletedAt TIMESTAMP DEFAULT NULL,
    isDeletionRestricted BOOLEAN DEFAULT FALSE
  );
    `;

  constructor(
    private readonly migrationRepository: MigrationRepository,
    private readonly dataSource: DataSource,
  ) {}

  async findOneById(id: number): Promise<MigrationEntity> {
    const migration = await this.migrationRepository.findOneById(id);
    if (!migration) {
      throw new MigrationNotFoundException();
    }
    return migration;
  }

  async findOneByVersion(version: string): Promise<MigrationEntity> {
    const migration = await this.findLatestMigrationByVersion(version);
    if (!migration) {
      throw new MigrationNotFoundException();
    }
    return migration;
  }

  async findAll(query: IQueryObject): Promise<MigrationEntity[]> {
    const queryBuilder = new QueryBuilder(
      this.migrationRepository.getMetadata(),
    );
    const queryOptions = queryBuilder.build(query);
    return await this.migrationRepository.findAll(
      queryOptions as FindManyOptions<MigrationEntity>,
    );
  }

  async save(migration: MigrationEntity): Promise<MigrationEntity> {
    return this.migrationRepository.save(migration);
  }

  loadMigrationFiles(dir: string): MigrationFile[] {
    const migrationFiles: MigrationFile[] = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const content = readFileSync(join(dir, file), 'utf-8');
      try {
        const migrationFile = this.parse(file, content);
        if (migrationFile) {
          migrationFiles.push(migrationFile);
        }
      } catch (e) {
        this.logger.warn(`Error parsing migration file: ${file} | ${e}`);
      }
    }

    return migrationFiles;
  }

  private parse(filename: string, content: string): MigrationFile {
    const PATTERN =
      /^V(?<major>\d+)(_?(?<minor>\d+))?__(?<description>[a-zA-Z_-]+)\.sql$/;
    const RPATTERN =
      /^R(?<major>\d+)(_?(?<minor>\d+))?__(?<description>[a-zA-Z_-]+)\.sql$/;

    const match = filename.match(PATTERN) || filename.match(RPATTERN);

    if (!match) {
      throw new Error(`Unable to parse migration file name: ${filename}`);
    }

    const versionString = match?.groups?.minor
      ? `${match?.groups?.major}.${match?.groups?.minor}.0`
      : match?.groups?.major;

    const migrationFile = MigrationFile.initializeEmptyMigrationFile();
    migrationFile.version = versionString as string;
    migrationFile.script = filename;
    migrationFile.description = match?.groups?.description as string;
    migrationFile.setContent(content);

    this.logger.log(
      `Parsed migration file: ${filename} with version ${versionString} and checksum ${migrationFile.checksum}`,
    );

    migrationFile.repeated = filename.startsWith('R');

    return migrationFile;
  }

  async runMigrations(migrationPath: string, migrationFiles: MigrationFile[]) {
    if (!migrationFiles.length) return;

    const migrationFilesSorted = migrationFiles
      .filter((m) => !m.repeated)
      .sort((a, b) => a.compareTo(b));

    for (const migrationFile of migrationFilesSorted) {
      const existingMigration = await this.findLatestMigrationByVersion(
        migrationFile.version,
      );

      if (existingMigration) {
        if (existingMigration.success) {
          if (migrationFile.checksum !== existingMigration.checksum) {
            throw new MigrationChecksumValidationException(
              migrationFile.description,
            );
          }

          continue;
        }

        if (migrationFile.checksum !== existingMigration.checksum) {
          this.logger.warn(
            `Retrying failed migration ${existingMigration.version} with updated checksum ${existingMigration.checksum} -> ${migrationFile.checksum}`,
          );
          existingMigration.checksum = migrationFile.checksum;
          existingMigration.script = migrationFile.script;
          existingMigration.description = migrationFile.description;
          await this.save(existingMigration);
        }

        if (!existingMigration.success) {
          await this.executeMigration(migrationPath, migrationFile);
          existingMigration.success = true;
          await this.save(existingMigration);
        }
      } else {
        const migration = new MigrationEntity();
        migration.version = migrationFile.version;
        migration.script = migrationFile.script;
        migration.description = migrationFile.description;
        migration.checksum = migrationFile.checksum;
        migration.success = false;

        await this.save(migration);
        await this.executeMigration(migrationPath, migrationFile);

        migration.success = true;
        await this.save(migration);
      }
    }
  }

  private async executeMigration(
    migrationPath: string,
    migrationFile: MigrationFile,
  ) {
    const queries = readFileSync(
      `${migrationPath}/${migrationFile.script}`,
      'utf-8',
    )
      .split(';')
      .map((line) => line.trim());
    for (const query of queries) {
      if (!query) continue;

      try {
        await this.dataSource.query(query);
      } catch (error) {
        if (this.isReplaySafeMigrationError(query, error)) {
          this.logger.warn(
            `Ignoring replay-safe migration error for ${migrationFile.version} on query "${this.truncateQuery(
              query,
            )}": ${this.getMigrationErrorMessage(error)}`,
          );
          continue;
        }

        throw error;
      }
    }

    this.logger.log(
      `Executed migration: ${migrationFile.version} ${migrationFile.description}`,
    );
  }

  private isReplaySafeMigrationError(query: string, error: unknown): boolean {
    const driverError = error as {
      errno?: number;
      code?: string;
      sqlMessage?: string;
      message?: string;
    };
    const errno = driverError?.errno;
    const message = this.getMigrationErrorMessage(error);
    const isInsert = /^\s*INSERT\b/i.test(query);

    if (errno !== undefined && this.REPLAY_SAFE_MYSQL_ERRNOS.has(errno)) {
      return errno !== 1062 || isInsert;
    }

    if (
      /Duplicate column name|Duplicate key name|already exists|Multiple primary key defined|Duplicate foreign key constraint name/i.test(
        message,
      )
    ) {
      return true;
    }

    if (/Can't DROP .* check that column\/key exists/i.test(message)) {
      return true;
    }

    if (isInsert && /Duplicate entry/i.test(message)) {
      return true;
    }

    return false;
  }

  private getMigrationErrorMessage(error: unknown): string {
    const driverError = error as { sqlMessage?: string; message?: string };
    return driverError?.sqlMessage || driverError?.message || String(error);
  }

  private truncateQuery(query: string, maxLength = 140): string {
    return query.length > maxLength
      ? `${query.slice(0, maxLength - 3)}...`
      : query;
  }

  async createMigrationsTableIfNotExists() {
    await this.dataSource.query(this.MIGRATION_TABLE_SQL);
  }

  runNeeded(
    migrationFiles: MigrationFile[],
    migrations: MigrationEntity[],
    failOnMissingFiles = false,
  ): boolean {
    if (migrationFiles.length < migrations.length && failOnMissingFiles) {
      throw new MigrationMissingMigrationFilesException(
        `${migrationFiles.length} < ${migrations.length}`,
      );
    }

    if (migrationFiles.length !== migrations.length) {
      return true;
    }

    migrations.sort((a, b) => a.compareTo(b));
    migrationFiles.sort((a, b) => a.compareTo(b));

    for (let i = 0; i < migrationFiles.length; i++) {
      const migrationFile = migrationFiles[i];
      const migration = migrations[i];

      if (
        migrationFile.version !== migration.version ||
        migrationFile.checksum !== migration.checksum ||
        !migration.success
      ) {
        return true;
      }
    }

    return false;
  }

  async delete(id: number): Promise<void> {
    return this.migrationRepository.delete(id);
  }

  async deleteAll() {
    return this.migrationRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.migrationRepository.getTotalCount();
  }

  private async findLatestMigrationByVersion(
    version: string,
  ): Promise<MigrationEntity | null> {
    const migrations = await this.migrationRepository.findAll({
      where: { version },
      order: { id: 'DESC' },
    });

    if (migrations.length > 1) {
      this.logger.warn(
        `Found ${migrations.length} migration rows for version ${version}; using the latest row with id ${migrations[0].id}`,
      );
    }

    return migrations[0] ?? null;
  }
}
