import { UserEntity } from 'src/modules/user-management/entities/user.entity';
import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Gender } from '../enums/gender.enum';
import { StorageEntity } from 'src/shared/storage/entities/storage.entity';

@Entity('profiles')
export class ProfileEntity extends EntityHelper {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: true })
  phone?: string;

  @Column({ unique: true, nullable: true })
  cin?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender?: Gender;

  @Column({ default: false })
  isPrivate: boolean;

  @Column({ nullable: true })
  regionId?: number;

  @ManyToOne(() => StorageEntity, {
    onDelete: 'CASCADE',
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'pictureId' })
  picture?: StorageEntity;

  @Column({ nullable: true })
  pictureId?: number;

  @OneToOne(() => UserEntity, (user) => user.profile, { cascade: true })
  user: UserEntity;
}
