import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DateFormat } from '../enums/date-format.enum';

@Entity('sequences')
export class SequenceEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  label: string;

  @Column({ type: 'varchar', length: 3, nullable: true })
  prefix: string;

  @Column({ type: 'enum', enum: DateFormat, default: DateFormat.YYYY })
  dateFormat: DateFormat;

  @Column({ type: 'int', default: 1 })
  next: number;
}
