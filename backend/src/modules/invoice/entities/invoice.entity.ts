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
import { INVOICE_STATUS } from '../enums/invoice-status.enum';
import { DISCOUNT_TYPES } from 'src/app/enums/discount-types.enum';
import { CurrencyEntity } from 'src/modules/currency/entities/currency.entity';
import { FirmEntity } from 'src/modules/firm/entities/firm.entity';
import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';
import { TaxWithholdingEntity } from 'src/modules/tax-withholding/entities/tax-withholding.entity';
import { PaymentInvoiceEntryEntity } from 'src/modules/payment/entities/payment-invoice-entry.entity';
import { TaxEntity } from 'src/modules/tax/entities/tax.entity';
import { QuotationEntity } from 'src/modules/quotation/entities/quotation.entity';
import { DeliveryNoteEntity } from 'src/modules/delivery-note/entities/delivery-note.entity';
import { GoodsIssueNoteEntity } from 'src/modules/goods-issue-note/entities/goods-issue-note.entity';
import { InvoiceStorageEntity } from './invoice-file.entity';
import { InvoiceMetaDataEntity } from './invoice-meta-data.entity';
import { BankAccountEntity } from 'src/modules/bank-account/entities/bank-account.entity';
import { ArticleInvoiceEntryEntity } from './article-invoice-entry.entity';
import { InterlocutorEntity } from 'src/modules/interlocutor/entities/interlocutor.entity';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';

import { CustomerOrderEntity } from 'src/modules/customer-order/entities/customer-order.entity';
import { CreditNoteEntity } from 'src/modules/credit-note/entities/credit-note.entity';
import { ReturnNoteEntity } from 'src/modules/return-note/entities/return-note.entity';

@Entity('invoice')
export class InvoiceEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ type: 'enum', enum: INVOICE_STATUS, nullable: true })
  status: INVOICE_STATUS;

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

  @Column({ type: 'float', nullable: true, default: 0 })
  amountSettled: number;

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

  @Column({ type: 'int', default: 1 })
  cabinetId: number;

  @Column({ type: 'int' })
  interlocutorId: number;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  notes: string;

  @OneToMany(() => ArticleInvoiceEntryEntity, (entry) => entry.invoice)
  articleInvoiceEntries: ArticleInvoiceEntryEntity[];

  @OneToOne(() => InvoiceMetaDataEntity)
  @JoinColumn()
  invoiceMetaData: InvoiceMetaDataEntity;

  @ManyToOne(() => BankAccountEntity)
  @JoinColumn({ name: 'bankAccountId' })
  bankAccount: BankAccountEntity;

  @Column({ type: 'int' })
  bankAccountId: number;

  @OneToMany(() => InvoiceStorageEntity, (upload) => upload.invoice)
  uploads: InvoiceStorageEntity[];

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

  @ManyToOne(() => CustomerOrderEntity, { nullable: true })
  @JoinColumn({ name: 'customerOrderId' })
  customerOrder: CustomerOrderEntity;

  @Column({ type: 'int', nullable: true })
  customerOrderId: number;

  @ManyToOne(() => ReturnNoteEntity)
  @JoinColumn({ name: 'returnNoteId' })
  returnNote: ReturnNoteEntity;

  @Column({ type: 'int', nullable: true })
  returnNoteId: number;

  @OneToMany(() => CreditNoteEntity, (note) => note.sourceInvoice)
  creditNotes: CreditNoteEntity[];

  @OneToMany(() => ReturnNoteEntity, (note) => note.sourceInvoice)
  returnNotes: ReturnNoteEntity[];

  @ManyToOne(() => TaxEntity, {
    nullable: true,
  })
  @JoinColumn({ name: 'taxStampId' })
  taxStamp: TaxEntity;

  @Column({ type: 'int', nullable: true })
  taxStampId: number;

  @OneToMany(() => PaymentInvoiceEntryEntity, (entry) => entry.invoice)
  payments: PaymentInvoiceEntryEntity[];

  @ManyToOne(() => TaxWithholdingEntity)
  @JoinColumn({ name: 'taxWithholdingId' })
  taxWithholding: TaxWithholdingEntity;

  @Column({ type: 'int', nullable: true })
  taxWithholdingId: number;

  @Column({ type: 'float', nullable: true })
  taxWithholdingAmount: number;
}
