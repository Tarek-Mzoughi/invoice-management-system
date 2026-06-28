import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';
import { CabinetUserRoleType } from '../rbac/permission.constants';
import { UserEntity } from './user.entity';
import { UserCabinetPermissionEntity } from './user-cabinet-permission.entity';

@Entity('user_cabinets')
export class UserCabinetEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  userId: string;

  @PrimaryColumn({ type: 'int' })
  cabinetId: number;

  @Column({
    type: 'enum',
    enum: CabinetUserRoleType,
    default: CabinetUserRoleType.COLLABORATOR,
  })
  roleType: CabinetUserRoleType;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isPrincipalAdmin: boolean;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @ManyToOne(() => UserEntity, (user) => user.cabinetMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => CabinetEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cabinetId' })
  cabinet: CabinetEntity;

  @OneToMany(
    () => UserCabinetPermissionEntity,
    (permission) => permission.membership,
  )
  permissions?: UserCabinetPermissionEntity[];
}
