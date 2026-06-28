import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RoleEntity } from './role.entity';
import { LogEntity } from 'src/shared/logger/entities/log.entity';
import { ProfileEntity } from './profile.entity';
import { UserCabinetEntity } from './user-cabinet.entity';
import { Exclude } from 'class-transformer';

@Entity('users')
export class UserEntity extends EntityHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ type: 'datetime', nullable: true })
  dateOfBirth?: Date;

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: false })
  isApproved: boolean;

  @Column({ nullable: true })
  @Exclude()
  password?: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'timestamp', nullable: true })
  emailVerified?: Date;

  @Column({ default: false })
  mustChangePassword: boolean;

  @Column({ nullable: true })
  image?: string;

  @Column({ length: 64, nullable: true })
  @Exclude()
  passwordResetTokenHash?: string;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude()
  passwordResetTokenExpiresAt?: Date;

  @Column({ length: 64, nullable: true })
  @Exclude()
  emailVerificationTokenHash?: string;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude()
  emailVerificationTokenExpiresAt?: Date;

  @ManyToOne(() => RoleEntity, (role) => role.users, {
    onDelete: 'CASCADE',
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'roleId', foreignKeyConstraintName: 'FK_users_role' })
  role: RoleEntity;

  @Column({ nullable: true })
  roleId: string;

  @OneToMany(() => LogEntity, (log) => log.user)
  logs?: LogEntity[];

  @OneToOne(() => ProfileEntity, (profile) => profile.user, {
    eager: true,
    nullable: true,
  })
  @JoinColumn({
    name: 'profileId',
    foreignKeyConstraintName: 'FK_users_profile',
  })
  profile?: ProfileEntity;

  @Column({ nullable: true })
  profileId: number;

  @OneToMany(() => UserCabinetEntity, (membership) => membership.user)
  cabinetMemberships?: UserCabinetEntity[];
}
