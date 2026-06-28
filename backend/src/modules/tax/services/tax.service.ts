import { BadRequestException, Injectable } from '@nestjs/common';
import { TaxRepository } from '../repositories/tax.repository';
import { TaxEntity } from '../entities/tax.entity';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { CreateTaxDto } from '../dtos/tax.create.dto';
import { UpdateTaxDto } from '../dtos/tax.update.dto';
import { ResponseTaxDto } from '../dtos/tax.response.dto';
import { TaxNotFoundException } from '../errors/tax.notfound.error';
import { TaxAlreadyExistsException } from '../errors/tax.alreadyexists.error';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { DeepPartial, FindManyOptions, FindOneOptions, IsNull } from 'typeorm';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';
import { CabinetTaxConfigurationRepository } from '../repositories/cabinet-tax-configuration.repository';
import { CabinetTaxConfigurationEntity } from '../entities/cabinet-tax-configuration.entity';

@Injectable()
export class TaxService {
  constructor(
    private readonly taxRepository: TaxRepository,
    private readonly cabinetTaxConfigurationRepository: CabinetTaxConfigurationRepository,
    private readonly tenantContextService: TenantContextService,
  ) {}

  private normalizeTaxIds(taxIds?: number[] | null): number[] {
    if (!Array.isArray(taxIds)) {
      return [];
    }

    return Array.from(
      new Set(
        taxIds
          .map((taxId) => Number(taxId))
          .filter((taxId) => Number.isInteger(taxId) && taxId > 0),
      ),
    );
  }

  private mergeRelations(
    relations?: unknown,
    requiredRelations: string[] = [],
  ): string[] {
    const normalizedRelations = Array.isArray(relations)
      ? relations
      : typeof relations === 'string'
        ? [relations]
        : [];

    return Array.from(new Set([...normalizedRelations, ...requiredRelations]));
  }

  private buildTenantWhere(
    where: FindManyOptions<TaxEntity>['where'],
    cabinetId: number,
  ): FindManyOptions<TaxEntity>['where'] {
    const branches = Array.isArray(where) ? where : where ? [where] : [{}];

    return branches.flatMap((branch) => [
      { ...branch, cabinetId: IsNull() },
      { ...branch, cabinetId },
    ]);
  }

  private buildTemplateWhere(
    where: FindManyOptions<TaxEntity>['where'],
  ): FindManyOptions<TaxEntity>['where'] {
    const branches = Array.isArray(where) ? where : where ? [where] : [{}];

    return branches.map((branch) => ({ ...branch, cabinetId: IsNull() }));
  }

  private decorateTax(
    tax: TaxEntity,
    configuration?: CabinetTaxConfigurationEntity | null,
  ): ResponseTaxDto {
    return Object.assign(tax, {
      isActive: Boolean(configuration?.isActive),
      isTemplate: tax.cabinetId == null,
      isCustom: tax.cabinetId != null,
    });
  }

  private async decorateTaxesForCabinet(
    taxes: TaxEntity[],
    cabinetId: number,
    activeOnly = false,
  ): Promise<ResponseTaxDto[]> {
    const taxIds = taxes
      .map((tax) => tax.id)
      .filter((taxId): taxId is number => Number.isInteger(taxId));
    const configurations =
      await this.cabinetTaxConfigurationRepository.findByCabinetAndTaxIds(
        cabinetId,
        taxIds,
      );
    const configurationMap = new Map(
      configurations.map((configuration) => [
        configuration.taxId,
        configuration,
      ]),
    );

    return taxes
      .map((tax) => this.decorateTax(tax, configurationMap.get(tax.id)))
      .filter((tax) => (activeOnly ? tax.isActive : true));
  }

  private sanitizeTaxPayload(
    taxDto: CreateTaxDto | UpdateTaxDto,
  ): DeepPartial<TaxEntity> {
    return {
      label: taxDto.label,
      value: typeof taxDto.value === 'number' ? taxDto.value : undefined,
      isRate: taxDto.isRate,
      isSpecial: taxDto.isSpecial,
      currencyId:
        typeof taxDto.currencyId === 'undefined'
          ? undefined
          : taxDto.currencyId,
    };
  }

