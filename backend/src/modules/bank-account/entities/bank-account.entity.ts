import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { CurrencyEntity } from 'src/modules/currency/entities/currency.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BANK_ACCOUNT_TYPE } from '../enums/bank-account-type.enum';
import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';

@Entity('bank_account')
export class BankAccountEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @ManyToOne(() => CabinetEntity)
  @JoinColumn({ name: 'cabinetId' })
  cabinet?: CabinetEntity;

  @Column({ type: 'int', nullable: true })
  cabinetId?: number;

  @Column({
    type: 'enum',
    enum: BANK_ACCOUNT_TYPE,
    default: BANK_ACCOUNT_TYPE.BANK,
  })
  type: BANK_ACCOUNT_TYPE;

  @Column({ type: 'varchar', length: 11, nullable: true })
  bic: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  rib: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  iban: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  agency: string;

  @ManyToOne(() => CurrencyEntity, { eager: true })
  @JoinColumn({ name: 'currencyId' })
  currency: CurrencyEntity;

  @Column({ type: 'int', nullable: true })
  currencyId: number;

  @Column({ type: 'boolean', default: true })
  isMain: boolean;
}
