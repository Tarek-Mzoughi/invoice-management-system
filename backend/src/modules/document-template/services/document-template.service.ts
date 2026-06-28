import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { FindManyOptions, FindOneOptions, Like } from 'typeorm';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';
import { CreateDocumentTemplateDto } from '../dtos/document-template.create.dto';
import { UpdateDocumentTemplateDto } from '../dtos/document-template.update.dto';
import { DocumentTemplateEntity } from '../entities/document-template.entity';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../enums/document-template-document-type.enum';
import { DOCUMENT_TEMPLATE_STATUS } from '../enums/document-template-status.enum';
import { DocumentTemplateRepository } from '../repositories/document-template.repository';
import { DocumentTemplateVersionService } from './document-template-version.service';
import { TemplateSchemaValidatorService } from './template-schema-validator.service';

@Injectable()
export class DocumentTemplateService {
  constructor(
    private readonly templateRepository: DocumentTemplateRepository,
    private readonly versionService: DocumentTemplateVersionService,
    private readonly schemaValidator: TemplateSchemaValidatorService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async findAll(
    query: IQueryObject,
    userId?: string,
  ): Promise<DocumentTemplateEntity[]> {
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(scopedQuery);
    return this.templateRepository.findAll(
      queryOptions as FindManyOptions<DocumentTemplateEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
    userId?: string,
  ): Promise<PageDto<DocumentTemplateEntity>> {
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(scopedQuery);
    const page = Number(scopedQuery.page || 1);
    const take = Number(scopedQuery.limit || 10);
    const count = await this.templateRepository.getTotalCount({
      where: queryOptions.where,
    });
    const templates = await this.templateRepository.findAll({
      ...(queryOptions as FindManyOptions<DocumentTemplateEntity>),
      relations: {
        category: true,
        thumbnailStorage: true,
      },
      order: {
        id: 'DESC',
      },
      skip: (page - 1) * take,
      take,
    });

    return new PageDto(
      templates,
      new PageMetaDto({
        pageOptionsDto: { page, take },
        itemCount: count,
      }),
    );
  }

  async findOneById(
    id: number,
    userId?: string,
  ): Promise<DocumentTemplateEntity> {
    const cabinetId = userId
      ? await this.tenantContext.getCurrentCabinetIdOrFail(userId)
      : undefined;
    const template = await this.templateRepository.findOne({
      where: cabinetId ? { id, cabinetId } : { id },
      relations: {
        category: true,
        thumbnailStorage: true,
        assets: { storage: true },
      },
    });
    if (!template) throw new NotFoundException('Document template not found');
    return template;
  }

  async findOneByCondition(
    query: IQueryObject,
    userId?: string,
  ): Promise<DocumentTemplateEntity | null> {
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(scopedQuery);
    return this.templateRepository.findOne(
      queryOptions as FindOneOptions<DocumentTemplateEntity>,
    );
  }

  async findDefaultByDocumentType(
    documentType: string,
    cabinetContext?: number | string,
  ): Promise<DocumentTemplateEntity | null> {
    const parsedDocumentType = this.validateDocumentType(documentType);
    const cabinetId = await this.resolveCabinetId(cabinetContext);
    return this.templateRepository.findOne({
      where: {
        documentType: parsedDocumentType,
        cabinetId,
        isDefault: true,
        status: DOCUMENT_TEMPLATE_STATUS.PUBLISHED,
      },
    });
  }

  async findAvailableByDocumentType(
    documentType: string,
    cabinetContext?: number | string,
  ): Promise<DocumentTemplateEntity[]> {
    const parsedDocumentType = this.validateDocumentType(documentType);
    const cabinetId = await this.resolveCabinetId(cabinetContext);
    return this.templateRepository.findAll({
      where: {
        documentType: parsedDocumentType,
        cabinetId,
        status: DOCUMENT_TEMPLATE_STATUS.PUBLISHED,
      },
      order: {
        isDefault: 'DESC',
        id: 'DESC',
      },
    });
  }

  async findUsableTemplate(
    id: number,
    documentType: string,
    cabinetContext?: number | string,
  ): Promise<DocumentTemplateEntity> {
    const parsedDocumentType = this.validateDocumentType(documentType);
    const cabinetId = await this.resolveCabinetId(cabinetContext);
    const template = await this.findOneById(
      id,
      typeof cabinetContext === 'string' ? cabinetContext : undefined,
    );

    if (template.cabinetId !== cabinetId) {
      throw new NotFoundException('Document template not found');
    }

    if (template.documentType !== parsedDocumentType) {
      throw new BadRequestException(
        'Document template does not match the requested document type',
      );
    }

    if (template.status !== DOCUMENT_TEMPLATE_STATUS.PUBLISHED) {
      throw new BadRequestException(
        'Only published templates can be used for document generation',
      );
    }

    return template;
  }

  @Transactional()
  async save(
    dto: CreateDocumentTemplateDto,
    userId?: string,
  ): Promise<DocumentTemplateEntity> {
    const templateSchema = dto.templateSchema || this.createDefaultSchema(dto);
    this.schemaValidator.validate(templateSchema);

    if (dto.isDefault) {
      this.assertPublishable(dto.status || DOCUMENT_TEMPLATE_STATUS.DRAFT);
    }

    const cabinetId = await this.resolveCabinetId(userId || dto.cabinetId);
    const template = await this.templateRepository.save({
      ...dto,
      cabinetId,
      slug: await this.generateSlug(dto.name, cabinetId),
      status: dto.status || DOCUMENT_TEMPLATE_STATUS.DRAFT,
      isDefault: !!dto.isDefault,
      versionNumber: 1,
      templateSchema,
      pageSettings:
        dto.pageSettings ||
        (templateSchema.pageSettings as Record<string, unknown>),
      variablesConfig:
        dto.variablesConfig ||
        (templateSchema.variables as Record<string, unknown>),
      createdById: userId,
      updatedById: userId,
    });

    if (template.isDefault) {
      await this.unsetOtherDefaults(template);
    }

    await this.versionService.createFromTemplate(
      template,
      userId,
      'Initial version',
    );
    return this.findOneById(template.id, userId);
  }

  @Transactional()
  async update(
    id: number,
    dto: UpdateDocumentTemplateDto,
    userId?: string,
  ): Promise<DocumentTemplateEntity> {
    const current = await this.findOneById(id, userId);
    const templateSchema = dto.templateSchema || current.templateSchema;
    this.schemaValidator.validate(templateSchema);

    const nextStatus = dto.status || current.status;
    if (dto.isDefault) this.assertPublishable(nextStatus);

    const updated = await this.templateRepository.save({
      ...current,
      ...dto,
      cabinetId: current.cabinetId,
      templateSchema,
      pageSettings: dto.pageSettings || current.pageSettings,
      variablesConfig: dto.variablesConfig || current.variablesConfig,
      versionNumber: (current.versionNumber || 1) + 1,
      updatedById: userId,
    });

    if (updated.isDefault) {
      await this.unsetOtherDefaults(updated);
    }

    await this.versionService.createFromTemplate(
      updated,
      userId,
      'Template update',
    );
    return this.findOneById(updated.id, userId);
  }

  @Transactional()
  async delete(id: number, userId?: string): Promise<DocumentTemplateEntity> {
    const template = await this.findOneById(id, userId);
    if (template.isDefault) {
      throw new BadRequestException('Default templates cannot be deleted');
    }
    return this.templateRepository.softDelete(id);
  }

  @Transactional()
  async duplicate(
    id: number,
    userId?: string,
  ): Promise<DocumentTemplateEntity> {
    const template = await this.findOneById(id, userId);
    return this.save(
      {
        name: `${template.name} Copy`,
        documentType: template.documentType,
        status: DOCUMENT_TEMPLATE_STATUS.DRAFT,
        isDefault: false,
        templateSchema: this.cloneJson(template.templateSchema),
        pageSettings: this.cloneJson(template.pageSettings),
        variablesConfig: this.cloneJson(template.variablesConfig),
        categoryId: template.categoryId,
        cabinetId: template.cabinetId,
      },
      userId,
    );
  }

  @Transactional()
  async setDefault(
    id: number,
    userId?: string,
  ): Promise<DocumentTemplateEntity> {
    const template = await this.findOneById(id, userId);
    this.assertPublishable(template.status);

    const updated = await this.templateRepository.save({
      ...template,
      isDefault: true,
      updatedById: userId,
    });

    await this.unsetOtherDefaults(updated);
    await this.versionService.createFromTemplate(
      updated,
      userId,
      'Set as default template',
    );
    return this.findOneById(updated.id, userId);
  }

  private async unsetOtherDefaults(
    template: DocumentTemplateEntity,
  ): Promise<void> {
    await this.templateRepository
      .createQueryBuilder()
      .update(DocumentTemplateEntity)
      .set({ isDefault: false })
      .where('id != :id', { id: template.id })
      .andWhere('cabinetId = :cabinetId', {
        cabinetId: template.cabinetId,
      })
      .andWhere('documentType = :documentType', {
        documentType: template.documentType,
      })
      .execute();
  }

  private assertPublishable(status: DOCUMENT_TEMPLATE_STATUS): void {
    if (status !== DOCUMENT_TEMPLATE_STATUS.PUBLISHED) {
      throw new BadRequestException(
        'Only published templates can be set as default',
      );
    }
  }

  private validateDocumentType(documentType: string) {
    const allowed = Object.values(DOCUMENT_TEMPLATE_DOCUMENT_TYPE);
    if (!allowed.includes(documentType as DOCUMENT_TEMPLATE_DOCUMENT_TYPE)) {
      throw new BadRequestException(
        `Unsupported document type ${documentType}`,
      );
    }
    return documentType as DocumentTemplateEntity['documentType'];
  }

  private async generateSlug(name: string, cabinetId: number): Promise<string> {
    const baseSlug =
      this.slugify(name) || `document-template-${new Date().getTime()}`;
    const existingCount = await this.templateRepository.getTotalCount({
      where: {
        slug: Like(`${baseSlug}%`),
        cabinetId,
      },
    });
    return existingCount > 0 ? `${baseSlug}-${existingCount + 1}` : baseSlug;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private createDefaultSchema(
    dto: CreateDocumentTemplateDto,
  ): Record<string, unknown> {
    return {
      metadata: {
        name: dto.name,
        documentType: dto.documentType,
        version: 1,
        locale: 'fr',
        direction: 'ltr',
        currency: 'TND',
        defaultFont: 'Helvetica',
      },
      pageSettings: {
        format: 'A4',
        orientation: 'portrait',
        unit: 'mm',
        width: 210,
        height: 297,
        margin: { top: 12, right: 12, bottom: 12, left: 12 },
      },
      variables: {},
      elements: [],
      styles: {},
    };
  }

  private cloneJson<T>(value: T): T {
    if (!value) return value;
    return JSON.parse(JSON.stringify(value));
  }

  private async scopeQueryForUser(
    query: IQueryObject,
    userId?: string,
  ): Promise<IQueryObject> {
    if (!userId) return { ...query };
    const cabinetId =
      await this.tenantContext.getCurrentCabinetIdOrFail(userId);
    return this.tenantContext.scopeQueryToCabinet(query, cabinetId);
  }

  private async resolveCabinetId(
    cabinetContext?: number | string,
  ): Promise<number> {
    if (typeof cabinetContext === 'string') {
      return this.tenantContext.getCurrentCabinetIdOrFail(cabinetContext);
    }

    const cabinetId = Number(cabinetContext);
    if (!Number.isInteger(cabinetId) || cabinetId <= 0) {
      throw new BadRequestException('A valid cabinet context is required');
    }
    return cabinetId;
  }
}
