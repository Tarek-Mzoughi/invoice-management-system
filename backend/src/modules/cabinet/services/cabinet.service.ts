import { Injectable } from '@nestjs/common';
import { CabinetEntity } from '../entities/cabinet.entity';
import { AddressService } from 'src/modules/address/services/address.service';
import { CabinetNotFoundException } from '../errors/cabinet.notfound.error';
import { UpdateCabinetDto } from '../dtos/cabinet.update.dto';
import { CurrencyService } from 'src/modules/currency/services/currency.service';
import { ActivityService } from 'src/modules/activity/services/activity.service';
import { CabinetRepository } from '../repositories/cabinet.repository';
import { StorageService } from 'src/shared/storage/services/storage.service';
import { DeepPartial } from 'typeorm';
import { CountryService } from 'src/modules/country/services/country.service';
import { ActivityEntity } from 'src/modules/activity/entities/activity.entity';
import { AddressEntity } from 'src/modules/address/entities/address.entity';
import { CABINET_INVOICE_DISPLAY_TYPE } from '../enums/cabinet-invoice-display-type.enum';

@Injectable()
export class CabinetService {
  constructor(
    private readonly cabinetRepository: CabinetRepository,
    private readonly addressService: AddressService,
    private readonly currencyService: CurrencyService,
    private readonly activityService: ActivityService,
    private readonly countryService: CountryService,
    private readonly uploadService: StorageService,
  ) {}

  private normalizePhoneNumbers(
    phoneNumbers?: string[] | null,
    fallbackPhone?: string | null,
  ): string[] {
    const normalizedPhoneNumbers = (phoneNumbers ?? [])
      .map((phone) => phone?.trim())
      .filter((phone): phone is string => Boolean(phone));

    if (normalizedPhoneNumbers.length > 0) {
      return Array.from(new Set(normalizedPhoneNumbers));
    }

    const normalizedPhone = fallbackPhone?.trim();
    return normalizedPhone ? [normalizedPhone] : [];
  }

  private hasAddressPayload(
    address?: DeepPartial<AddressEntity> | null,
  ): address is DeepPartial<AddressEntity> {
    if (!address) {
      return false;
    }

    return [address.address, address.address2, address.region, address.zipcode]
      .map((value) => value?.toString().trim())
      .some(Boolean)
      ? true
      : Boolean(address.countryId);
  }

  private async resolveActivities(
    activityIds?: number[] | null,
    fallbackActivityId?: number | null,
  ): Promise<ActivityEntity[]> {
    const ids = Array.from(
      new Set(
        [...(activityIds ?? []), fallbackActivityId]
          .filter((id): id is number => typeof id === 'number' && !isNaN(id))
          .map((id) => Number(id)),
      ),
    );

    if (ids.length === 0) {
      return [];
    }

    return Promise.all(
      ids.map((activityId) => this.activityService.findOneById(activityId)),
    );
  }

  private async resolveCountry(countryId?: number | null) {
    if (!countryId) {
      return null;
    }

    return this.countryService.findOneById(countryId);
  }

  private async resolveCurrency(currencyId?: number | null) {
    if (!currencyId) {
      return null;
    }

    return this.currencyService.findOneById(currencyId);
  }

  private async upsertAddress(
    currentAddressId?: number | null,
    addressDto?: DeepPartial<AddressEntity> | null,
    allowEmpty = false,
  ): Promise<AddressEntity | null> {
    if (typeof addressDto === 'undefined') {
      if (!currentAddressId) {
        return null;
      }

      return this.addressService.findOneById(currentAddressId);
    }

    if (!this.hasAddressPayload(addressDto)) {
      if (allowEmpty) {
        return null;
      }

      if (!currentAddressId) {
        return null;
      }

      return this.addressService.findOneById(currentAddressId);
    }

    if (currentAddressId) {
      return this.addressService.update(currentAddressId, {
        ...(addressDto as any),
      });
    }

    return this.addressService.save(addressDto as any);
  }

