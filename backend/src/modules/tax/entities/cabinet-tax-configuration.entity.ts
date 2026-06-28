import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { TaxEntity } from './tax.entity';

@Entity('cabinet_tax_configuration')
@Unique('UQ_cabinet_tax_configuration_cabinet_tax', ['cabinetId', 'taxId'])
export class CabinetTaxConfigurationEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CabinetEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cabinetId' })
  cabinet: CabinetEntity;

  @Column({ type: 'int' })
  cabinetId: number;

  @ManyToOne(() => TaxEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taxId' })
  tax: TaxEntity;

  @Column({ type: 'int' })
  taxId: number;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;
}
