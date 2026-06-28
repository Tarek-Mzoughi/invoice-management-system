import { Injectable } from '@nestjs/common';
import { GoodsIssueNoteSequentialNotFoundException } from '../errors/goods-issue-note.sequential.error';
import { EventsGateway } from 'src/shared/gateways/events/events.gateway';
import { UpdateGoodsIssueNoteSequenceDto } from '../dtos/goods-issue-note-seqence.update.dto';
import { formSequential } from 'src/modules/sequence/utils/sequence.utils';
import { WSRoom } from 'src/app/enums/ws-room.enum';
import { SequenceService } from 'src/modules/sequence/services/sequence.service';
import { SequenceEntity } from 'src/modules/sequence/entities/sequence.entity';
import { GoodsIssueNoteSequence } from '../interfaces/goods-issue-note-sequence.interface';
import { Sequences } from 'src/app/enums/sequences.enum';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';

@Injectable()
export class GoodsIssueNoteSequenceService {
  constructor(
    private readonly sequenceService: SequenceService,
    private readonly wsGateway: EventsGateway,
  ) {}

  private getSequenceLabel(activityType: ACTIVITY_TYPE): Sequences {
    return activityType === ACTIVITY_TYPE.BUYING
      ? Sequences.BUYING_GOODS_ISSUE_NOTE
      : Sequences.GOODS_ISSUE_NOTE;
  }

  private toGoodsIssueNoteSequence(
    sequence: SequenceEntity,
  ): GoodsIssueNoteSequence {
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
      throw new GoodsIssueNoteSequentialNotFoundException();
    }

    return sequence;
  }

  async get(
    activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  ): Promise<GoodsIssueNoteSequence> {
    return this.toGoodsIssueNoteSequence(
      await this.getSequenceEntity(activityType),
    );
  }

  async set(
    updateGoodsIssueNoteSequenceDto: UpdateGoodsIssueNoteSequenceDto,
    activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  ): Promise<GoodsIssueNoteSequence> {
    const sequence = await this.getSequenceEntity(activityType);
    const updatedSequence = await this.sequenceService.update(sequence.id, {
      prefix: updateGoodsIssueNoteSequenceDto.prefix ?? sequence.prefix,
      dateFormat:
        updateGoodsIssueNoteSequenceDto.dynamic_sequence ?? sequence.dateFormat,
      next: updateGoodsIssueNoteSequenceDto.next ?? sequence.next,
    });

    return this.toGoodsIssueNoteSequence(updatedSequence);
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
        WSRoom.GOODS_ISSUE_NOTE_SEQUENCE,
        'goods-issue-note-sequence-updated',
        { value: sequence.next + 1 },
      );
    }
    return formSequential(sequence.prefix, sequence.dateFormat, sequence.next);
  }
}
