import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';

import { CountryService } from 'src/modules/country/services/country.service';
import { countriesSeed } from './data/countries.data';

@Injectable()
export class CountriesSeederCommand {
  constructor(private readonly countryService: CountryService) {}

  @Command({
    command: 'seed:countries',
    describe: 'seed system countries',
  })
  async seed() {
    const start = new Date();
    console.log('Starting seeding of countries');

    await this.countryService.saveMany(countriesSeed);

    const end = new Date();
    console.log(`Seeding completed in ${end.getTime() - start.getTime()}ms`);
  }
}
