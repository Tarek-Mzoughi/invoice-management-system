import { Command } from 'nestjs-command';
import { Injectable, Logger } from '@nestjs/common';
import { TemplateService } from 'src/shared/templates/services/template.service';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TemplatesSeederCommand {
  private readonly logger = new Logger(TemplatesSeederCommand.name);

  constructor(
    private readonly templateService: TemplateService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Ensures the templates-related tables exist before seeding.
   * This makes the seeder resilient to complete database resets,
   * since nestjs-command does not run migrations from main.ts.
   */
  private async ensureTablesExist(): Promise<void> {
    const queries = [
      `CREATE TABLE IF NOT EXISTS \`templates\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`name\` VARCHAR(255) DEFAULT NULL,
        \`content\` LONGTEXT DEFAULT NULL,
        \`createdAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deletedAt\` TIMESTAMP NULL DEFAULT NULL,
        \`isDeletionRestricted\` TINYINT(1) NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`)
      )`,
      `CREATE TABLE IF NOT EXISTS \`template-styles\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`content\` LONGTEXT DEFAULT NULL,
        \`createdAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deletedAt\` TIMESTAMP NULL DEFAULT NULL,
        \`isDeletionRestricted\` TINYINT(1) NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_template_styles_name\` (\`name\`)
      )`,
      `CREATE TABLE IF NOT EXISTS \`template_template_styles\` (
        \`templateId\` VARCHAR(36) NOT NULL,
        \`styleId\` VARCHAR(36) NOT NULL,
        PRIMARY KEY (\`templateId\`, \`styleId\`),
        KEY \`FK_tts_templateId\` (\`templateId\`),
        KEY \`FK_tts_styleId\` (\`styleId\`)
      )`,
    ];

    for (const query of queries) {
      await this.dataSource.query(query);
    }
    this.logger.log('Ensured templates tables exist');
  }

  @Command({
    command: 'seed:templates',
    describe: 'seed email templates',
  })
  async seed(): Promise<void> {
    const start = new Date();
    console.log('Starting seeding of email templates');

    // Ensure tables exist before seeding (resilient to DB resets)
    await this.ensureTablesExist();

    const templatesDir = path.resolve(process.cwd(), 'src/assets/templates');

    const templates = [
      { name: 'forget-password', dir: 'forget-password' },
      { name: 'email-verification', dir: 'email-verification' },
      { name: 'temporary-password', dir: 'temporary-password' },
    ];

    for (const template of templates) {
      const templatePath = path.join(templatesDir, template.dir, 'index.ejs');
      if (fs.existsSync(templatePath)) {
        const content = fs.readFileSync(templatePath, 'utf-8');
        await this.templateService.save({
          name: template.name,
          content,
        });
        console.log(`  Seeded template: ${template.name}`);
      } else {
        console.warn(`  Template file not found: ${templatePath}`);
      }
    }

    const end = new Date();
    console.log(`Seeding completed in ${end.getTime() - start.getTime()}ms`);
  }
}
