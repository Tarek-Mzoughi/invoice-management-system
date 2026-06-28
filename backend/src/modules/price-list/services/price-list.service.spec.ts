import { BadRequestException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ArticleEntity } from 'src/modules/article/entities/article.entity';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';
import { PriceListEntity } from '../entities/price-list.entity';
import { PriceListRepository } from '../repositories/price-list.repository';
import { PriceListService } from './price-list.service';

describe('PriceListService', () => {
  let service: PriceListService;
  let repository: jest.Mocked<PriceListRepository>;
  let tenantContext: jest.Mocked<TenantContextService>;
  let articleRepository: jest.Mocked<Repository<ArticleEntity>>;
  let queryBuilder: {
    update: jest.Mock;
    set: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    execute: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      findOneById: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      getTotalCount: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      softDelete: jest.fn(),
      deleteAll: jest.fn(),
    } as unknown as jest.Mocked<PriceListRepository>;

    tenantContext = {
      getCurrentCabinetIdOrFail: jest.fn(),
      assertUserCanAccessCabinet: jest.fn(),
      scopeQueryToCabinet: jest.fn(),
      scopeQueryToCabinetField: jest.fn(),
    } as unknown as jest.Mocked<TenantContextService>;

    queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 2 }),
    };

    articleRepository = {
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    } as unknown as jest.Mocked<Repository<ArticleEntity>>;

    service = new PriceListService(
      repository,
      tenantContext,
      articleRepository,
    );
  });

  it('creates a scoped active price list by default', async () => {
    tenantContext.getCurrentCabinetIdOrFail.mockResolvedValue(7);
    repository.findOne.mockResolvedValue(null);
    repository.save.mockImplementation(async (payload) => payload as never);

    const result = await service.save({ name: ' Prix VIP ' }, 'user-1');

    expect(repository.save).toHaveBeenCalledWith({
      name: 'Prix VIP',
      cabinetId: 7,
      active: true,
    });
    expect(result).toEqual({
      name: 'Prix VIP',
      cabinetId: 7,
      active: true,
    });
  });

  it('rejects duplicate names within the same cabinet', async () => {
    tenantContext.getCurrentCabinetIdOrFail.mockResolvedValue(7);
    repository.findOne.mockResolvedValue({
      id: 12,
      name: 'Prix VIP',
      cabinetId: 7,
    } as PriceListEntity);

    await expect(
      service.save({ name: 'Prix VIP' }, 'user-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates the list and synchronizes compatible article names on rename', async () => {
    repository.findOneById.mockResolvedValue({
      id: 3,
      name: 'Ancien prix',
      active: true,
      cabinetId: 7,
    } as PriceListEntity);
    repository.findOne.mockResolvedValue(null);
    repository.save.mockImplementation(async (payload) => payload as never);

    await service.update(3, { name: 'Nouveau prix', active: false });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 3,
        name: 'Nouveau prix',
        active: false,
        cabinetId: 7,
      }),
    );
    expect(queryBuilder.set).toHaveBeenCalledWith({
      priceListName: 'Nouveau prix',
    });
    expect(queryBuilder.where).toHaveBeenCalledWith('cabinetId = :cabinetId', {
      cabinetId: 7,
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '(priceListId = :priceListId OR (priceListId IS NULL AND priceListName = :previousName))',
      { priceListId: 3, previousName: 'Ancien prix' },
    );
  });

  it('blocks deletion when articles use the price list', async () => {
    repository.findOneById.mockResolvedValue({
      id: 3,
      name: 'Prix de gros',
      cabinetId: 7,
    } as PriceListEntity);
    articleRepository.count.mockResolvedValue(2);

    await expect(service.softDelete(3)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('soft deletes an unused price list', async () => {
    const priceList = {
      id: 3,
      name: 'Prix de gros',
      cabinetId: 7,
    } as PriceListEntity;
    repository.findOneById.mockResolvedValue(priceList);
    articleRepository.count.mockResolvedValue(0);
    repository.softDelete.mockResolvedValue(priceList as never);

    const result = await service.softDelete(3);

    expect(articleRepository.count).toHaveBeenCalledWith({
      where: [
        { priceListId: 3, cabinetId: 7 },
        {
          priceListId: expect.any(Object),
          priceListName: 'Prix de gros',
          cabinetId: 7,
        },
      ],
    });
    expect(repository.softDelete).toHaveBeenCalledWith(3);
    expect(result).toBe(priceList);
  });
});
