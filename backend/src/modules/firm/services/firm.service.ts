import { Injectable } from '@nestjs/common';
import { FirmRepository } from '../repositories/firm.repository';
import { FirmEntity } from '../entities/firm.entity';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { CreateFirmDto } from '../dtos/firm.create.dto';
import { FirmNotFoundException } from '../errors/firm.notfound.error';
import { UpdateFirmDto } from '../dtos/firm.update.dto';
import { ResponseFirmDto } from '../dtos/firm.response.dto';
import { InterlocutorService } from 'src/modules/interlocutor/services/interlocutor.service';
import {
  FirmAlreadyExistsException,
  TaxIdNumberDuplicateException,
} from '../errors/firm.alreadyexists.error';
import { AddressService } from 'src/modules/address/services/address.service';
import { CurrencyService } from 'src/modules/currency/services/currency.service';
import { ActivityService } from 'src/modules/activity/services/activity.service';
import { PaymentConditionService } from 'src/modules/payment-condition/services/payment-condition.service';
import { FirmInterlocutorEntryService } from 'src/modules/firm-interlocutor-entry/services/firm-interlocutor-entry.service';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FIRM_ENTITY_TYPE } from '../enums/firm-entity-type.enum';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';

@Injectable()
export class FirmService {
  constructor(
    private readonly firmRepository: FirmRepository,
    private readonly activityService: ActivityService,
    private readonly currencyService: CurrencyService,
    private readonly addressService: AddressService,
    private readonly paymentConditionService: PaymentConditionService,
    private readonly interlocutorService: InterlocutorService,
    private readonly firmInterlocutorEntryService: FirmInterlocutorEntryService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  private normalizeEntityType(entityType?: FIRM_ENTITY_TYPE): FIRM_ENTITY_TYPE {
    return entityType === FIRM_ENTITY_TYPE.SUPPLIERS
      ? FIRM_ENTITY_TYPE.SUPPLIERS
      : FIRM_ENTITY_TYPE.CLIENTS;
  }

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

  private buildDuplicateWhere(
    field: 'name' | 'taxIdNumber',
    value: string,
    cabinetId?: number,
  ) {
    return cabinetId ? { [field]: value, cabinetId } : { [field]: value };
  }

  private async findScopedFirmOrFail(
    id: number,
    userId?: string,
    join?: string,
  ): Promise<FirmEntity> {
    const firm = await this.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        ...(join ? { join } : {}),
      },
      userId,
    );

    if (!firm) {
      throw new FirmNotFoundException();
    }

