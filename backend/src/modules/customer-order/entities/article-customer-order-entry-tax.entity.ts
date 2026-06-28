import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { ArticleCustomerOrderEntryEntity } from './article-customer-order-entry.entity';
import { TaxEntity } from 'src/modules/tax/entities/tax.entity';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';

@Entity('article-customer-order-entry-tax')
export class ArticleCustomerOrderEntryTaxEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ArticleCustomerOrderEntryEntity)
  @JoinColumn({ name: 'articleCustomerOrderEntryId' })
  articleCustomerOrderEntry: ArticleCustomerOrderEntryEntity;

  @Column({ type: 'int' })
  articleCustomerOrderEntryId: number;

  @ManyToOne(() => TaxEntity)
  @JoinColumn({ name: 'taxId' })
  tax: TaxEntity;

  @Column({ type: 'int' })
  taxId: number;
}
