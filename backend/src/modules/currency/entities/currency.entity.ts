import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('currency')
export class CurrencyEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  label: string;

  @Column({ type: 'varchar', length: 3 })
  code: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  symbol: string;

  @Column({ type: 'int', nullable: true })
  digitAfterComma: number;
}
