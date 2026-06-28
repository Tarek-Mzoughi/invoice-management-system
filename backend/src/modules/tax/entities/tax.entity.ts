import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { CurrencyEntity } from 'src/modules/currency/entities/currency.entity';
import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('tax')
export class TaxEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  label: string;

  @Column({ type: 'float', nullable: true })
  value: number;

  @Column({ type: 'boolean', default: true })
  isRate: boolean;

  @Column({ type: 'boolean', default: false })
  isSpecial: boolean;

  @ManyToOne(() => CabinetEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cabinetId' })
  cabinet: CabinetEntity;

  @Column({ type: 'int', nullable: true })
  cabinetId: number;

  @ManyToOne(() => CurrencyEntity)
  @JoinColumn({ name: 'currencyId' })
  currency: CurrencyEntity;

  @Column({ type: 'int', nullable: true })
  currencyId: number;

  isActive?: boolean;

  isTemplate?: boolean;

  isCustom?: boolean;
}
