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
import { ArticleQuotationEntryEntity } from './article-quotation-entry.entity';
import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';
import { QuotationMetaDataEntity } from './quotation-meta-data.entity';
import { BankAccountEntity } from 'src/modules/bank-account/entities/bank-account.entity';
import { QuotationStorageEntity } from './quotation-file.entity';
import { InvoiceEntity } from 'src/modules/invoice/entities/invoice.entity';
import { QUOTATION_STATUS } from '../enums/quotation-status.enum';
import { InterlocutorEntity } from 'src/modules/interlocutor/entities/interlocutor.entity';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';

import { CustomerOrderEntity } from 'src/modules/customer-order/entities/customer-order.entity';
import { DeliveryNoteEntity } from 'src/modules/delivery-note/entities/delivery-note.entity';
import { GoodsIssueNoteEntity } from 'src/modules/goods-issue-note/entities/goods-issue-note.entity';

@Entity('quotation')
export class QuotationEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ type: 'enum', enum: QUOTATION_STATUS, nullable: true })
  status: QUOTATION_STATUS;

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

  @OneToMany(() => ArticleQuotationEntryEntity, (entry) => entry.quotation)
  articleQuotationEntries: ArticleQuotationEntryEntity[];

  @OneToOne(() => QuotationMetaDataEntity)
  @JoinColumn()
  quotationMetaData: QuotationMetaDataEntity;

  @ManyToOne(() => BankAccountEntity)
  @JoinColumn({ name: 'bankAccountId' })
  bankAccount: BankAccountEntity;

  @Column({ type: 'int' })
  bankAccountId: number;

  @OneToMany(() => QuotationStorageEntity, (upload) => upload.quotation)
  uploads: QuotationStorageEntity[];

  @OneToMany(() => InvoiceEntity, (invoice) => invoice.quotation)
  invoices: InvoiceEntity[];

  @OneToMany(() => CustomerOrderEntity, (order) => order.quotation)
  customerOrders: CustomerOrderEntity[];

  @OneToMany(() => DeliveryNoteEntity, (note) => note.quotation)
  deliveryNotes: DeliveryNoteEntity[];

  @OneToMany(() => GoodsIssueNoteEntity, (note) => note.quotation)
  goodsIssueNotes: GoodsIssueNoteEntity[];
}
