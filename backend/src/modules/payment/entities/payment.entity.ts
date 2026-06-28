import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PAYMENT_MODE } from '../enums/payment-mode.enum';
import { PaymentStorageEntity } from './payment-file.entity';
import { PaymentInvoiceEntryEntity } from './payment-invoice-entry.entity';
import { CurrencyEntity } from 'src/modules/currency/entities/currency.entity';
import { FirmEntity } from 'src/modules/firm/entities/firm.entity';
import { BankAccountEntity } from 'src/modules/bank-account/entities/bank-account.entity';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { PAYMENT_COLLECTION_STATUS } from '../enums/payment-collection-status.enum';
import { TaxWithholdingEntity } from 'src/modules/tax-withholding/entities/tax-withholding.entity';
import { PaymentCreditNoteEntryEntity } from './payment-credit-note-entry.entity';
import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';

@Entity('payment')
export class PaymentEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ACTIVITY_TYPE, default: ACTIVITY_TYPE.SELLING })
  activityType: ACTIVITY_TYPE;

  @ManyToOne(() => CabinetEntity)
  @JoinColumn({ name: 'cabinetId' })
  cabinet: CabinetEntity;

  @Column({ type: 'int', nullable: true })
  cabinetId: number;

  @Column({ type: 'float', nullable: true })
  amount: number;

  @Column({ type: 'float', nullable: true })
  fee: number;

  @Column({ type: 'float', nullable: true })
  convertionRate: number;

  @Column({ nullable: true })
  date: Date;

  @Column({ type: 'enum', enum: PAYMENT_MODE, nullable: true })
  mode: PAYMENT_MODE;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference: string;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: PAYMENT_COLLECTION_STATUS,
    nullable: true,
  })
  collectionStatus: PAYMENT_COLLECTION_STATUS;

  @Column({ nullable: true })
  depositedAt: Date;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  rejectedAt: Date;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  rejectionReason: string;

  @Column({ type: 'int', nullable: true })
  encashmentMovementId: number;

  @ManyToOne(() => TaxWithholdingEntity)
  @JoinColumn({ name: 'taxWithholdingId' })
  taxWithholding: TaxWithholdingEntity;

  @Column({ type: 'int', nullable: true })
  taxWithholdingId: number;

  @Column({ nullable: true })
  taxWithholdingDate: Date;

  @Column({ type: 'float', nullable: true })
  taxWithholdingAmount: number;

  @ManyToOne(() => CurrencyEntity)
  @JoinColumn({ name: 'currencyId' })
  currency: CurrencyEntity;

  @Column({ type: 'int', nullable: true })
  currencyId: number;

  @ManyToOne(() => BankAccountEntity)
  @JoinColumn({ name: 'treasuryAccountId' })
  treasuryAccount: BankAccountEntity;

  @Column({ type: 'int', nullable: true })
  treasuryAccountId: number;

  @ManyToOne(() => BankAccountEntity)
  @JoinColumn({ name: 'originTreasuryAccountId' })
  originTreasuryAccount: BankAccountEntity;

  @Column({ type: 'int', nullable: true })
  originTreasuryAccountId: number;

  @OneToMany(() => PaymentStorageEntity, (upload) => upload.payment)
  uploads: PaymentStorageEntity[];

  @OneToMany(() => PaymentInvoiceEntryEntity, (invoice) => invoice.payment)
  invoices: PaymentInvoiceEntryEntity[];

  @OneToMany(() => PaymentCreditNoteEntryEntity, (entry) => entry.payment)
  creditNotes: PaymentCreditNoteEntryEntity[];

  @ManyToOne(() => FirmEntity)
  @JoinColumn({ name: 'firmId' })
  firm: FirmEntity;

  @Column({ type: 'int', nullable: true })
  firmId: number;
}