  private async resolveStorageId(
    currentId: number | null | undefined,
    nextId: number | null | undefined,
  ): Promise<number | null> {
    if (typeof nextId === 'undefined') {
      return currentId ?? null;
    }

    if (currentId && currentId !== nextId) {
      await this.uploadService.delete(currentId);
    }

    return nextId ?? null;
  }

  private normalizeCabinet(cabinet: CabinetEntity): CabinetEntity {
    const phoneNumbers = this.normalizePhoneNumbers(
      cabinet.phoneNumbers,
      cabinet.phone,
    );
    const activities =
      cabinet.activities?.length > 0
        ? cabinet.activities
        : cabinet.activity
          ? [cabinet.activity]
          : [];

    return Object.assign(cabinet, {
      phoneNumbers,
      phone: phoneNumbers[0] ?? null,
      activities,
      activity: cabinet.activity ?? activities[0] ?? null,
      activityId: cabinet.activityId ?? activities[0]?.id ?? null,
      invoicingAddress: cabinet.address ?? null,
      countryId: cabinet.countryId ?? cabinet.address?.countryId ?? null,
      invoiceDisplayType:
        cabinet.invoiceDisplayType ?? CABINET_INVOICE_DISPLAY_TYPE.INVOICE,
    });
  }

  async findOneById(id: number): Promise<CabinetEntity> {
    const cabinet = await (
      await this.cabinetRepository.createQueryBuilder('cabinet')
    )
      .leftJoinAndSelect('cabinet.address', 'address')
      .leftJoinAndSelect('cabinet.deliveryAddress', 'deliveryAddress')
      .leftJoinAndSelect('cabinet.currency', 'currency')
      .leftJoinAndSelect('cabinet.activity', 'activity')
      .leftJoinAndSelect('cabinet.activities', 'activities')
      .leftJoinAndSelect('cabinet.country', 'cabinetCountry')
      .leftJoinAndSelect('address.country', 'addressCountry')
      .leftJoinAndSelect('deliveryAddress.country', 'deliveryCountry')
      .where('cabinet.id = :id', { id })
      .getOne();

    if (!cabinet) {
      throw new CabinetNotFoundException();
    }
    return this.normalizeCabinet(cabinet);
  }
  async findAll(): Promise<CabinetEntity[]> {
    const cabinets = await this.cabinetRepository.findAll({
      relations: [
        'address',
        'address.country',
        'deliveryAddress',
        'deliveryAddress.country',
        'currency',
        'activity',
        'activities',
        'country',
      ],
    });

    return cabinets.map((cabinet) => this.normalizeCabinet(cabinet));
  }

  async createOnboardingDraft(): Promise<CabinetEntity> {
    const cabinet = await this.cabinetRepository.save({
      onboardingCompleted: false,
      onboardingCompletedAt: null,
    });

    return this.findOneById(cabinet.id);
  }

  async save(
    createCabinetDto: DeepPartial<CabinetEntity>,
  ): Promise<CabinetEntity> {
    const [activities, currency, country] = await Promise.all([
      this.resolveActivities(
        (createCabinetDto as any).activityIds,
        createCabinetDto.activityId,
      ),
      this.resolveCurrency(createCabinetDto.currencyId),
      this.resolveCountry((createCabinetDto as any).countryId),
    ]);

    const invoicingAddress =
      createCabinetDto.addressId &&
      !(createCabinetDto as any).invoicingAddress &&
      !createCabinetDto.address
        ? await this.addressService.findOneById(createCabinetDto.addressId)
        : await this.upsertAddress(
            null,
            ((createCabinetDto as any).invoicingAddress ??
              createCabinetDto.address) as DeepPartial<AddressEntity>,
          );

    const deliveryAddress =
      (createCabinetDto as any).deliveryAddressId &&
      !(createCabinetDto as any).deliveryAddress
        ? await this.addressService.findOneById(
            (createCabinetDto as any).deliveryAddressId,
          )
        : await this.upsertAddress(
            null,
            (createCabinetDto as any)
              .deliveryAddress as DeepPartial<AddressEntity>,
            true,
          );

    const phoneNumbers = this.normalizePhoneNumbers(
      (createCabinetDto as any).phoneNumbers,
      createCabinetDto.phone,
    );
    const primaryActivity = activities[0] ?? null;

    const cabinet = await this.cabinetRepository.save({
      ...createCabinetDto,
      address: invoicingAddress,
      addressId: invoicingAddress?.id ?? createCabinetDto.addressId ?? null,
      deliveryAddress,
      deliveryAddressId:
        deliveryAddress?.id ??
        (createCabinetDto as any).deliveryAddressId ??
        null,
      activities,
      activity: primaryActivity,
      activityId: primaryActivity?.id ?? createCabinetDto.activityId ?? null,
      currency,
      country,
      countryId: country?.id ?? (createCabinetDto as any).countryId ?? null,
      phoneNumbers,
      phone: phoneNumbers[0] ?? null,
      invoiceDisplayType:
        (createCabinetDto as any).invoiceDisplayType ??
        CABINET_INVOICE_DISPLAY_TYPE.INVOICE,
      stampId: (createCabinetDto as any).stampId ?? null,
    });

    return this.findOneById(cabinet.id);
  }

