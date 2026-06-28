import { Injectable } from '@nestjs/common';
import { DefaultConditionRepository } from '../repositories/default-condition.repository';
import { DefaultConditionEntity } from '../entities/default-condition.entity';
import { AbstractCrudService } from 'src/shared/database/services/abstract-crud.service';

@Injectable()
export class DefaultConditionService extends AbstractCrudService<DefaultConditionEntity> {
  constructor(
    private readonly defaultConditionRepository: DefaultConditionRepository,
  ) {
    super(defaultConditionRepository);
  }
}
