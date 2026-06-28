import { Injectable } from '@nestjs/common';
import { QuotationSequentialNotFoundException } from '../errors/quotation.sequential.error';
import { EventsGateway } from 'src/shared/gateways/events/events.gateway';
import { UpdateQuotationSequenceDto } from '../dtos/quotation-seqence.update.dto';
import { formSequential } from 'src/modules/sequence/utils/sequence.utils';
import { WSRoom } from 'src/app/enums/ws-room.enum';
import { SequenceService } from 'src/modules/sequence/services/sequence.service';
import { SequenceEntity } from 'src/modules/sequence/entities/sequence.entity';
import { QuotationSequence } from '../interfaces/quotation-sequence.interface';
import { Sequences } from 'src/app/enums/sequences.enum';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';

@Injectable()
export class QuotationSequenceService {
  constructor(
    private readonly sequenceService: SequenceService,
    private readonly wsGateway: EventsGateway,
  ) {}

  private getSequenceLabel(activityType: ACTIVITY_TYPE): Sequences {
    return activityType === ACTIVITY_TYPE.BUYING
      ? Sequences.BUYING_QUOTATION
      : Sequences.QUOTATION;
  }

  private toQuotationSequence(sequence: SequenceEntity): QuotationSequence {
    return {
      prefix: sequence.prefix,
      dateFormat: sequence.dateFormat,
      next: sequence.next,
    };
  }

  private async getSequenceEntity(
    activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  ): Promise<SequenceEntity> {
    const sequence = await this.sequenceService.ensureByLabel(
      this.getSequenceLabel(activityType),
    );
    if (!sequence) {
      throw new QuotationSequentialNotFoundException();
    }

    return sequence;
  }

  async get(
    activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  ): Promise<QuotationSequence> {
    return this.toQuotationSequence(await this.getSequenceEntity(activityType));
  }

  async set(
    updateQuotationSequenceDto: UpdateQuotationSequenceDto,
    activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  ): Promise<QuotationSequence> {
    const sequence = await this.getSequenceEntity(activityType);
    const updatedSequence = await this.sequenceService.update(sequence.id, {
      prefix: updateQuotationSequenceDto.prefix ?? sequence.prefix,
      dateFormat:
        updateQuotationSequenceDto.dynamic_sequence ?? sequence.dateFormat,
      next: updateQuotationSequenceDto.next ?? sequence.next,
    });

    return this.toQuotationSequence(updatedSequence);
  }

  async getSequential(
    activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  ): Promise<string> {
    const sequence = await this.get(activityType);
    await this.set(
      {
        ...sequence,
        dynamic_sequence: sequence.dateFormat,
        next: sequence.next + 1,
      },
      activityType,
    );
    if (activityType === ACTIVITY_TYPE.SELLING) {
      this.wsGateway.sendToRoom(
        WSRoom.QUOTATION_SEQUENCE,
        'quotation-sequence-updated',
        { value: sequence.next + 1 },
      );
    }
    return formSequential(sequence.prefix, sequence.dateFormat, sequence.next);
  }
}
