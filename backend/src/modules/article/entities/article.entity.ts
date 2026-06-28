import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { StorageEntity } from 'src/shared/storage/entities/storage.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ARTICLE_DESTINATION } from '../enums/article-destination.enum';
import { ARTICLE_DISCOUNT_TYPE } from '../enums/article-discount-type.enum';
import { ARTICLE_TYPE } from '../enums/article-type.enum';
import { ArticleInvoiceEntryEntity } from 'src/modules/invoice/entities/article-invoice-entry.entity';
import { ArticleQuotationEntryEntity } from 'src/modules/quotation/entities/article-quotation-entry.entity';
import { ArticleDeliveryNoteEntryEntity } from 'src/modules/delivery-note/entities/article-delivery-note-entry.entity';
import { ArticleGoodsIssueNoteEntryEntity } from 'src/modules/goods-issue-note/entities/article-goods-issue-note-entry.entity';
import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';
import { PriceListEntity } from 'src/modules/price-list/entities/price-list.entity';

@Entity('article')
export class ArticleEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference: string;

  @ManyToOne(() => CabinetEntity)
  @JoinColumn({ name: 'cabinetId' })
  cabinet?: CabinetEntity;

  @Column({ type: 'int', nullable: true })
  cabinetId?: number;

  @Column({
    type: 'enum',
    enum: ARTICLE_DESTINATION,
    default: ARTICLE_DESTINATION.SELLING,
  })
  destination: ARTICLE_DESTINATION;

  @Column({
    type: 'enum',
    enum: ARTICLE_TYPE,
    default: ARTICLE_TYPE.PRODUCT,
  })
  articleType: ARTICLE_TYPE;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => StorageEntity, { nullable: true })
  @JoinColumn({ name: 'imageId' })
  image?: StorageEntity;

  @Column({ type: 'int', nullable: true })
  imageId?: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  salePrice?: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  purchasePrice?: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  productionCost?: number;

  @Column({ type: 'json', nullable: true })
  taxIds?: number[];

  @Column({ type: 'json', nullable: true })
  additionalTaxIds?: number[];

  @Column({ type: 'json', nullable: true })
  priceListPrices?: Array<{
    priceListId: number;
    type: 'fixed' | 'percentage';
    salePrice: number;
    purchasePrice: number;
  }>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  unit?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  family?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subFamily?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  priceListName?: string;

  @ManyToOne(() => PriceListEntity, { nullable: true })
  @JoinColumn({ name: 'priceListId' })
  priceList?: PriceListEntity;

  @Column({ type: 'int', nullable: true })
  priceListId?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  barcode?: string;

  @Column({ type: 'text', nullable: true })
  privateNotes?: string;

  @Column({ type: 'json', nullable: true })
  attachmentIds?: number[];

  @Column({ type: 'boolean', default: false })
  isService: boolean;

  @Column({ type: 'float', default: 0 })
  stockQuantity: number;

  @Column({ type: 'float', default: 0 })
  stockAlertThreshold: number;

  @Column({ type: 'boolean', default: true })
  allowEmptyStock: boolean;

  @OneToMany(() => ArticleInvoiceEntryEntity, (entry) => entry.article)
  articleInvoiceEntries: ArticleInvoiceEntryEntity[];

  @OneToMany(() => ArticleQuotationEntryEntity, (entry) => entry.article)
  articleQuotationEntries: ArticleQuotationEntryEntity[];

  @OneToMany(() => ArticleDeliveryNoteEntryEntity, (entry) => entry.article)
  articleDeliveryNoteEntries: ArticleDeliveryNoteEntryEntity[];

  @OneToMany(() => ArticleGoodsIssueNoteEntryEntity, (entry) => entry.article)
  articleGoodsIssueNoteEntries: ArticleGoodsIssueNoteEntryEntity[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  defaultWarehouse?: string;

  @Column({ type: 'boolean', default: false })
  discountEnabled: boolean;

  @Column({ type: 'float', nullable: true })
  discountValue?: number;

  @Column({
    type: 'enum',
    enum: ARTICLE_DISCOUNT_TYPE,
    default: ARTICLE_DISCOUNT_TYPE.PERCENTAGE,
  })
  discountType: ARTICLE_DISCOUNT_TYPE;
}
