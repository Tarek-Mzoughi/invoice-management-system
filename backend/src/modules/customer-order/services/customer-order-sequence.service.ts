import { Injectable } from '@nestjs/common';
import { CustomerOrderSequentialNotFoundException } from '../errors/customer-order.sequential.error';
import { EventsGateway } from 'src/shared/gateways/events/events.gateway';
import { UpdateCustomerOrderSequenceDto } from '../dtos/customer-order-seqence.update.dto';
import { formSequential } from 'src/modules/sequence/utils/sequence.utils';
import { WSRoom } from 'src/app/enums/ws-room.enum';
import { SequenceService } from 'src/modules/sequence/services/sequence.service';
import { SequenceEntity } from 'src/modules/sequence/entities/sequence.entity';
import { CustomerOrderSequence } from '../interfaces/customer-order-sequence.interface';
import { Sequences } from 'src/app/enums/sequences.enum';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';

@Injectable()
export class CustomerOrderSequenceService {
  constructor(
    private readonly sequenceService: SequenceService,
    private readonly wsGateway: EventsGateway,
  ) {}

  private getSequenceLabel(activityType: ACTIVITY_TYPE): Sequences {
    return activityType === ACTIVITY_TYPE.BUYING
      ? Sequences.BUYING_CUSTOMER_ORDER
      : Sequences.CUSTOMER_ORDER;
  }

  private toCustomerOrderSequence(
    sequence: SequenceEntity,
  ): CustomerOrderSequence {
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
      throw new CustomerOrderSequentialNotFoundException();
    }

    return sequence;
  }

  async get(
    activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  ): Promise<CustomerOrderSequence> {
    return this.toCustomerOrderSequence(
      await this.getSequenceEntity(activityType),
    );
  }

  async set(
    updateCustomerOrderSequenceDto: UpdateCustomerOrderSequenceDto,
    activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  ): Promise<CustomerOrderSequence> {
    const sequence = await this.getSequenceEntity(activityType);
    const updatedSequence = await this.sequenceService.update(sequence.id, {
      prefix: updateCustomerOrderSequenceDto.prefix ?? sequence.prefix,
      dateFormat:
        updateCustomerOrderSequenceDto.dynamic_sequence ?? sequence.dateFormat,
      next: updateCustomerOrderSequenceDto.next ?? sequence.next,
    });

    return this.toCustomerOrderSequence(updatedSequence);
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
        WSRoom.CUSTOMER_ORDER_SEQUENCE,
        'customer-order-sequence-updated',
        { value: sequence.next + 1 },
      );
    }
    return formSequential(sequence.prefix, sequence.dateFormat, sequence.next);
  }
}
