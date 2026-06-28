import { Injectable } from '@nestjs/common';
import { CurrencyRepository } from '../repositories/currency.repository';
import { CurrencyEntity } from '../entities/currency.entity';
import { CurrencyNotFoundException } from '../errors/currency.notfound.error';
import { ConfigService } from '@nestjs/config';
import { DeepPartial } from 'typeorm';

@Injectable()
export class CurrencyService {
  constructor(
    private readonly currencyRepository: CurrencyRepository,
    private readonly configService: ConfigService,
  ) {}

  async findOneById(id: number): Promise<CurrencyEntity> {
    const currency = await this.currencyRepository.findOneById(id);
    if (!currency) {
      throw new CurrencyNotFoundException();
    }
    return currency;
  }
  async findAll(): Promise<CurrencyEntity[]> {
    const currencies = await this.currencyRepository.findAll();

    // Get favorite currencies from config
    const favCurrencies = this.configService.get<Record<string, string>>(
      'app-preferences.currency',
    );
    const favoriteCurrencyCodes = Object.values(favCurrencies).filter(Boolean);

    // Create a map for quick look-up of favorite currency codes
    const favoriteCurrencyMap = new Set(favoriteCurrencyCodes);

    // Sort currencies: favorites first, then the rest
    const reorderedCurrencies = currencies.sort((a, b) => {
      const isAFavorite = favoriteCurrencyMap.has(a.code);
      const isBFavorite = favoriteCurrencyMap.has(b.code);

      if (isAFavorite && !isBFavorite) return -1; // a is a favorite, b is not
      if (!isAFavorite && isBFavorite) return 1; // b is a favorite, a is not
      return 0; // Both are favorites or neither are favorites, maintain original order
    });

    return reorderedCurrencies;
  }

  async save(
    createCurrencyDto: DeepPartial<CurrencyEntity>,
  ): Promise<CurrencyEntity> {
    return this.currencyRepository.save(createCurrencyDto);
  }

  async saveMany(
    currencies: DeepPartial<CurrencyEntity>[],
  ): Promise<CurrencyEntity[]> {
    return this.currencyRepository.saveMany(currencies);
  }

  async softDelete(id: number): Promise<CurrencyEntity> {
    await this.findOneById(id);
    return this.currencyRepository.softDelete(id);
  }

  async getTotal(): Promise<number> {
    return this.currencyRepository.getTotalCount();
  }

  async deleteAll() {
    return this.currencyRepository.deleteAll();
  }
}
