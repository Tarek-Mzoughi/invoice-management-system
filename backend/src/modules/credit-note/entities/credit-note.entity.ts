import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CREDIT_NOTE_STATUS } from '../enums/credit-note-status.enum';
import { DISCOUNT_TYPES } from 'src/app/enums/discount-types.enum';
import { CurrencyEntity } from 'src/modules/currency/entities/currency.entity';
import { FirmEntity } from 'src/modules/firm/entities/firm.entity';
import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';
import { TaxWithholdingEntity } from 'src/modules/tax-withholding/entities/tax-withholding.entity';
import { PaymentCreditNoteEntryEntity } from 'src/modules/payment/entities/payment-credit-note-entry.entity';
import { TaxEntity } from 'src/modules/tax/entities/tax.entity';
import { QuotationEntity } from 'src/modules/quotation/entities/quotation.entity';
import { DeliveryNoteEntity } from 'src/modules/delivery-note/entities/delivery-note.entity';
import { GoodsIssueNoteEntity } from 'src/modules/goods-issue-note/entities/goods-issue-note.entity';
import { CreditNoteStorageEntity } from './credit-note-file.entity';
import { CreditNoteMetaDataEntity } from './credit-note-meta-data.entity';
import { BankAccountEntity } from 'src/modules/bank-account/entities/bank-account.entity';
import { ArticleCreditNoteEntryEntity } from './article-credit-note-entry.entity';
import { InterlocutorEntity } from 'src/modules/interlocutor/entities/interlocutor.entity';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';

import { InvoiceEntity } from 'src/modules/invoice/entities/invoice.entity';
import { ReturnNoteEntity } from 'src/modules/return-note/entities/return-note.entity';

@Entity('credit_note')
export class CreditNoteEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  sourceInvoiceId: number;

  @ManyToOne(() => InvoiceEntity, { nullable: true })
  @JoinColumn({ name: 'sourceInvoiceId' })
  sourceInvoice: InvoiceEntity;

  @Column({ type: 'int', nullable: true })
  sourceReturnNoteId: number;

  @ManyToOne(() => ReturnNoteEntity, { nullable: true })
  @JoinColumn({ name: 'sourceReturnNoteId' })
  sourceReturnNote: ReturnNoteEntity;

  @Column({ type: 'varchar', length: 25, unique: true })
  sequential: string;

  @Column({ type: 'enum', enum: ACTIVITY_TYPE, default: ACTIVITY_TYPE.SELLING })
  activityType: ACTIVITY_TYPE;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference: string;

  @Column({ nullable: true })
  date: Date;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  object: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  generalConditions: string;

  @Column({ type: 'enum', enum: CREDIT_NOTE_STATUS, nullable: true })
  status: CREDIT_NOTE_STATUS;

  @Column({ nullable: true })
  discount: number;

  @Column({ type: 'enum', enum: DISCOUNT_TYPES, nullable: true })
  discount_type: DISCOUNT_TYPES;

  @Column({ type: 'float', nullable: true })
  subTotal: number;

  @Column({ type: 'float', nullable: true })
  total: number;

  @Column({ type: 'float', nullable: true })
  amountPaid: number;

  @ManyToOne(() => CurrencyEntity)
  @JoinColumn({ name: 'currencyId' })
  currency: CurrencyEntity;

  @Column({ type: 'int' })
  currencyId: number;

  @ManyToOne(() => FirmEntity)
  @JoinColumn({ name: 'firmId' })
  firm: FirmEntity;

  @Column({ type: 'int' })
  firmId: number;

  @ManyToOne(() => InterlocutorEntity)
  @JoinColumn({ name: 'interlocutorId' })
  interlocutor: InterlocutorEntity;

  @ManyToOne(() => CabinetEntity)
  @JoinColumn({ name: 'cabinetId' })
  cabinet: CabinetEntity;

  @Column({ type: 'int' })
  cabinetId: number;

  @Column({ type: 'int' })
  interlocutorId: number;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  notes: string;

  @OneToMany(() => ArticleCreditNoteEntryEntity, (entry) => entry.creditNote)
  articleCreditNoteEntries: ArticleCreditNoteEntryEntity[];

  @OneToOne(() => CreditNoteMetaDataEntity)
  @JoinColumn()
  creditNoteMetaData: CreditNoteMetaDataEntity;

  @ManyToOne(() => BankAccountEntity)
  @JoinColumn({ name: 'bankAccountId' })
  bankAccount: BankAccountEntity;

  @Column({ type: 'int' })
  bankAccountId: number;

  @OneToMany(() => CreditNoteStorageEntity, (upload) => upload.creditNote)
  uploads: CreditNoteStorageEntity[];

  @ManyToOne(() => QuotationEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'quotationId' })
  quotation: QuotationEntity;

  @Column({ type: 'int', nullable: true })
  quotationId: number;

  @ManyToOne(() => DeliveryNoteEntity)
  @JoinColumn({ name: 'deliveryNoteId' })
  deliveryNote: DeliveryNoteEntity;

  @Column({ type: 'int', nullable: true })
  deliveryNoteId: number;

  @ManyToOne(() => GoodsIssueNoteEntity)
  @JoinColumn({ name: 'goodsIssueNoteId' })
  goodsIssueNote: GoodsIssueNoteEntity;

  @Column({ type: 'int', nullable: true })
  goodsIssueNoteId: number;

  @ManyToOne(() => TaxEntity, {
    nullable: true,
  })
  @JoinColumn({ name: 'taxStampId' })
  taxStamp: TaxEntity;

  @Column({ type: 'int', nullable: true })
  taxStampId: number;

  @OneToMany(() => PaymentCreditNoteEntryEntity, (entry) => entry.creditNote)
  payments: PaymentCreditNoteEntryEntity[];

  @ManyToOne(() => TaxWithholdingEntity)
  @JoinColumn({ name: 'taxWithholdingId' })
  taxWithholding: TaxWithholdingEntity;

  @Column({ type: 'int', nullable: true })
  taxWithholdingId: number;

  @Column({ type: 'float', nullable: true })
  taxWithholdingAmount: number;
}
