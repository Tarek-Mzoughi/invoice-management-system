import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PermissionEntity } from './permission.entity';
import { UserCabinetEntity } from './user-cabinet.entity';

@Entity('user_cabinet_permissions')
export class UserCabinetPermissionEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  userId: string;

  @PrimaryColumn({ type: 'int' })
  cabinetId: number;

  @PrimaryColumn({ type: 'varchar', length: 255 })
  permissionId: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @ManyToOne(() => UserCabinetEntity, (membership) => membership.permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'userId', referencedColumnName: 'userId' },
    { name: 'cabinetId', referencedColumnName: 'cabinetId' },
  ])
  membership: UserCabinetEntity;

  @ManyToOne(() => PermissionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permissionId' })
  permission?: PermissionEntity;
}