  async update(
    id: number,
    updateCabinetDto: UpdateCabinetDto,
  ): Promise<CabinetEntity> {
    const cabinet = await this.findOneById(id);

    const currentActivityIds =
      cabinet.activities?.map((activity) => activity.id).filter(Boolean) ?? [];
    const requestedActivityIds =
      typeof updateCabinetDto.activityIds !== 'undefined'
        ? updateCabinetDto.activityIds
        : currentActivityIds;

    const [activities, currency, country, logoId, signatureId, stampId] =
      await Promise.all([
        this.resolveActivities(
          requestedActivityIds,
          updateCabinetDto.activityId ?? cabinet.activityId,
        ),
        this.resolveCurrency(updateCabinetDto.currencyId ?? cabinet.currencyId),
        this.resolveCountry(updateCabinetDto.countryId ?? cabinet.countryId),
        this.resolveStorageId(cabinet.logoId, updateCabinetDto.logoId),
        this.resolveStorageId(
          cabinet.signatureId,
          updateCabinetDto.signatureId,
        ),
        this.resolveStorageId(cabinet.stampId, updateCabinetDto.stampId),
      ]);

    const invoicingAddress = await this.upsertAddress(
      cabinet.addressId,
      (updateCabinetDto.invoicingAddress ??
        updateCabinetDto.address) as DeepPartial<AddressEntity>,
    );

    const deliveryAddress = await this.upsertAddress(
      cabinet.deliveryAddressId,
      updateCabinetDto.deliveryAddress as DeepPartial<AddressEntity>,
      true,
    );

    const phoneNumbers = this.normalizePhoneNumbers(
      updateCabinetDto.phoneNumbers,
      updateCabinetDto.phone ?? cabinet.phone,
    );
    const primaryActivity = activities[0] ?? null;

    const updatedCabinet = await this.cabinetRepository.save({
      ...cabinet,
      ...updateCabinetDto,
      address: invoicingAddress,
      addressId: invoicingAddress?.id ?? null,
      deliveryAddress,
      deliveryAddressId: deliveryAddress?.id ?? null,
      activity: primaryActivity,
      activityId: primaryActivity?.id ?? null,
      activities,
      currency,
      currencyId: currency?.id ?? null,
      country,
      countryId: country?.id ?? null,
      phoneNumbers,
      phone: phoneNumbers[0] ?? null,
      logoId,
      signatureId,
      stampId,
      invoiceDisplayType:
        updateCabinetDto.invoiceDisplayType ??
        cabinet.invoiceDisplayType ??
        CABINET_INVOICE_DISPLAY_TYPE.INVOICE,
    });

    return this.findOneById(updatedCabinet.id);
  }

  async completeOnboarding(
    id: number,
    updateCabinetDto: UpdateCabinetDto,
  ): Promise<CabinetEntity> {
    return this.update(id, {
      ...updateCabinetDto,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
    } as UpdateCabinetDto);
  }

  async softDelete(id: number): Promise<CabinetEntity> {
    await this.findOneById(id);
    return this.cabinetRepository.softDelete(id);
  }

  async deleteAll() {
    this.cabinetRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.cabinetRepository.getTotalCount();
  }
}