  private async assertNoDuplicateVisibleLabel(
    label: string | undefined,
    cabinetId: number,
    ignoredTaxId?: number,
  ): Promise<void> {
    const normalizedLabel = label?.trim();
    if (!normalizedLabel) {
      return;
    }

    const duplicate = await this.taxRepository
      .createQueryBuilder('tax')
      .where('LOWER(tax.label) = LOWER(:label)', { label: normalizedLabel })
      .andWhere('(tax.cabinetId IS NULL OR tax.cabinetId = :cabinetId)', {
        cabinetId,
      })
      .andWhere(ignoredTaxId ? 'tax.id != :ignoredTaxId' : '1 = 1', {
        ignoredTaxId,
      })
      .getOne();

    if (duplicate) {
      throw new TaxAlreadyExistsException();
    }
  }

  async configureCabinetTemplateSelection(
    cabinetId: number,
    selectedTaxIds: number[] = [],
  ): Promise<void> {
    const normalizedSelectedTaxIds = this.normalizeTaxIds(selectedTaxIds);
    const templates = await this.taxRepository.findAll({
      where: { cabinetId: IsNull() },
    });
    const templateIds = new Set(templates.map((template) => template.id));
    const invalidSelection = normalizedSelectedTaxIds.find(
      (taxId) => !templateIds.has(taxId),
    );

    if (invalidSelection) {
      throw new BadRequestException(
        'La taxe sélectionnée ne correspond pas à un template fiscal global.',
      );
    }

    const selectedSet = new Set(normalizedSelectedTaxIds);
    await this.cabinetTaxConfigurationRepository.upsertManyByCabinetAndTax(
      templates.map((template) => ({
        cabinetId,
        taxId: template.id,
        isActive: selectedSet.has(template.id),
      })),
      true,
    );
  }

  async ensureCabinetTemplateConfigurations(
    cabinetId: number,
    defaultActive = false,
  ): Promise<void> {
    const templates = await this.taxRepository.findAll({
      where: { cabinetId: IsNull() },
    });

    await this.cabinetTaxConfigurationRepository.upsertManyByCabinetAndTax(
      templates.map((template) => ({
        cabinetId,
        taxId: template.id,
        isActive: defaultActive,
      })),
      false,
    );
  }

  async setCabinetTaxActive(
    cabinetId: number,
    taxId: number,
    isActive: boolean,
  ): Promise<ResponseTaxDto> {
    const tax = await this.findOneAuthorizedForCabinet(taxId, cabinetId, false);
    await this.cabinetTaxConfigurationRepository.upsertByCabinetAndTax({
      cabinetId,
      taxId,
      isActive,
    });
    return { ...tax, isActive };
  }

  async findOneById(id: number): Promise<TaxEntity> {
    const tax = await this.taxRepository.findOneById(id);
    if (!tax) {
      throw new TaxNotFoundException();
    }
    return tax;
  }

  async findOneByCondition(
    query: IQueryObject,
    userId?: string,
  ): Promise<ResponseTaxDto | null> {
    if (userId) {
      const taxes = await this.findAll(query, userId);
      return taxes[0] ?? null;
    }

    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const tax = await this.taxRepository.findOne(
      queryOptions as FindOneOptions<TaxEntity>,
    );
    if (!tax) return null;
    return tax;
  }

  async findTemplates(query: IQueryObject = {}): Promise<ResponseTaxDto[]> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const listOptions = { ...(queryOptions as FindManyOptions<TaxEntity>) };
    delete listOptions.skip;
    delete listOptions.take;

    const taxes = await this.taxRepository.findAll({
      ...listOptions,
      where: this.buildTemplateWhere(listOptions.where),
      relations: this.mergeRelations(listOptions.relations, ['currency']),
    });

