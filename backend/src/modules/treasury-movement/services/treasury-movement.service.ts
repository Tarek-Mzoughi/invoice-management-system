import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { BankAccountRepository } from 'src/modules/bank-account/repositories/bank-account.repository';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { TREASURY_MOVEMENT_DIRECTION } from '../enums/treasury-movement-direction.enum';
import { TREASURY_MOVEMENT_KIND } from '../enums/treasury-movement-kind.enum';
import { CreateTreasuryMovementDto } from '../dtos/treasury-movement.create.dto';
import { TreasuryMovementEntity } from '../entities/treasury-movement.entity';
import { TreasuryMovementRepository } from '../repositories/treasury-movement.repository';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';

@Injectable()
export class TreasuryMovementService {
  constructor(
    private readonly treasuryMovementRepository: TreasuryMovementRepository,
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly tenantContextService: TenantContextService,
  ) {}

  private async resolveCabinetId(
    userId?: string,
    cabinetIdOverride?: number,
  ): Promise<number | undefined> {
    if (cabinetIdOverride) {
      return Number(cabinetIdOverride);
    }
    return userId
      ? await this.tenantContextService.getCurrentCabinetIdOrFail(userId)
      : undefined;
  }

  private withAccountJoin(query: IQueryObject = {}): IQueryObject {
    const joins = new Set(
      (query.join ?? '')
        .split(',')
        .map((join) => join.trim())
        .filter(Boolean),
    );
    joins.add('account');
    return { ...query, join: Array.from(joins).join(',') };
  }

  private async scopeQueryForCabinet(
    query: IQueryObject = {},
    userId?: string,
    cabinetIdOverride?: number,
  ): Promise<IQueryObject> {
    const cabinetId = await this.resolveCabinetId(userId, cabinetIdOverride);
    return cabinetId
      ? this.tenantContextService.scopeQueryToCabinetField(
          this.withAccountJoin(query),
          cabinetId,
          'account.cabinetId',
        )
      : { ...query };
  }

  async findOneById(
    id: number,
    userId?: string,
    cabinetIdOverride?: number,
  ): Promise<TreasuryMovementEntity> {
    const cabinetId = await this.resolveCabinetId(userId, cabinetIdOverride);
    const movement = await this.treasuryMovementRepository.findOne({
      where: cabinetId ? ({ id, account: { cabinetId } } as any) : { id },
      relations: ['account', 'currency'],
    } as FindOneOptions<TreasuryMovementEntity>);
    if (!movement) {
      throw new NotFoundException(`Treasury movement with id ${id} not found`);
    }
    return movement;
  }

  async findOneByCondition(
    query: IQueryObject = {},
    userId?: string,
    cabinetIdOverride?: number,
  ): Promise<TreasuryMovementEntity | null> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForCabinet(
      query,
      userId,
      cabinetIdOverride,
    );
    const queryOptions = queryBuilder.build(scopedQuery);
    return this.treasuryMovementRepository.findOne(
      queryOptions as FindOneOptions<TreasuryMovementEntity>,
    );
  }

  async findAll(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<TreasuryMovementEntity[]> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForCabinet(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    return this.treasuryMovementRepository.findAll(
      queryOptions as FindManyOptions<TreasuryMovementEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
    userId?: string,
  ): Promise<PageDto<TreasuryMovementEntity>> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForCabinet(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const count = await this.treasuryMovementRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.treasuryMovementRepository.findAll(
      queryOptions as FindManyOptions<TreasuryMovementEntity>,
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
    createTreasuryMovementDto: CreateTreasuryMovementDto,
    userId?: string,
    cabinetIdOverride?: number,
  ): Promise<TreasuryMovementEntity> {
    const cabinetId = await this.resolveCabinetId(userId, cabinetIdOverride);
    const account = await this.bankAccountRepository.findOneById(
      createTreasuryMovementDto.accountId,
    );

    if (
      !account ||
      account.deletedAt ||
      (cabinetId && account.cabinetId !== cabinetId)
    ) {
      throw new BadRequestException('Treasury account not found');
    }

    if (!account.currencyId) {
      throw new BadRequestException('Treasury account currency is missing');
    }

    if (createTreasuryMovementDto.currencyId !== account.currencyId) {
      throw new BadRequestException(
        'Treasury movement currency must match the account currency',
      );
    }

    if (
      createTreasuryMovementDto.kind === TREASURY_MOVEMENT_KIND.EXPENSE &&
      createTreasuryMovementDto.direction !== TREASURY_MOVEMENT_DIRECTION.OUT
    ) {
      throw new BadRequestException(
        'Expense treasury movements must use an outgoing direction',
      );
    }

    return this.treasuryMovementRepository.save({
      ...createTreasuryMovementDto,
      movementDate: new Date(createTreasuryMovementDto.movementDate),
    });
  }

  async softDelete(
    id: number,
    userId?: string,
    cabinetIdOverride?: number,
  ): Promise<TreasuryMovementEntity> {
    const movement = await this.findOneById(id, userId, cabinetIdOverride);
    return this.treasuryMovementRepository.softDelete(id).then(() => movement);
  }
}
