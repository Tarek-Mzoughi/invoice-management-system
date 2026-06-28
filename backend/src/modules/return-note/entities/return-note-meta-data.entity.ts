import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ReturnNoteEntity } from './return-note.entity';

@Entity('return_note_meta_data')
export class ReturnNoteMetaDataEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(
    () => ReturnNoteEntity,
    (returnNote) => returnNote.returnNoteMetaData,
  )
  returnNote: ReturnNoteEntity;

  @Column({ type: 'boolean', default: true })
  showInvoiceAddress: boolean;

  @Column({ type: 'boolean', default: true })
  showDeliveryAddress: boolean;

  @Column({ type: 'boolean', default: true })
  showArticleDescription: boolean;

  @Column({ type: 'boolean', default: true })
  showPrices: boolean;

  @Column({ type: 'boolean', default: true })
  hasBankingDetails: boolean;

  @Column({ type: 'boolean', default: true })
  hasGeneralConditions: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vehicleRegistration: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  driverName: string;

  @Column({ type: 'json', nullable: true })
  taxSummary: any;
}
