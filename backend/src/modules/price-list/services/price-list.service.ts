import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, IsNull, Repository } from 'typeorm';
import { ArticleEntity } from 'src/modules/article/entities/article.entity';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';
import { CreatePriceListDto } from '../dtos/price-list.create.dto';
import { ResponsePriceListDto } from '../dtos/price-list.response.dto';
import { UpdatePriceListDto } from '../dtos/price-list.update.dto';
import { PriceListEntity } from '../entities/price-list.entity';
import { PriceListRepository } from '../repositories/price-list.repository';

@Injectable()
export class PriceListService {
  constructor(
    private readonly priceListRepository: PriceListRepository,
    private readonly tenantContextService: TenantContextService,
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
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

  private normalizeName(name?: string | null): string {
    return name?.trim() || '';
  }

  private async ensureNameIsAvailable(
    name: string,
    cabinetId?: number,
    excludedId?: number,
  ): Promise<void> {
    const existing = await this.priceListRepository.findOne({
      where: {
        name,
        ...(cabinetId ? { cabinetId } : {}),
      } as FindOneOptions<PriceListEntity>['where'],
    });

    if (existing && existing.id !== excludedId) {
      throw new ConflictException('Une liste de prix avec ce nom existe déjà.');
    }
  }

  async findOneById(id: number, userId?: string): Promise<PriceListEntity> {
    const priceList = userId
      ? await this.findOneByCondition({ filter: `id||$eq||${id}` }, userId)
      : await this.priceListRepository.findOneById(id);

    if (!priceList) {
      throw new BadRequestException('Liste de prix introuvable.');
    }

    return priceList as PriceListEntity;
  }

  async findOneByCondition(
    query: IQueryObject,
    userId?: string,
  ): Promise<ResponsePriceListDto | null> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const priceList = await this.priceListRepository.findOne(
      queryOptions as FindOneOptions<PriceListEntity>,
    );
    if (!priceList) return null;
    return priceList;
  }

  async findAll(
    query: IQueryObject,
    userId?: string,
  ): Promise<ResponsePriceListDto[]> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    return this.priceListRepository.findAll(
      queryOptions as FindManyOptions<PriceListEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
    userId?: string,
  ): Promise<PageDto<ResponsePriceListDto>> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const count = await this.priceListRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.priceListRepository.findAll(
      queryOptions as FindManyOptions<PriceListEntity>,
    );

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto: {
        page: Number(query.page),
        take: Number(query.limit),
      },
      itemCount: count,
    });

    return new PageDto(entities, pageMetaDto);
  }

  async findOneByIdInCabinet(
    id: number,
    cabinetId: number,
  ): Promise<PriceListEntity> {
    const priceList = await this.priceListRepository.findOne({
      where: { id, cabinetId },
    });

    if (!priceList) {
      throw new BadRequestException('Liste de prix introuvable.');
    }

    return priceList;
  }

  async findOneByNameInCabinet(
    name: string,
    cabinetId: number,
  ): Promise<PriceListEntity | null> {
    return this.priceListRepository.findOne({
      where: { name: this.normalizeName(name), cabinetId },
    });
  }

  async save(
    createPriceListDto: CreatePriceListDto,
    userId?: string,
  ): Promise<ResponsePriceListDto> {
    const cabinetId = userId
      ? await this.tenantContextService.getCurrentCabinetIdOrFail(userId)
      : (createPriceListDto as CreatePriceListDto & { cabinetId?: number })
          .cabinetId;
    const name = this.normalizeName(createPriceListDto.name);

    if (!name) {
      throw new BadRequestException('Le nom de la liste de prix est requis.');
    }

    await this.ensureNameIsAvailable(name, cabinetId);

    return this.priceListRepository.save({
      name,
      cabinetId,
      active: createPriceListDto.active ?? true,
    });
  }

  async update(
    id: number,
    updatePriceListDto: UpdatePriceListDto,
    userId?: string,
  ): Promise<ResponsePriceListDto> {
    const existingPriceList = await this.findOneById(id, userId);
    const nextName =
      typeof updatePriceListDto.name === 'undefined'
        ? existingPriceList.name
        : this.normalizeName(updatePriceListDto.name);

    if (!nextName) {
      throw new BadRequestException('Le nom de la liste de prix est requis.');
    }

    await this.ensureNameIsAvailable(nextName, existingPriceList.cabinetId, id);

    const updatedPriceList = await this.priceListRepository.save({
      ...existingPriceList,
      name: nextName,
      active: updatePriceListDto.active ?? existingPriceList.active,
      cabinetId: existingPriceList.cabinetId,
    });

    if (nextName !== existingPriceList.name) {
      await this.articleRepository
        .createQueryBuilder()
        .update(ArticleEntity)
        .set({ priceListName: nextName })
        .where('cabinetId = :cabinetId', {
          cabinetId: existingPriceList.cabinetId,
        })
        .andWhere(
          '(priceListId = :priceListId OR (priceListId IS NULL AND priceListName = :previousName))',
          {
            priceListId: existingPriceList.id,
            previousName: existingPriceList.name,
          },
        )
        .execute();
    }

    return updatedPriceList;
  }

  async softDelete(id: number, userId?: string): Promise<ResponsePriceListDto> {
    const priceList = await this.findOneById(id, userId);
    const usageCount = await this.articleRepository.count({
      where: [
        {
          priceListId: priceList.id,
          cabinetId: priceList.cabinetId,
        },
        {
          priceListId: IsNull(),
          priceListName: priceList.name,
          cabinetId: priceList.cabinetId,
        },
      ],
    });

    if (usageCount > 0) {
      throw new BadRequestException(
        'Cette liste de prix est utilisée par des articles. Désactivez-la au lieu de la supprimer.',
      );
    }

    return this.priceListRepository.softDelete(id);
  }
}
