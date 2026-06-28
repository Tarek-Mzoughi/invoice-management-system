import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { paymentConditionsSeed } from './data/payment-conditions.data';
import { PaymentConditionService } from 'src/modules/payment-condition/services/payment-condition.service';

@Injectable()
export class PaymentConditionsSeederCommand {
  constructor(
    private readonly paymentConditionService: PaymentConditionService,
  ) {}

  @Command({
    command: 'seed:payment-conditions',
    describe: 'seed payment conditions',
  })
  async seed() {
    const start = new Date();
    console.log('Starting seeding of payment conditions');

    await this.paymentConditionService.saveMany(paymentConditionsSeed);

    const end = new Date();
    console.log(`Seeding completed in ${end.getTime() - start.getTime()}ms`);
  }
}
