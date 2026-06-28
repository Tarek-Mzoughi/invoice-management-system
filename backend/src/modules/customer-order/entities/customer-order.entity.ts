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
import { ArticleCustomerOrderEntryEntity } from './article-customer-order-entry.entity';
import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';
import { CustomerOrderMetaDataEntity } from './customer-order-meta-data.entity';
import { BankAccountEntity } from 'src/modules/bank-account/entities/bank-account.entity';
import { CustomerOrderStorageEntity } from './customer-order-file.entity';
import { InvoiceEntity } from 'src/modules/invoice/entities/invoice.entity';
import { CUSTOMER_ORDER_STATUS } from '../enums/customer-order-status.enum';
import { InterlocutorEntity } from 'src/modules/interlocutor/entities/interlocutor.entity';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';

import { QuotationEntity } from 'src/modules/quotation/entities/quotation.entity';
import { DeliveryNoteEntity } from 'src/modules/delivery-note/entities/delivery-note.entity';
import { GoodsIssueNoteEntity } from 'src/modules/goods-issue-note/entities/goods-issue-note.entity';

@Entity('customer_order')
export class CustomerOrderEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  quotationId: number;

  @ManyToOne(() => QuotationEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'quotationId' })
  quotation: QuotationEntity;

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

  @Column({ type: 'enum', enum: CUSTOMER_ORDER_STATUS, nullable: true })
  status: CUSTOMER_ORDER_STATUS;

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

  @Column({ type: 'int' })
  cabinetId: number;

  @Column({ type: 'int' })
  interlocutorId: number;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  notes: string;

  @OneToMany(
    () => ArticleCustomerOrderEntryEntity,
    (entry) => entry.customerOrder,
  )
  articleCustomerOrderEntries: ArticleCustomerOrderEntryEntity[];

  @OneToOne(() => CustomerOrderMetaDataEntity)
  @JoinColumn()
  customerOrderMetaData: CustomerOrderMetaDataEntity;

  @ManyToOne(() => BankAccountEntity)
  @JoinColumn({ name: 'bankAccountId' })
  bankAccount: BankAccountEntity;

  @Column({ type: 'int' })
  bankAccountId: number;

  @OneToMany(() => CustomerOrderStorageEntity, (upload) => upload.customerOrder)
  uploads: CustomerOrderStorageEntity[];

  @OneToMany(() => InvoiceEntity, (invoice) => invoice.customerOrder)
  invoices: InvoiceEntity[];

  @OneToMany(() => DeliveryNoteEntity, (note) => note.customerOrder)
  deliveryNotes: DeliveryNoteEntity[];

  @OneToMany(() => GoodsIssueNoteEntity, (note) => note.customerOrder)
  goodsIssueNotes: GoodsIssueNoteEntity[];
}
