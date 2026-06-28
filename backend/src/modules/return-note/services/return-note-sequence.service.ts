import { Injectable } from '@nestjs/common';
import { ReturnNoteSequentialNotFoundException } from '../errors/return-note.sequential.error';
import { EventsGateway } from 'src/shared/gateways/events/events.gateway';
import { UpdateReturnNoteSequenceDto } from '../dtos/return-note-seqence.update.dto';
import { formSequential } from 'src/modules/sequence/utils/sequence.utils';
import { WSRoom } from 'src/app/enums/ws-room.enum';
import { SequenceService } from 'src/modules/sequence/services/sequence.service';
import { SequenceEntity } from 'src/modules/sequence/entities/sequence.entity';
import { ReturnNoteSequence } from '../interfaces/return-note-sequence.interface';
import { Sequences } from 'src/app/enums/sequences.enum';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';

@Injectable()
export class ReturnNoteSequenceService {
  constructor(
    private readonly sequenceService: SequenceService,
    private readonly wsGateway: EventsGateway,
  ) {}

  private getSequenceLabel(activityType: ACTIVITY_TYPE): Sequences {
    return activityType === ACTIVITY_TYPE.BUYING
      ? Sequences.BUYING_RETURN_NOTE
      : Sequences.RETURN_NOTE;
  }

  private toReturnNoteSequence(sequence: SequenceEntity): ReturnNoteSequence {
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
      throw new ReturnNoteSequentialNotFoundException();
    }

    return sequence;
  }

  async get(
    activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  ): Promise<ReturnNoteSequence> {
    return this.toReturnNoteSequence(
      await this.getSequenceEntity(activityType),
    );
  }

  async set(
    updateReturnNoteSequenceDto: UpdateReturnNoteSequenceDto,
    activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  ): Promise<ReturnNoteSequence> {
    const sequence = await this.getSequenceEntity(activityType);
    const updatedSequence = await this.sequenceService.update(sequence.id, {
      prefix: updateReturnNoteSequenceDto.prefix ?? sequence.prefix,
      dateFormat:
        updateReturnNoteSequenceDto.dynamic_sequence ?? sequence.dateFormat,
      next: updateReturnNoteSequenceDto.next ?? sequence.next,
    });

    return this.toReturnNoteSequence(updatedSequence);
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
        WSRoom.RETURN_NOTE_SEQUENCE,
        'return-note-sequence-updated',
        { value: sequence.next + 1 },
      );
    }
    return formSequential(sequence.prefix, sequence.dateFormat, sequence.next);
  }
}
