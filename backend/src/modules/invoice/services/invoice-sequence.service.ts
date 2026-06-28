import { Injectable } from '@nestjs/common';
import { EventsGateway } from 'src/shared/gateways/events/events.gateway';
import { UpdateInvoiceSequenceDto } from '../dtos/invoice-seqence.update.dto';
import { InvoiceSequentialNotFoundException } from '../errors/invoice-sequential.error';
import { formSequential } from 'src/modules/sequence/utils/sequence.utils';
import { WSRoom } from 'src/app/enums/ws-room.enum';
import { SequenceService } from 'src/modules/sequence/services/sequence.service';
import { Sequences } from 'src/app/enums/sequences.enum';
import { SequenceEntity } from 'src/modules/sequence/entities/sequence.entity';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';

@Injectable()
export class InvoiceSequenceService {
  constructor(
    private readonly sequenceService: SequenceService,
    private readonly wsGateway: EventsGateway,
  ) {}

  private getSequenceLabel(activityType: ACTIVITY_TYPE): Sequences {
    return activityType === ACTIVITY_TYPE.BUYING
      ? Sequences.BUYING_INVOICE
      : Sequences.INVOICE;
  }

  async get(
    activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  ): Promise<SequenceEntity> {
    const sequence = await this.sequenceService.ensureByLabel(
      this.getSequenceLabel(activityType),
    );
    if (!sequence) {
      throw new InvoiceSequentialNotFoundException();
    }
    return sequence;
  }

  async set(
    updateInvoiceSequenceDto: UpdateInvoiceSequenceDto,
    activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  ): Promise<SequenceEntity> {
    const sequence = await this.get(activityType);
    const updatedSequence = await this.sequenceService.update(
      sequence.id,
      updateInvoiceSequenceDto,
    );
    return updatedSequence;
  }

  async getSequential(
    activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  ): Promise<string> {
    const sequence = await this.get(activityType);
    this.set(
      {
        ...sequence,
        next: sequence.next + 1,
      },
      activityType,
    );
    if (activityType === ACTIVITY_TYPE.SELLING) {
      this.wsGateway.sendToRoom(
        WSRoom.INVOICE_SEQUENCE,
        'invoice-sequence-updated',
        { value: sequence.next + 1 },
      );
    }
    return formSequential(sequence.prefix, sequence.dateFormat, sequence.next);
  }
}
