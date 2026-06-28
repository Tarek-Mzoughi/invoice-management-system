import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentEntity } from './payment.entity';
import { CreditNoteEntity } from 'src/modules/credit-note/entities/credit-note.entity';
import { CurrencyEntity } from 'src/modules/currency/entities/currency.entity';

@Entity('payment_credit_note_entry')
export class PaymentCreditNoteEntryEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PaymentEntity, (payment) => payment.creditNotes)
  @JoinColumn({ name: 'paymentId' })
  payment: PaymentEntity;

  @Column({ type: 'int' })
  paymentId: number;

  @ManyToOne(() => CreditNoteEntity)
  @JoinColumn({ name: 'creditNoteId' })
  creditNote: CreditNoteEntity;

  @Column({ type: 'int' })
  creditNoteId: number;

  @Column({ type: 'float', nullable: true })
  amount: number;

  @ManyToOne(() => CurrencyEntity)
  @JoinColumn({ name: 'originalCurrencyId' })
  originalCurrency: CurrencyEntity;

  @Column({ type: 'int', nullable: true })
  originalCurrencyId: number;

  @Column({ type: 'float', nullable: true })
  exchangeRateToPaymentCurrency: number;

  @Column({ type: 'float', nullable: true })
  convertedAmount: number;

  @ManyToOne(() => CurrencyEntity)
  @JoinColumn({ name: 'convertedCurrencyId' })
  convertedCurrency: CurrencyEntity;

  @Column({ type: 'int', nullable: true })
  convertedCurrencyId: number;
}
