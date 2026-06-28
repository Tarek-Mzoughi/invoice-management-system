import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { CurrencyEntity } from 'src/modules/currency/entities/currency.entity';
import { FirmEntity } from 'src/modules/firm/entities/firm.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('firm_bank_account')
export class FirmBankAccountEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 11, nullable: true })
  bic: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  rib: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  iban: string;

  @ManyToOne(() => CurrencyEntity, { eager: true })
  @JoinColumn({ name: 'currencyId' })
  currency: CurrencyEntity;

  @Column({ type: 'int', nullable: true })
  currencyId: number;

  @Column({ type: 'boolean', default: true })
  isMain: boolean;

  @ManyToOne(() => FirmEntity, { eager: true })
  @JoinColumn({ name: 'firmId' })
  firm: FirmEntity;

  @Column({ type: 'int', nullable: true })
  firmId: number;
}
