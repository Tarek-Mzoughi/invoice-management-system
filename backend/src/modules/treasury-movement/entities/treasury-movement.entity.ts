import { BankAccountEntity } from 'src/modules/bank-account/entities/bank-account.entity';
import { CurrencyEntity } from 'src/modules/currency/entities/currency.entity';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TREASURY_MOVEMENT_DIRECTION } from '../enums/treasury-movement-direction.enum';
import { TREASURY_MOVEMENT_KIND } from '../enums/treasury-movement-kind.enum';

@Entity('treasury_movement')
export class TreasuryMovementEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BankAccountEntity)
  @JoinColumn({ name: 'accountId' })
  account: BankAccountEntity;

  @Column({ type: 'int' })
  accountId: number;

  @ManyToOne(() => CurrencyEntity, { eager: true })
  @JoinColumn({ name: 'currencyId' })
  currency: CurrencyEntity;

  @Column({ type: 'int' })
  currencyId: number;

  @Column({ type: 'enum', enum: TREASURY_MOVEMENT_KIND })
  kind: TREASURY_MOVEMENT_KIND;

  @Column({ type: 'enum', enum: TREASURY_MOVEMENT_DIRECTION })
  direction: TREASURY_MOVEMENT_DIRECTION;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  label: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  notes: string;

  @Column({ type: 'datetime' })
  movementDate: Date;
}
