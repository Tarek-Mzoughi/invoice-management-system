import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RoleEntity } from './role.entity';
import { PermissionEntity } from './permission.entity';

@Entity('role_permissions')
export class RolePermissionEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('FK_role_permissions_role')
  @Column()
  roleId: string;

  @Index('FK_role_permissions_permission')
  @Column()
  permissionId: string;

  @ManyToOne(() => RoleEntity, (role) => role.permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'roleId',
    foreignKeyConstraintName: 'FK_role_permissions_role',
  })
  role: RoleEntity;

  @ManyToOne(() => PermissionEntity, (permission) => permission.roles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'permissionId',
    foreignKeyConstraintName: 'FK_role_permissions_permission',
  })
  permission?: PermissionEntity;
}