    return firm as FirmEntity;
  }

  async findOneById(id: number): Promise<FirmEntity> {
    const firm = await this.firmRepository.findOneById(id);
    if (!firm) {
      throw new FirmNotFoundException();
    }
    return firm;
  }

  async findOneByIdInCabinet(
    id: number,
    cabinetId: number,
  ): Promise<FirmEntity> {
    const firm = await this.firmRepository.findOne({
      where: { id, cabinetId },
    });
    if (!firm) {
      throw new FirmNotFoundException();
    }
    return firm;
  }

  async findOneByCondition(
    query: IQueryObject,
    userId?: string,
  ): Promise<ResponseFirmDto | null> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const firm = await this.firmRepository.findOne(
      queryOptions as FindOneOptions<FirmEntity>,
    );
    if (!firm) return null;
    return firm;
  }

  async findAll(
    query: IQueryObject,
    userId?: string,
  ): Promise<ResponseFirmDto[]> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    return await this.firmRepository.findAll(
      queryOptions as FindManyOptions<FirmEntity>,
    );
  }

  async findAllPaginated(
    query: IQueryObject,
    userId?: string,
  ): Promise<PageDto<ResponseFirmDto>> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const count = await this.firmRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.firmRepository.findAll(
      queryOptions as FindManyOptions<FirmEntity>,
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
    createFirmDto: CreateFirmDto,
    userId?: string,
  ): Promise<FirmEntity> {
    const entityType = this.normalizeEntityType(createFirmDto.entityType);
    const cabinetId = userId
      ? await this.tenantContextService.getCurrentCabinetIdOrFail(userId)
      : createFirmDto.cabinetId;
    let firm = await this.firmRepository.findOne({
      where: this.buildDuplicateWhere('name', createFirmDto.name, cabinetId),
    });
    if (firm) {
      throw new FirmAlreadyExistsException();
    }

    if (!createFirmDto.isPerson) {
      firm = await this.firmRepository.findOne({
        where: this.buildDuplicateWhere(
          'taxIdNumber',
          createFirmDto.taxIdNumber,
          cabinetId,
        ),
      });

      if (firm) {
        throw new TaxIdNumberDuplicateException();
      }
    } else {
      delete createFirmDto.taxIdNumber;
    }

    const firmPayload = { ...createFirmDto };
    delete firmPayload.cabinetId;

    const invoicingAddress = await this.addressService.save(
      createFirmDto.invoicingAddress,
    );
    const deliveryAddress = await this.addressService.save(
      createFirmDto.deliveryAddress,
    );
    const savedFirm = await this.firmRepository.save({
      ...firmPayload,
      entityType,
      cabinetId,
      invoicingAddressId: invoicingAddress.id,
      deliveryAddressId: deliveryAddress.id,
    });

    const mainInterlocutor = await this.interlocutorService.save(
      createFirmDto.mainInterlocutor,
    );

    await this.firmInterlocutorEntryService.save({
      firmId: savedFirm.id,
      interlocutorId: mainInterlocutor.id,
      isMain: true,
      position: createFirmDto.mainInterlocutor.position,
    });

    return savedFirm;
  }

  async saveMany(
    createFirmDtos: CreateFirmDto[],
    userId?: string,
  ): Promise<FirmEntity[]> {
    const savedFirms: FirmEntity[] = [];
    for (const dto of createFirmDtos) {
      const savedEntry = await this.save(dto, userId);
      savedFirms.push(savedEntry);
    }
    return savedFirms;
  }

  async update(
    id: number,
    updateFirmDto: UpdateFirmDto,
    userId?: string,
  ): Promise<FirmEntity> {
    const firmId = Number(id);
    const existingFirm = await this.findScopedFirmOrFail(
      firmId,
      userId,
      'interlocutorsToFirm',
    );

    if (updateFirmDto.name) {
      const firm = await this.firmRepository.findOne({
        where: this.buildDuplicateWhere(
          'name',
          updateFirmDto.name,
          existingFirm.cabinetId,
        ),
      });
      if (firm && firm.id !== firmId) {
        throw new FirmAlreadyExistsException();
      }
    }

    //check if new taxIdNumber already exists & throw error if so
    if (updateFirmDto.taxIdNumber) {
      const firm = await this.firmRepository.findOne({
        where: this.buildDuplicateWhere(
          'taxIdNumber',
          updateFirmDto.taxIdNumber,
          existingFirm.cabinetId,
        ),
      });
      if (firm && firm.id !== firmId) {
        throw new TaxIdNumberDuplicateException();
      }
    }

    // update the main interlocutor by looking up in the firmInterlocutorEntry table
    const mainInterlocutorId = existingFirm.interlocutorsToFirm.find(
      (entry) => entry.isMain,
    ).interlocutorId;

    const existingMainInterlocutor =
      await this.interlocutorService.findOneByCondition({
        filter: `id||$eq||${mainInterlocutorId}`,
      });

    //update main interlocutor position independently
    this.firmInterlocutorEntryService.update(
      existingFirm.interlocutorsToFirm.find((entry) => entry.isMain).id,
      {
        firmId: existingFirm.id,
        interlocutorId: mainInterlocutorId,
        position: updateFirmDto.mainInterlocutor.position,
      },
    );

    this.interlocutorService.update(mainInterlocutorId, {
      ...existingMainInterlocutor,
      ...updateFirmDto.mainInterlocutor,
      //force undefined position to update the interlocutor entity
      position: undefined,
    });

    //invoicing address
    const invoicingAddress = updateFirmDto.invoicingAddress
      ? await this.addressService.findOneById(existingFirm.invoicingAddressId)
      : existingFirm.invoicingAddress;

    //update the invoicing address
    if (updateFirmDto.invoicingAddress) {
      await this.addressService.update(existingFirm.invoicingAddressId, {
        ...invoicingAddress,
        ...updateFirmDto.invoicingAddress,
      });
    }

    //delivery address
    const deliveryAddress = updateFirmDto.deliveryAddress
      ? await this.addressService.findOneById(existingFirm.deliveryAddressId)
      : existingFirm.deliveryAddress;

    //update the delivery address
    if (updateFirmDto.deliveryAddress) {
      await this.addressService.update(existingFirm.deliveryAddressId, {
        ...deliveryAddress,
        ...updateFirmDto.deliveryAddress,
      });
    }

    //activity
    const activity = await this.activityService.findOneById(
      updateFirmDto.activityId,
    );

    //currency
    const currency = await this.currencyService.findOneById(
      updateFirmDto.currencyId,
    );

    //payment condition
    const paymentCondition = await this.paymentConditionService.findOneById(
      updateFirmDto.paymentConditionId,
    );

    const firmUpdatePayload = { ...updateFirmDto };
    delete firmUpdatePayload.cabinetId;

    return this.firmRepository.save({
      ...existingFirm,
      ...firmUpdatePayload,
      entityType: this.normalizeEntityType(
        updateFirmDto.entityType ?? existingFirm.entityType,
      ),
      cabinetId: existingFirm.cabinetId,
      activity,
      currency,
      paymentCondition,
    });
  }

  async softDelete(id: number, userId?: string): Promise<FirmEntity> {
    const firmId = Number(id);
    if (userId) {
      await this.findScopedFirmOrFail(firmId, userId);
    }

    const deletedFirm = await this.firmRepository.softDelete(firmId);
    if (!deletedFirm) {
      throw new FirmNotFoundException();
    }
    return deletedFirm;
  }

  async setActive(
    id: number,
    isActive: boolean,
    userId?: string,
  ): Promise<FirmEntity> {
    const firm = await this.findScopedFirmOrFail(Number(id), userId);
    return this.firmRepository.save({
      ...firm,
      isActive,
    });
  }

  async deleteAll() {
    return this.firmRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.firmRepository.getTotalCount();
  }
}
