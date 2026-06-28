import { DISCOUNT_TYPES } from 'src/app/enums/discount-types.enum';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { ArticleEntity } from 'src/modules/article/entities/article.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ArticleCustomerOrderEntryTaxEntity } from './article-customer-order-entry-tax.entity';
import { CustomerOrderEntity } from './customer-order.entity';

@Entity('article-customer-order-entry')
export class ArticleCustomerOrderEntryEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'float', nullable: true })
  unit_price: number;

  @Column({ type: 'float', nullable: true })
  quantity: number;

  @Column({ type: 'float', nullable: true })
  discount: number;

  @Column({ type: 'enum', enum: DISCOUNT_TYPES, nullable: true })
  discount_type: DISCOUNT_TYPES;

  @Column({ type: 'float', nullable: true })
  subTotal: number;

  @Column({ type: 'float', nullable: true })
  total: number;

  @ManyToOne(() => ArticleEntity)
  @JoinColumn({ name: 'articleId' })
  article: ArticleEntity;

  @Column({ type: 'int', nullable: true })
  articleId: number;

  @ManyToOne(() => CustomerOrderEntity)
  @JoinColumn({ name: 'customerOrderId' })
  customerOrder: CustomerOrderEntity;

  @Column({ type: 'int', nullable: true })
  customerOrderId: number;

  @OneToMany(
    () => ArticleCustomerOrderEntryTaxEntity,
    (articleCustomerOrderEntryTax) =>
      articleCustomerOrderEntryTax.articleCustomerOrderEntry,
  )
  articleCustomerOrderEntryTaxes: ArticleCustomerOrderEntryTaxEntity[];
}