    return taxes.map((tax) => this.decorateTax(tax, null));
  }

  async findAll(
    query: IQueryObject = {},
    userId?: string,
    options: { activeOnly?: boolean } = {},
  ): Promise<ResponseTaxDto[]> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);

    if (!userId) {
      const taxes = await this.taxRepository.findAll(
        queryOptions as FindManyOptions<TaxEntity>,
      );
      return taxes.map((tax) => this.decorateTax(tax, null));
    }

    const cabinetId =
      await this.tenantContextService.getCurrentCabinetIdOrFail(userId);
    await this.ensureCabinetTemplateConfigurations(cabinetId, false);

    const listOptions = { ...(queryOptions as FindManyOptions<TaxEntity>) };
    delete listOptions.skip;
    delete listOptions.take;
    const taxes = await this.taxRepository.findAll({
      ...listOptions,
      where: this.buildTenantWhere(listOptions.where, cabinetId),
      relations: this.mergeRelations(listOptions.relations, ['currency']),
    });

    return this.decorateTaxesForCabinet(taxes, cabinetId, options.activeOnly);
  }

  async findAllPaginated(
    query: IQueryObject,
    userId?: string,
    options: { activeOnly?: boolean } = {},
  ): Promise<PageDto<ResponseTaxDto>> {
    const page = parseInt(query.page || '1', 10);
    const take = parseInt(query.limit || '25', 10);
    const listQuery = { ...query };
    delete listQuery.page;
    delete listQuery.limit;

    const entities = await this.findAll(listQuery, userId, options);
    const paginatedEntities = entities.slice((page - 1) * take, page * take);

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto: {
        page,
        take,
      },
      itemCount: entities.length,
    });

    return new PageDto(paginatedEntities, pageMetaDto);
  }

  async findOneVisibleById(
    id: number,
    userId: string,
  ): Promise<ResponseTaxDto> {
    const cabinetId =
      await this.tenantContextService.getCurrentCabinetIdOrFail(userId);
    return this.findOneAuthorizedForCabinet(id, cabinetId, false);
  }

  async findOneAuthorizedForCabinet(
    id: number,
    cabinetId: number,
    activeOnly = true,
  ): Promise<ResponseTaxDto> {
    const tax = await this.taxRepository.findOne({
      where: [
        { id, cabinetId: IsNull() },
        { id, cabinetId },
      ],
      relations: ['currency'],
    });

    if (!tax) {
      throw new TaxNotFoundException();
    }

    const configuration =
      await this.cabinetTaxConfigurationRepository.findByCabinetAndTax(
        cabinetId,
        id,
      );

    if (activeOnly && !configuration?.isActive) {
      throw new BadRequestException(
        'La taxe sélectionnée est inactive pour cette entreprise.',
      );
    }

    return this.decorateTax(tax, configuration);
  }

  async save(
    createTaxDto: CreateTaxDto,
    userId?: string,
  ): Promise<ResponseTaxDto> {
    if (userId) {
      const cabinetId =
        await this.tenantContextService.getCurrentCabinetIdOrFail(userId);
      await this.assertNoDuplicateVisibleLabel(createTaxDto.label, cabinetId);

      const tax = await this.taxRepository.save({
        ...this.sanitizeTaxPayload(createTaxDto),
        cabinetId,
      });
      await this.cabinetTaxConfigurationRepository.upsertByCabinetAndTax({
        cabinetId,
        taxId: tax.id,
        isActive: createTaxDto.isActive ?? true,
      });

      return this.findOneAuthorizedForCabinet(tax.id, cabinetId, false);
    }

    const tax = await this.taxRepository.findOne({
      where: { label: createTaxDto.label },
    });
    if (tax) {
      throw new TaxAlreadyExistsException();
    }
    return this.taxRepository.save(createTaxDto);
  }

  async saveMany(createTaxDtos: CreateTaxDto[]): Promise<TaxEntity[]> {
    return this.taxRepository.saveMany(createTaxDtos);
  }

  async update(
    id: number,
    updateTaxDto: UpdateTaxDto,
    userId?: string,
  ): Promise<ResponseTaxDto> {
    if (userId) {
      const cabinetId =
        await this.tenantContextService.getCurrentCabinetIdOrFail(userId);
      const tax = await this.findOneAuthorizedForCabinet(id, cabinetId, false);

      if (typeof updateTaxDto.isActive !== 'undefined') {
        await this.setCabinetTaxActive(cabinetId, id, updateTaxDto.isActive);
      }

      if (tax.isTemplate) {
        return this.findOneAuthorizedForCabinet(id, cabinetId, false);
      }

      await this.assertNoDuplicateVisibleLabel(
        updateTaxDto.label,
        cabinetId,
        id,
      );
      await this.taxRepository.update(
        id,
        this.sanitizeTaxPayload(updateTaxDto),
      );
      return this.findOneAuthorizedForCabinet(id, cabinetId, false);
    }

    const tax = await this.findOneById(id);
    await this.taxRepository.update(id, updateTaxDto);
    return tax;
  }

  async softDelete(id: number, userId?: string): Promise<ResponseTaxDto> {
    if (userId) {
      const cabinetId =
        await this.tenantContextService.getCurrentCabinetIdOrFail(userId);
      const tax = await this.findOneAuthorizedForCabinet(id, cabinetId, false);

      if (tax.isTemplate) {
        return this.setCabinetTaxActive(cabinetId, id, false) as any;
      }

      await this.setCabinetTaxActive(cabinetId, id, false);
      return this.taxRepository.softDelete(id);
    }

    await this.findOneById(id);
    return this.taxRepository.softDelete(id);
  }

  async deleteAll(): Promise<void> {
    return this.taxRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.taxRepository.getTotalCount();
  }
}
