import { Injectable } from '@nestjs/common';
import { AbstractCrudService } from 'src/shared/database/services/abstract-crud.service';
import { SequenceEntity } from '../entities/sequence.entity';
import { SequenceRepository } from '../repositories/sequence.repository';
import { AppConfigService } from 'src/shared/app-config/services/app-config.service';
import {
  getDefaultSequenceConfig,
  LEGACY_SEQUENCE_CONFIG_KEYS,
  normalizeSequenceLabel,
  SELLING_SEQUENCE_LABELS,
} from '../utils/sequence-defaults.utils';

@Injectable()
export class SequenceService extends AbstractCrudService<SequenceEntity> {
  constructor(
    private readonly sequenceRepository: SequenceRepository,
    private readonly appConfigService: AppConfigService,
  ) {
    super(sequenceRepository);
  }

  async findByLabel(label: string): Promise<SequenceEntity> {
    return (
      (await this.sequenceRepository.findOne({ where: { label } })) ||
      (await this.sequenceRepository.findOne({
        where: { label: label.toLowerCase() },
      })) ||
      (await this.sequenceRepository.findOne({
        where: { label: label.toUpperCase() },
      }))
    );
  }

  async ensureByLabel(label: string): Promise<SequenceEntity | null> {
    const normalizedLabel = normalizeSequenceLabel(label);
    const sequence = await this.findByLabel(normalizedLabel || label);
    if (sequence) {
      return sequence;
    }

    if (!normalizedLabel) {
      return null;
    }

    const defaultConfig = getDefaultSequenceConfig(normalizedLabel);
    const legacyKey = LEGACY_SEQUENCE_CONFIG_KEYS[normalizedLabel];
    const legacyConfig = legacyKey
      ? await this.appConfigService.findOneByName(legacyKey)
      : null;

    return this.sequenceRepository.save({
      label: normalizedLabel,
      prefix: legacyConfig?.value?.prefix ?? defaultConfig.prefix,
      dateFormat: legacyConfig?.value?.dateFormat ?? defaultConfig.dateFormat,
      next: legacyConfig?.value?.next ?? defaultConfig.next,
    });
  }

  async ensureSellingSequences(): Promise<SequenceEntity[]> {
    const sequences = await Promise.all(
      SELLING_SEQUENCE_LABELS.map((label) => this.ensureByLabel(label)),
    );

    return sequences.filter(
      (sequence): sequence is SequenceEntity => sequence !== null,
    );
  }
}
