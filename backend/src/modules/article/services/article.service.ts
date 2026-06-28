import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { StorageService } from 'src/shared/storage/services/storage.service';
import { ArticleRepository } from '../repositories/article.repository';
import { ArticleEntity } from '../entities/article.entity';
import { ArticleNotFoundException } from '../errors/article.notfound.error';
import { ResponseArticleDto } from '../dtos/article.response.dto';
import { CreateArticleDto } from '../dtos/article.create.dto';
import { UpdateArticleDto } from '../dtos/article.update.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { FindManyOptions, FindOneOptions, In, Repository } from 'typeorm';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';
import { PriceListEntity } from 'src/modules/price-list/entities/price-list.entity';
import { TaxService } from 'src/modules/tax/services/tax.service';

@Injectable()
export class ArticleService {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly storageService: StorageService,
    private readonly tenantContextService: TenantContextService,
    @InjectRepository(PriceListEntity)
    private readonly priceListRepository: Repository<PriceListEntity>,
    private readonly taxService: TaxService,
  ) {}

  private async scopeQueryForUser(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<IQueryObject> {
    if (!userId) {
      return { ...query };
    }

    const cabinetId =
      await this.tenantContextService.getCurrentCabinetIdOrFail(userId);
    return this.tenantContextService.scopeQueryToCabinet(query, cabinetId);
  }

  private normalizeNumberArray(value?: number[] | null): number[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(
      new Set(
        value
          .map((entry) => Number(entry))
          .filter((entry) => Number.isInteger(entry) && entry > 0),
      ),
    );
  }

  private async confirmStorageIds(ids?: number[] | null): Promise<void> {
    const normalizedIds = this.normalizeNumberArray(ids);
    await Promise.all(
      normalizedIds.map(async (id) => {
        try {
          await this.storageService.confirm(id);
        } catch {
          return null;
        }
      }),
    );
  }

  private async resolveImageId(
    currentId?: number | null,
    nextId?: number | null,
  ): Promise<number | null> {
    if (typeof nextId === 'undefined') {
      return currentId ?? null;
    }

    if (nextId) {
      try {
        await this.storageService.confirm(nextId);
      } catch {
        return currentId ?? null;
      }
    }

    if (currentId && currentId !== nextId) {
      await this.storageService.delete(currentId);
    }

    return nextId ?? null;
  }

  private normalizePayload(
    payload: CreateArticleDto | UpdateArticleDto,
  ): Partial<ArticleEntity> {
    return {
      ...payload,
      destination: payload.destination,
      articleType: payload.articleType,
      taxIds: this.normalizeNumberArray(payload.taxIds),
      additionalTaxIds: this.normalizeNumberArray(payload.additionalTaxIds),
      attachmentIds: this.normalizeNumberArray(payload.attachmentIds),
      salePrice:
        typeof payload.salePrice === 'number'
          ? Number(payload.salePrice)
          : null,
      purchasePrice:
        typeof payload.purchasePrice === 'number'
          ? Number(payload.purchasePrice)
          : null,
      productionCost:
        typeof payload.productionCost === 'number'
          ? Number(payload.productionCost)
          : null,
      stockAlertThreshold:
        typeof payload.stockAlertThreshold === 'number'
          ? Number(payload.stockAlertThreshold)
          : null,
      stockQuantity:
        typeof payload.stockQuantity === 'number'
          ? Number(payload.stockQuantity)
          : undefined,
      discountValue:
        typeof payload.discountValue === 'number'
          ? Number(payload.discountValue)
          : null,
      reference: payload.reference?.trim() || null,
      description: payload.description?.trim() || null,
      unit: payload.unit?.trim() || null,
      family: payload.family?.trim() || null,
      subFamily: payload.subFamily?.trim() || null,
      brand: payload.brand?.trim() || null,
      priceListName: payload.priceListName?.trim() || null,
      priceListId:
        typeof payload.priceListId === 'number' && payload.priceListId > 0
          ? Number(payload.priceListId)
          : null,
      barcode: payload.barcode?.trim() || null,
      privateNotes: payload.privateNotes?.trim() || null,
      defaultWarehouse: payload.defaultWarehouse?.trim() || null,
      priceListPrices: payload.priceListPrices || null,
    };
  }

  private async resolvePriceListSelection(
    payload: CreateArticleDto | UpdateArticleDto,
    cabinetId?: number,
    currentArticle?: ArticleEntity,
  ): Promise<Pick<ArticleEntity, 'priceListId' | 'priceListName'>> {
    const hasPriceListId = Object.prototype.hasOwnProperty.call(
      payload,
      'priceListId',
    );
    const hasPriceListName = Object.prototype.hasOwnProperty.call(
      payload,
      'priceListName',
    );

    if (!hasPriceListId && !hasPriceListName && currentArticle) {
      return {
        priceListId: currentArticle.priceListId ?? null,
        priceListName: currentArticle.priceListName ?? null,
      };
    }

    const requestedPriceListId = Number(payload.priceListId);
    if (hasPriceListId && Number.isInteger(requestedPriceListId)) {
      if (requestedPriceListId <= 0) {
        return {
          priceListId: null,
          priceListName: payload.priceListName?.trim() || null,
        };
      }

      const priceList = await this.priceListRepository.findOne({
        where: {
          id: requestedPriceListId,
          ...(cabinetId ? { cabinetId } : {}),
        },
      });

      if (!priceList) {
        throw new BadRequestException(
          'La liste de prix sélectionnée est introuvable.',
        );
      }

      return {
        priceListId: priceList.id,
        priceListName: priceList.name,
      };
    }

    const requestedPriceListName = payload.priceListName?.trim();
    if (requestedPriceListName && cabinetId) {
      const priceList = await this.priceListRepository.findOne({
        where: {
          name: requestedPriceListName,
          cabinetId,
        },
      });

      if (priceList) {
        return {
          priceListId: priceList.id,
          priceListName: priceList.name,
        };
      }
    }

    return {
      priceListId: null,
      priceListName: requestedPriceListName || null,
    };
  }

  private async assertTaxesBelongToCabinet(
    payload: CreateArticleDto | UpdateArticleDto,
    cabinetId?: number,
  ): Promise<void> {
    if (!cabinetId) {
      return;
    }

    const taxIds = this.normalizeNumberArray([
      ...(payload.taxIds ?? []),
      ...(payload.additionalTaxIds ?? []),
    ]);

    await Promise.all(
      taxIds.map((taxId) =>
        this.taxService.findOneAuthorizedForCabinet(taxId, cabinetId, true),
      ),
    );
  }

  async findOneById(id: number, userId?: string): Promise<ArticleEntity> {
    const article = userId
      ? await this.findOneByCondition({ filter: `id||$eq||${id}` }, userId)
      : await this.articleRepository.findOneById(id);
    if (!article) {
      throw new ArticleNotFoundException();
    }
    return article as ArticleEntity;
  }

  async findOneByCondition(
    query: IQueryObject,
    userId?: string,
  ): Promise<ResponseArticleDto | null> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const article = await this.articleRepository.findOne(
      queryOptions as FindOneOptions<ArticleEntity>,
    );
    if (!article) return null;
    return article;
  }

  async findAll(
    query: IQueryObject,
    userId?: string,
  ): Promise<ResponseArticleDto[]> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    return await this.articleRepository.findAll(
      queryOptions as FindManyOptions<ArticleEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
    userId?: string,
  ): Promise<PageDto<ResponseArticleDto>> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const count = await this.articleRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.articleRepository.findAll(
      queryOptions as FindManyOptions<ArticleEntity>,
    );

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto: {
        page: parseInt(query.page),
        take: parseInt(query.limit),
      },
      itemCount: count,
    });

    return new PageDto(entities, pageMetaDto);
  }

  async save(
    createArticleDto: CreateArticleDto,
    userId?: string,
  ): Promise<ArticleEntity> {
    const cabinetId = userId
      ? await this.tenantContextService.getCurrentCabinetIdOrFail(userId)
      : (createArticleDto as CreateArticleDto & { cabinetId?: number })
          .cabinetId;
    await this.confirmStorageIds(createArticleDto.attachmentIds);
    const imageId = await this.resolveImageId(null, createArticleDto.imageId);
    const priceListSelection = await this.resolvePriceListSelection(
      createArticleDto,
      cabinetId,
    );
    await this.assertTaxesBelongToCabinet(createArticleDto, cabinetId);
    return this.articleRepository.save({
      ...this.normalizePayload(createArticleDto),
      ...priceListSelection,
      cabinetId,
      imageId,
    });
  }

  async saveMany(
    createArticleDtos: CreateArticleDto[],
  ): Promise<ArticleEntity[]> {
    return this.articleRepository.saveMany(createArticleDtos);
  }

  async update(
    id: number,
    updateActivityDto: UpdateArticleDto,
    userId?: string,
  ): Promise<ArticleEntity> {
    const article = await this.findOneById(id, userId);
    await this.confirmStorageIds(updateActivityDto.attachmentIds);
    const imageId = await this.resolveImageId(
      article.imageId,
      updateActivityDto.imageId,
    );
    const priceListSelection = await this.resolvePriceListSelection(
      updateActivityDto,
      article.cabinetId,
      article,
    );
    await this.assertTaxesBelongToCabinet(updateActivityDto, article.cabinetId);

    return this.articleRepository.save({
      ...article,
      ...this.normalizePayload(updateActivityDto),
      ...priceListSelection,
      cabinetId: article.cabinetId,
      imageId,
    });
  }

  async softDelete(id: number, userId?: string): Promise<ArticleEntity> {
    await this.findOneById(id, userId);
    return this.articleRepository.softDelete(id);
  }

  async assertArticlesBelongToCabinet(
    articleIds: (number | undefined | null)[],
    cabinetId: number,
  ): Promise<void> {
    const normalizedIds = Array.from(
      new Set(
        articleIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );

    if (!normalizedIds.length) {
      return;
    }

    const articles = await this.articleRepository.findAll({
      where: {
        id: In(normalizedIds),
        cabinetId,
      } as FindManyOptions<ArticleEntity>['where'],
    });

    if (articles.length !== normalizedIds.length) {
      throw new BadRequestException(
        'One or more articles do not belong to the current cabinet',
      );
    }
  }

  async deleteAll() {
    return this.articleRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.articleRepository.getTotalCount();
  }

  async decrementStock(id: number, quantity: number): Promise<void> {
    const article = await this.findOneById(id);
    if (!article.isService) {
      const currentStock = article.stockQuantity || 0;
      await this.articleRepository.save({
        ...article,
        stockQuantity: currentStock - quantity,
      });
    }
  }

  async incrementStock(id: number, quantity: number): Promise<void> {
    const article = await this.findOneById(id);
    if (!article.isService) {
      const currentStock = article.stockQuantity || 0;
      await this.articleRepository.save({
        ...article,
        stockQuantity: currentStock + quantity,
      });
    }
  }
}
