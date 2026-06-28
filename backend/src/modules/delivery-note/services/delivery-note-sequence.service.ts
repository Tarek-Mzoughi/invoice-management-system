import { Injectable } from '@nestjs/common';
import { DeliveryNoteSequentialNotFoundException } from '../errors/delivery-note.sequential.error';
import { EventsGateway } from 'src/shared/gateways/events/events.gateway';
import { UpdateDeliveryNoteSequenceDto } from '../dtos/delivery-note-seqence.update.dto';
import { formSequential } from 'src/modules/sequence/utils/sequence.utils';
import { WSRoom } from 'src/app/enums/ws-room.enum';
import { SequenceService } from 'src/modules/sequence/services/sequence.service';
import { SequenceEntity } from 'src/modules/sequence/entities/sequence.entity';
import { DeliveryNoteSequence } from '../interfaces/delivery-note-sequence.interface';
import { Sequences } from 'src/app/enums/sequences.enum';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';

@Injectable()
export class DeliveryNoteSequenceService {
  constructor(
    private readonly sequenceService: SequenceService,
    private readonly wsGateway: EventsGateway,
  ) {}

  private getSequenceLabel(activityType: ACTIVITY_TYPE): Sequences {
    return activityType === ACTIVITY_TYPE.BUYING
      ? Sequences.BUYING_DELIVERY_NOTE
      : Sequences.DELIVERY_NOTE;
  }

  private toDeliveryNoteSequence(
    sequence: SequenceEntity,
  ): DeliveryNoteSequence {
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
      throw new DeliveryNoteSequentialNotFoundException();
    }

    return sequence;
  }

  async get(
    activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  ): Promise<DeliveryNoteSequence> {
    return this.toDeliveryNoteSequence(
      await this.getSequenceEntity(activityType),
    );
  }

  async set(
    updateDeliveryNoteSequenceDto: UpdateDeliveryNoteSequenceDto,
    activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  ): Promise<DeliveryNoteSequence> {
    const sequence = await this.getSequenceEntity(activityType);
    const updatedSequence = await this.sequenceService.update(sequence.id, {
      prefix: updateDeliveryNoteSequenceDto.prefix ?? sequence.prefix,
      dateFormat:
        updateDeliveryNoteSequenceDto.dynamic_sequence ?? sequence.dateFormat,
      next: updateDeliveryNoteSequenceDto.next ?? sequence.next,
    });

    return this.toDeliveryNoteSequence(updatedSequence);
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
        WSRoom.DELIVERY_NOTE_SEQUENCE,
        'delivery-note-sequence-updated',
        { value: sequence.next + 1 },
      );
    }
    return formSequential(sequence.prefix, sequence.dateFormat, sequence.next);
  }
}
