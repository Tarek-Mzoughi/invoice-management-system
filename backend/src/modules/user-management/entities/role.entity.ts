import { EntityHelper } from 'src/shared/database/interfaces/database.entity.interface';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { RolePermissionEntity } from './role-permission.entity';
import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';

@Entity('roles')
export class RoleEntity extends EntityHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  label: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  cabinetId?: number;

  @ManyToOne(() => CabinetEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cabinetId' })
  cabinet?: CabinetEntity;

  @OneToMany(
    () => RolePermissionEntity,
    (rolePermission) => rolePermission.role,
  )
  permissions: RolePermissionEntity[];

  @OneToMany(() => UserEntity, (user) => user.role)
  users: UserEntity[];
}
