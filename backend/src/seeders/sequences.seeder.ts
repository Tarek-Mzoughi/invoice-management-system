import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { SequenceService } from 'src/modules/sequence/services/sequence.service';
import { Sequences } from 'src/app/enums/sequences.enum';
import { getDefaultSequenceConfig } from 'src/modules/sequence/utils/sequence-defaults.utils';

@Injectable()
export class SequencesSeederCommand {
  constructor(private readonly sequenceService: SequenceService) {}

  @Command({
    command: 'seed:sequences',
    describe: 'seed system sequences',
  })
  async seed() {
    const start = new Date();
    console.log('Starting seeding of sequences');

    await Promise.all(
      Object.values(Sequences).map(async (sequence) => {
        const existingSequence =
          await this.sequenceService.findByLabel(sequence);
        if (!existingSequence) {
          const config = getDefaultSequenceConfig(sequence);

          await this.sequenceService.save({
            label: sequence,
            prefix: config.prefix,
            dateFormat: config.dateFormat,
            next: config.next,
          });
        }
      }),
    );

    const end = new Date();
    console.log(`Seeding completed in ${end.getTime() - start.getTime()}ms`);
  }
}
