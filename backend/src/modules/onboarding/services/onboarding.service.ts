import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CabinetService } from 'src/modules/cabinet/services/cabinet.service';
import { ActivityService } from 'src/modules/activity/services/activity.service';
import { TaxService } from 'src/modules/tax/services/tax.service';
import { PriceListService } from 'src/modules/price-list/services/price-list.service';
import { BankAccountService } from 'src/modules/bank-account/services/bank-account.service';
import { BANK_ACCOUNT_TYPE } from 'src/modules/bank-account/enums/bank-account-type.enum';
import { CurrencyService } from 'src/modules/currency/services/currency.service';
import { UserEntity } from 'src/modules/user-management/entities/user.entity';
import { UserService } from 'src/modules/user-management/services/user.service';
import { CompleteCompanyOnboardingDto } from '../dtos/company-onboarding.dto';

const OWNER_ROLE_LABELS = ['admin', 'owner', 'proprietaire', 'propriétaire'];

@Injectable()
export class OnboardingService {
  constructor(
    private readonly userService: UserService,
    private readonly cabinetService: CabinetService,
    private readonly activityService: ActivityService,
    private readonly taxService: TaxService,
    private readonly priceListService: PriceListService,
    private readonly bankAccountService: BankAccountService,
    private readonly currencyService: CurrencyService,
  ) {}

  private canCompleteCompanyOnboarding(user: UserEntity): boolean {
    const roleLabel = user.role?.label?.trim().toLowerCase();
    return Boolean(roleLabel && OWNER_ROLE_LABELS.includes(roleLabel));
  }

  async completeCompanyOnboarding(
    userId: string,
    dto: CompleteCompanyOnboardingDto,
  ): Promise<UserEntity> {
    return this.completeCompanyOnboardingTransaction(userId, dto);
  }

  @Transactional()
  private async completeCompanyOnboardingTransaction(
    userId: string,
    dto: CompleteCompanyOnboardingDto,
  ): Promise<UserEntity> {
    const user = await this.userService.findOneById(userId);

    if (!this.canCompleteCompanyOnboarding(user)) {
      throw new ForbiddenException(
        'Only cabinet administrators can complete onboarding',
      );
    }

    const memberships = user.cabinetMemberships || [];
    const incompleteCabinet = (user.cabinetMemberships || [])
      .map((m) => m.cabinet)
      .find((cabinet) => cabinet?.onboardingCompleted !== true);
    const shouldCreateCabinet =
      memberships.length === 0 ||
      (dto.createNewCabinet === true && !incompleteCabinet);

    if (!shouldCreateCabinet && !incompleteCabinet?.id) {
      throw new BadRequestException('Company onboarding is already completed');
    }

    const activity = dto.activityId
      ? await this.activityService.findOneById(dto.activityId)
      : null;
    const selectedTaxTemplateIds = dto.selectedTaxTemplateIds ?? [];
    const cabinetPayload = {
      activityType: activity ? dto.activityType || activity.label : null,
      activityId: activity?.id ?? null,
      activityIds: activity?.id ? [activity.id] : [],
      personType: dto.personType,
      enterpriseName: dto.enterpriseName.trim(),
      taxIdNumber: dto.taxIdNumber?.trim() || null,
      logoId: dto.logoId ?? null,
      isPerson: dto.personType === 'physical',
      countryId: dto.address.countryId,
      address: {
        address: dto.address.address.trim(),
        address2: '',
        region: dto.address.city.trim(),
        zipcode: dto.address.postalCode.trim(),
        countryId: dto.address.countryId,
      },
      taxSettings: {
        vatRates: dto.taxSettings?.vatRates ?? [],
        additionalTaxes: dto.taxSettings?.additionalTaxes ?? [],
        selectedTaxTemplateIds,
      },
    };

    const cabinet = shouldCreateCabinet
      ? await this.cabinetService.save({
          ...cabinetPayload,
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
        } as any)
      : await this.cabinetService.completeOnboarding(
          incompleteCabinet.id,
          cabinetPayload as any,
        );

    if (shouldCreateCabinet) {
      await this.userService.addCabinetMembership(userId, cabinet.id);
    }

    await this.taxService.configureCabinetTemplateSelection(
      cabinet.id,
      selectedTaxTemplateIds,
    );

    const defaultPriceListNames = [
      'Prix de promotion',
      'Prix de gros',
      'Prix par défaut',
    ];
    for (const name of defaultPriceListNames) {
      const existing = await this.priceListService.findOneByNameInCabinet(
        name,
        cabinet.id,
      );
      if (!existing) {
        await this.priceListService.save({
          name,
          active: true,
          cabinetId: cabinet.id,
        } as any);
      }
    }

    // Automatically create a default cash register ("Caisse") for the new cabinet
    let currencyId = cabinet.currencyId;
    if (!currencyId) {
      const currencies = await this.currencyService.findAll();
      const tnd = currencies.find((c) => c.code === 'TND');
      currencyId = tnd?.id ?? currencies[0]?.id;
    }

    if (currencyId) {
      const existingCashAccount = await this.bankAccountService.findAll(
        {
          filter: `type||$eq||${BANK_ACCOUNT_TYPE.CASH}`,
        },
        userId,
      );

      if (existingCashAccount.length === 0) {
        await this.bankAccountService.save(
          {
            name: 'Caisse',
            type: BANK_ACCOUNT_TYPE.CASH,
            currencyId,
            isMain: true,
          } as any,
          userId,
        );
      }
    }

    return this.userService.findOneById(userId);
  }
}
