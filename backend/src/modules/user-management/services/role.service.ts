import { Transactional } from '@nestjs-cls/transactional';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { RoleRepository } from '../repositories/role.repository';
import { RoleNotFoundException } from '../errors/role/role.notfound.error';
import { CreateRoleDto } from '../dtos/role/create-role.dto';
import { RoleAlreadyExistsException } from '../errors/role/role.alreadyexists.error';
import { RolePermissionService } from './role-permission.service';
import { UpdateRoleDto } from '../dtos/role/update-role.dto';
import { RolePermissionEntity } from '../entities/role-permission.entity';
import { CreateRolePermissionDto } from '../dtos/role-permission/create-role-permission.dto';
import { RoleEntity } from '../entities/role.entity';
import { UserEntity } from '../entities/user.entity';
import { PermissionService } from './permission.service';
import { UserRepository } from '../repositories/user.repository';
import { UserNotFoundException } from '../errors/user/user.notfound.error';
import { CabinetUserRoleType } from '../rbac/permission.constants';
import {
  isCustomRole,
  isAdminRole,
  isSystemRoleLabel,
  normalizePermissionSelection,
} from '../rbac/rbac.utils';

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly rolePermissionService: RolePermissionService,
    private readonly permissionService: PermissionService,
    private readonly userRepository: UserRepository,
  ) {}

  async findOneById(id: string): Promise<RoleEntity> {
    const role = await this.roleRepository.findOneById(id);
    if (!role) {
      throw new RoleNotFoundException();
    }
    return role;
  }

  async findOneByCondition(
    query: IQueryObject = {},
  ): Promise<RoleEntity | null> {
    const queryBuilder = new QueryBuilder(this.roleRepository.getMetadata());
    const queryOptions = queryBuilder.build(query);
    const role = await this.roleRepository.findOne(
      queryOptions as FindOneOptions<RoleEntity>,
    );
    return role;
  }

  async findAll(query: IQueryObject): Promise<RoleEntity[]> {
    const queryBuilder = new QueryBuilder(this.roleRepository.getMetadata());
    const queryOptions = queryBuilder.build(query);
    const roles = await this.roleRepository.findAll(
      queryOptions as FindManyOptions<RoleEntity>,
    );
    return roles;
  }

  async findAllPaginated(query: IQueryObject): Promise<PageDto<RoleEntity>> {
    const queryBuilder = new QueryBuilder(this.roleRepository.getMetadata());
    const queryOptions = queryBuilder.build(query);
    const count = await this.roleRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.roleRepository.findAll(
      queryOptions as FindManyOptions<RoleEntity>,
    );

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto: {
        page: Number(query.page),
        take: Number(query.limit),
      },
      itemCount: count,
    });

    return new PageDto(entities, pageMetaDto);
  }

  @Transactional()
  async save(createRoleDto: CreateRoleDto): Promise<RoleEntity> {
    return await this.roleRepository.save(createRoleDto);
  }

  @Transactional()
  async saveMany(createRoleDto: CreateRoleDto[]): Promise<RoleEntity[]> {
    return Promise.all(createRoleDto.map((dto) => this.save(dto)));
  }

  @Transactional()
  async update(
    id: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<RoleEntity | null> {
    return this.roleRepository.update(id, updateRoleDto);
  }

  async softDelete(id: string): Promise<RoleEntity | null> {
    return this.roleRepository.softDelete(id);
  }

  async delete(id: string): Promise<RoleEntity | null> {
    const role = await this.roleRepository.findOneById(id);
    if (!role) {
      throw new RoleNotFoundException();
    }
    return this.roleRepository.remove(role);
  }

  //Extended Methods ===========================================================================

  async findOneByLabel(label: string): Promise<RoleEntity | null> {
    return this.roleRepository.findOne({ where: { label } });
  }

  async findAllForActor(
    actorUserId: string,
    query: IQueryObject = {},
  ): Promise<RoleEntity[]> {
    const actor = await this.getActorOrFail(actorUserId);
    const actorCabinetIds = this.getUserCabinetIds(actor);
    const roles = await this.findAll({
      ...query,
      join: query.join || 'permissions,permissions.permission',
    });

    return roles.filter(
      (role) =>
        !role.cabinetId || actorCabinetIds.includes(Number(role.cabinetId)),
    );
  }

  async findAllPaginatedForActor(
    actorUserId: string,
    query: IQueryObject = {},
  ): Promise<PageDto<RoleEntity>> {
    const paginated = await this.findAllPaginated({
      ...query,
      join: query.join || 'permissions,permissions.permission',
    });
    const actor = await this.getActorOrFail(actorUserId);
    const actorCabinetIds = this.getUserCabinetIds(actor);
    const data = paginated.data.filter(
      (role) =>
        !role.cabinetId || actorCabinetIds.includes(Number(role.cabinetId)),
    );

    return new PageDto(
      data,
      new PageMetaDto({
        pageOptionsDto: {
          page: Number(query.page),
          take: Number(query.limit),
        },
        itemCount: data.length,
      }),
    );
  }

  async findOneByIdForActor(
    actorUserId: string,
    id: string,
  ): Promise<RoleEntity> {
    const actor = await this.getActorOrFail(actorUserId);
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions', 'permissions.permission'],
    });
    if (!role) throw new RoleNotFoundException();
    this.assertActorCanAccessRole(actor, role);
    return role;
  }

  @Transactional()
  async saveWithPermissionsForActor(
    actorUserId: string,
    createRoleDto: CreateRoleDto,
  ): Promise<RoleEntity> {
    const actor = await this.getActorOrFail(actorUserId);
    this.assertActorAdmin(actor);

    if (isSystemRoleLabel(createRoleDto.label)) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de créer un rôle système.",
      );
    }

    const cabinetId = this.resolveRoleCabinetId(actor, createRoleDto.cabinetId);
    const permissionIds = await this.normalizeAndValidatePermissionPayload(
      (createRoleDto.permissions || []).map(
        (permission) => permission.permissionId,
      ),
    );
    await this.assertRoleLabelAvailable(createRoleDto.label, cabinetId);

    const role = await this.roleRepository.save({
      label: createRoleDto.label,
      description: createRoleDto.description,
      cabinetId,
    });
    await this.rolePermissionService.saveMany(
      permissionIds.map((permissionId) => ({
        roleId: role.id,
        permissionId,
      })),
    );

    return this.findOneByIdForActor(actorUserId, role.id);
  }

  @Transactional()
  async updateWithPermissionsForActor(
    actorUserId: string,
    id: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<RoleEntity | null> {
    const actor = await this.getActorOrFail(actorUserId);
    this.assertActorAdmin(actor);

    const existingRole = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions', 'permissions.permission', 'users'],
    });
    if (!existingRole) throw new RoleNotFoundException();
    this.assertActorCanAccessRole(actor, existingRole);

    if (!isCustomRole(existingRole)) {
      throw new ForbiddenException(
        'Les rôles système ne sont pas modifiables.',
      );
    }

    const nextCabinetId = this.resolveRoleCabinetId(
      actor,
      updateRoleDto.cabinetId ?? existingRole.cabinetId,
    );
    if (nextCabinetId !== existingRole.cabinetId) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de déplacer ce rôle vers un autre cabinet.",
      );
    }

    if (updateRoleDto.label && updateRoleDto.label !== existingRole.label) {
      if (isSystemRoleLabel(updateRoleDto.label)) {
        throw new ForbiddenException(
          "Vous n'avez pas l'autorisation de renommer un rôle en rôle système.",
        );
      }
      await this.assertRoleLabelAvailable(
        updateRoleDto.label,
        nextCabinetId,
        id,
      );
    }

    const permissionIds =
      updateRoleDto.permissions === undefined
        ? existingRole.permissions.map((permission) => permission.permissionId)
        : await this.normalizeAndValidatePermissionPayload(
            updateRoleDto.permissions.map(
              (permission) => permission.permissionId,
            ),
          );

    await this.roleRepository.update(id, {
      label: updateRoleDto.label ?? existingRole.label,
      description: updateRoleDto.description ?? existingRole.description,
      cabinetId: nextCabinetId,
    });

    await this.replaceRolePermissions(id, permissionIds);
    return this.findOneByIdForActor(actorUserId, id);
  }

  @Transactional()
  async duplicateWithPermissionsForActor(
    actorUserId: string,
    id: string,
  ): Promise<RoleEntity | null> {
    const actor = await this.getActorOrFail(actorUserId);
    this.assertActorAdmin(actor);
    const role = await this.findOneByIdForActor(actorUserId, id);
    const cabinetId = role.cabinetId || this.resolveRoleCabinetId(actor);
    return this.saveWithPermissionsForActor(actorUserId, {
      label: `${role.label} copy`,
      description: role.description,
      cabinetId,
      permissions: role.permissions.map((p) => ({
        permissionId: p.permissionId,
      })),
    });
  }

  async softDeleteForActor(
    actorUserId: string,
    id: string,
  ): Promise<RoleEntity | null> {
    const actor = await this.getActorOrFail(actorUserId);
    this.assertActorAdmin(actor);

    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users'],
    });
    if (!role) throw new RoleNotFoundException();
    this.assertActorCanAccessRole(actor, role);

    if (!isCustomRole(role)) {
      throw new ForbiddenException(
        'Les rôles système ne peuvent pas être supprimés.',
      );
    }
    if (role.users?.length) {
      throw new BadRequestException(
        'Ce rôle est attribué à des utilisateurs et ne peut pas être supprimé.',
      );
    }

    return this.roleRepository.softDelete(id);
  }

  @Transactional()
  async saveWithPermissions(createRoleDto: CreateRoleDto): Promise<RoleEntity> {
    const { permissions, ...rest } = createRoleDto;
    const existingRole = await this.roleRepository.findOne({
      where: { label: createRoleDto.label },
    });
    if (existingRole) {
      throw new RoleAlreadyExistsException();
    }
    await this.permissionService.ensurePermissionsExist(
      (permissions || [])
        .map((permission) => permission.permissionId)
        .filter(Boolean),
    );
    const role = await this.roleRepository.save(rest);
    await this.rolePermissionService.saveMany(
      (permissions || []).map((p) => ({
        roleId: role.id,
        permissionId: p.permissionId,
      })),
    );
    return role;
  }

  @Transactional()
  async saveManyWithPermissions(
    createRoleDtos: CreateRoleDto[],
  ): Promise<RoleEntity[]> {
    return Promise.all(
      createRoleDtos.map((dto) => this.saveWithPermissions(dto)),
    );
  }

  @Transactional()
  async updateWithPermissions(
    id: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<RoleEntity | null> {
    const { permissions, ...rest } = updateRoleDto;
    await this.permissionService.ensurePermissionsExist(
      (permissions || [])
        .map((permission) => permission.permissionId)
        .filter(Boolean),
    );
    const existingRole = await this.roleRepository.findOneById(id);
    if (!existingRole) throw new RoleNotFoundException();

    await this.roleRepository.update(id, rest);

    const updatedRole = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!updatedRole) throw new RoleNotFoundException();

    const existingPermissions = updatedRole?.permissions?.map(
      (p: RolePermissionEntity) => {
        return {
          id: p.id,
          permissionId: p.permissionId,
          roleId: p.roleId,
        };
      },
    );

    await this.roleRepository.updateAssociations<
      Pick<RolePermissionEntity, 'id' | 'permissionId' | 'roleId'>
    >({
      existingItems: existingPermissions || [],
      updatedItems: permissions?.map((permission) => ({
        id: permission.id,
        permissionId: permission.permissionId,
        roleId: updatedRole?.id,
      })),
      keys: ['permissionId', 'roleId'],
      onDelete: async (id: string) => {
        return this.rolePermissionService.softDelete(id);
      },
      onCreate: async (p: CreateRolePermissionDto) => {
        return this.rolePermissionService.save({
          roleId: updatedRole?.id,
          permissionId: p.permissionId,
        });
      },
    });

    return updatedRole;
  }

  @Transactional()
  async duplicateWithPermissions(id: string): Promise<RoleEntity | null> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) {
      throw new RoleNotFoundException();
    }
    return this.saveWithPermissions({
      label: `${role.label} copy`,
      description: role.description,
      permissions: role.permissions.map((p) => ({
        permissionId: p.permissionId,
      })),
    });
  }

  private async getActorOrFail(actorUserId: string) {
    const actor = await this.userRepository.findOne({
      where: { id: actorUserId },
      relations: [
        'role',
        'role.permissions',
        'role.permissions.permission',
        'cabinetMemberships',
        'cabinetMemberships.permissions',
        'cabinetMemberships.permissions.permission',
      ],
    });
    if (!actor) throw new UserNotFoundException();
    return actor;
  }

  private getUserCabinetIds(user: UserEntity) {
    const membershipCabinetIds = (user.cabinetMemberships || [])
      .filter((membership) => membership.isActive !== false)
      .map((membership) => Number(membership.cabinetId));

    return membershipCabinetIds.filter(
      (cabinetId) => Number.isInteger(cabinetId) && cabinetId > 0,
    );
  }

  private assertActorAdmin(actor: UserEntity) {
    const hasAdminMembership = (actor.cabinetMemberships || []).some(
      (membership) =>
        membership.isActive !== false &&
        membership.roleType === CabinetUserRoleType.ADMIN,
    );

    if (!hasAdminMembership && !isAdminRole(actor.role)) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de gérer les rôles.",
      );
    }
  }

  private assertActorCanAccessRole(actor: UserEntity, role: RoleEntity) {
    if (!role.cabinetId) return;
    const actorCabinetIds = this.getUserCabinetIds(actor);
    if (!actorCabinetIds.includes(Number(role.cabinetId))) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de consulter ce rôle.",
      );
    }
  }

  private resolveRoleCabinetId(actor: UserEntity, cabinetId?: number | null) {
    const actorCabinetIds = this.getUserCabinetIds(actor);
    const nextCabinetId = Number(cabinetId || actorCabinetIds[0]);

    if (!Number.isInteger(nextCabinetId) || nextCabinetId <= 0) {
      throw new BadRequestException('Un cabinet valide est requis.');
    }

    if (!actorCabinetIds.includes(nextCabinetId)) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de gérer ce cabinet.",
      );
    }

    return nextCabinetId;
  }

  private async normalizeAndValidatePermissionPayload(permissionIds: string[]) {
    const officialPermissionIds =
      await this.permissionService.assertPermissionsExist(permissionIds);
    return normalizePermissionSelection(officialPermissionIds);
  }

  private async assertRoleLabelAvailable(
    label: string,
    cabinetId: number,
    excludedRoleId?: string,
  ) {
    const existingRole = await this.roleRepository.findOne({
      where: { label, cabinetId },
    });

    if (existingRole && existingRole.id !== excludedRoleId) {
      throw new RoleAlreadyExistsException();
    }
  }

  private async replaceRolePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    const existingRole = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });
    if (!existingRole) throw new RoleNotFoundException();

    const existingPermissions = existingRole.permissions || [];
    const nextPermissionIds = new Set(permissionIds);

    await Promise.all(
      existingPermissions
        .filter((permission) => !nextPermissionIds.has(permission.permissionId))
        .map((permission) =>
          this.rolePermissionService.softDelete(String(permission.id)),
        ),
    );

    const existingPermissionIds = new Set(
      existingPermissions.map((permission) => permission.permissionId),
    );
    await this.rolePermissionService.saveMany(
      permissionIds
        .filter((permissionId) => !existingPermissionIds.has(permissionId))
        .map((permissionId) => ({ roleId, permissionId })),
    );
  }
}
