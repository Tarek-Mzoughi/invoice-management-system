import { DISCOUNT_TYPES } from 'src/app/enums/discount-types.enum';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { CurrencyEntity } from 'src/modules/currency/entities/currency.entity';
import { FirmEntity } from 'src/modules/firm/entities/firm.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ArticleDeliveryNoteEntryEntity } from './article-delivery-note-entry.entity';
import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';
import { DeliveryNoteMetaDataEntity } from './delivery-note-meta-data.entity';
import { BankAccountEntity } from 'src/modules/bank-account/entities/bank-account.entity';
import { DeliveryNoteStorageEntity } from './delivery-note-file.entity';
import { InvoiceEntity } from 'src/modules/invoice/entities/invoice.entity';
import { DELIVERY_NOTE_STATUS } from '../enums/delivery-note-status.enum';
import { InterlocutorEntity } from 'src/modules/interlocutor/entities/interlocutor.entity';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';

import { QuotationEntity } from 'src/modules/quotation/entities/quotation.entity';
import { CustomerOrderEntity } from 'src/modules/customer-order/entities/customer-order.entity';
import { ReturnNoteEntity } from 'src/modules/return-note/entities/return-note.entity';

@Entity('delivery_note')
export class DeliveryNoteEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  quotationId: number;

  @ManyToOne(() => QuotationEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'quotationId' })
  quotation: QuotationEntity;

  @Column({ type: 'int', nullable: true })
  customerOrderId: number;

  @ManyToOne(() => CustomerOrderEntity, { nullable: true })
  @JoinColumn({ name: 'customerOrderId' })
  customerOrder: CustomerOrderEntity;

  @Column({ type: 'int', nullable: true })
  invoiceId: number;

  @ManyToOne(() => InvoiceEntity, { nullable: true })
  @JoinColumn({ name: 'invoiceId' })
  invoice: InvoiceEntity;

  @Column({ type: 'varchar', length: 25, unique: true })
  sequential: string;

  @Column({ type: 'enum', enum: ACTIVITY_TYPE, default: ACTIVITY_TYPE.SELLING })
  activityType: ACTIVITY_TYPE;

  @Column({ nullable: true })
  date: Date;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  object: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  generalConditions: string;

  @Column({ type: 'enum', enum: DELIVERY_NOTE_STATUS, nullable: true })
  status: DELIVERY_NOTE_STATUS;

  @Column({ nullable: true })
  discount: number;

  @Column({ type: 'enum', enum: DISCOUNT_TYPES, nullable: true })
  discount_type: DISCOUNT_TYPES;

  @Column({ type: 'float', nullable: true })
  subTotal: number;

  @Column({ type: 'float', nullable: true })
  total: number;

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

  @OneToMany(
    () => ArticleDeliveryNoteEntryEntity,
    (entry) => entry.deliveryNote,
  )
  articleDeliveryNoteEntries: ArticleDeliveryNoteEntryEntity[];

  @OneToOne(() => DeliveryNoteMetaDataEntity)
  @JoinColumn()
  deliveryNoteMetaData: DeliveryNoteMetaDataEntity;

  @ManyToOne(() => BankAccountEntity)
  @JoinColumn({ name: 'bankAccountId' })
  bankAccount: BankAccountEntity;

  @Column({ type: 'int' })
  bankAccountId: number;

  @OneToMany(() => DeliveryNoteStorageEntity, (upload) => upload.deliveryNote)
  uploads: DeliveryNoteStorageEntity[];

  @OneToMany(() => InvoiceEntity, (invoice) => invoice.deliveryNote)
  invoices: InvoiceEntity[];

  @OneToMany(
    () => ReturnNoteEntity,
    (returnNote) => returnNote.sourceDeliveryNote,
  )
  returnNotes: ReturnNoteEntity[];
}
