import { TransactionHost, Transactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from '../repositories/user.repository';
import { UserNotFoundException } from '../errors/user/user.notfound.error';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { CreateUserDto } from '../dtos/user/create-user.dto';
import { comparePasswords, hashPassword } from 'src/shared/helpers/hash.utils';
import { UpdateUserDto } from '../dtos/user/update-user.dto';
import { UserEntity } from '../entities/user.entity';
import { ProfileService } from 'src/modules/user-management/services/profile.service';
import { UpdateCurrentProfileDto } from '../dtos/user/update-current-profile.dto';
import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';
import { CreateProfileDto } from '../dtos/profile/create-profile.dto';
import { UpdateProfileDto } from '../dtos/profile/update-profile.dto';
import { RoleRepository } from '../repositories/role.repository';
import { RoleEntity } from '../entities/role.entity';
import { CabinetUserRoleType } from '../rbac/permission.constants';
import {
  getEffectivePermissionIds,
  getStoredPermissionIds,
  isAdminRole,
  isAdminRoleLabel,
  isCollaboratorRoleLabel,
  isSystemRoleLabel,
  normalizePermissionSelection,
  resolveCabinetMembership,
} from '../rbac/rbac.utils';
import { UserCabinetEntity } from '../entities/user-cabinet.entity';
import { UserCabinetPermissionEntity } from '../entities/user-cabinet-permission.entity';
import { PermissionService } from './permission.service';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly profileService: ProfileService,
    private readonly roleRepository: RoleRepository,
    private readonly permissionService: PermissionService,
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
    @InjectRepository(UserCabinetEntity)
    private readonly userCabinetRepository: Repository<UserCabinetEntity>,
    @InjectRepository(UserCabinetPermissionEntity)
    private readonly userCabinetPermissionRepository: Repository<UserCabinetPermissionEntity>,
  ) {}

  private getUserCabinetRepository(): Repository<UserCabinetEntity> {
    return (
      this.txHost?.tx?.getRepository(UserCabinetEntity) ||
      this.userCabinetRepository
    );
  }

  private getUserCabinetPermissionRepository(): Repository<UserCabinetPermissionEntity> {
    return (
      this.txHost?.tx?.getRepository(UserCabinetPermissionEntity) ||
      this.userCabinetPermissionRepository
    );
  }

  async findOneById(
    id: string,
    requestedCabinetId?: number | null,
  ): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [
        'role',
        'role.permissions',
        'role.permissions.permission',
        'profile',
        'profile.picture',
        'cabinetMemberships',
        'cabinetMemberships.cabinet',
        'cabinetMemberships.permissions',
        'cabinetMemberships.permissions.permission',
      ],
    });
    if (!user) {
      throw new UserNotFoundException();
    }
    return this.withComputedRbac(user, undefined, requestedCabinetId);
  }

  async findOneByCondition(query: IQueryObject): Promise<UserEntity | null> {
    const queryBuilder = new QueryBuilder(this.userRepository.getMetadata());
    const queryOptions = queryBuilder.build(query);
    const user = await this.userRepository.findOne(
      queryOptions as FindOneOptions<UserEntity>,
    );
    return user;
  }

  async findAll(query: IQueryObject): Promise<UserEntity[]> {
    const queryBuilder = new QueryBuilder(this.userRepository.getMetadata());
    const queryOptions = queryBuilder.build(query);
    const users = await this.userRepository.findAll(
      queryOptions as FindManyOptions<UserEntity>,
    );
    return users;
  }

  async findAllPaginated(query: IQueryObject): Promise<PageDto<UserEntity>> {
    const queryBuilder = new QueryBuilder(this.userRepository.getMetadata());
    const queryOptions = queryBuilder.build(query);
    const count = await this.userRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.userRepository.findAll(
      queryOptions as FindManyOptions<UserEntity>,
    );

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto: { page: Number(query.page), take: Number(query.limit) },
      itemCount: count,
    });

    return new PageDto(entities, pageMetaDto);
  }

  async findAllForActor(
    actorUserId: string,
    query: IQueryObject = {},
  ): Promise<UserEntity[]> {
    const actor = await this.getActorOrFail(actorUserId);
    const users = await this.findAll({
      ...query,
      join: this.ensureUserRbacJoin(query.join),
    });

    return Promise.all(
      users
        .filter((user) => this.usersShareCabinet(actor, user))
        .map((user) => this.withComputedRbac(user, actor)),
    );
  }

  async findAllPaginatedForActor(
    actorUserId: string,
    query: IQueryObject = {},
  ): Promise<PageDto<UserEntity>> {
    const paginated = await this.findAllPaginated({
      ...query,
      join: this.ensureUserRbacJoin(query.join),
    });
    const actor = await this.getActorOrFail(actorUserId);
    const data = await Promise.all(
      paginated.data
        .filter((user) => this.usersShareCabinet(actor, user))
        .map((user) => this.withComputedRbac(user, actor)),
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
  ): Promise<UserEntity> {
    const actor = await this.getActorOrFail(actorUserId);
    const user = await this.findOneById(id);
    this.assertUsersShareCabinet(actor, user);
    return this.withComputedRbac(user, actor);
  }

  async findOneByEmailForActor(
    actorUserId: string,
    email: string,
  ): Promise<UserEntity | null> {
    const actor = await this.getActorOrFail(actorUserId);
    const user = await this.userRepository.findOne({
      where: { email },
      relations: [
        'role',
        'role.permissions',
        'role.permissions.permission',
        'profile',
        'profile.picture',
        'cabinetMemberships',
        'cabinetMemberships.cabinet',
        'cabinetMemberships.permissions',
        'cabinetMemberships.permissions.permission',
      ],
    });
    if (!user) return null;
    this.assertUsersShareCabinet(actor, user);
    return this.withComputedRbac(user, actor);
  }

  async save(createUserDto: DeepPartial<UserEntity>): Promise<UserEntity> {
    const hashedPassword =
      createUserDto.password && (await hashPassword(createUserDto.password));
    createUserDto.password = hashedPassword;
    return this.userRepository.save(createUserDto);
  }

  private sanitizePartial<T extends Record<string, unknown>>(data: T) {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    ) as Partial<T>;
  }

  private normalizeCabinetIds(cabinetIds?: number[]): number[] {
    return Array.from(
      new Set(
        (cabinetIds || []).filter(
          (cabinetId) => Number.isInteger(cabinetId) && Number(cabinetId) > 0,
        ),
      ),
    );
  }

  private mapCabinetRelations(cabinetIds?: number[]): CabinetEntity[] {
    return this.normalizeCabinetIds(cabinetIds).map(
      (cabinetId) => ({ id: cabinetId }) as CabinetEntity,
    );
  }

  private ensureUserRbacJoin(join?: string): string {
    const joins = new Set(
      (join || 'role,profile')
        .split(',')
        .map((relation) => relation.trim())
        .filter((relation) => relation !== 'cabinets')
        .filter(Boolean),
    );

    [
      'role',
      'role.permissions',
      'role.permissions.permission',
      'profile',
      'cabinetMemberships',
      'cabinetMemberships.cabinet',
      'cabinetMemberships.permissions',
      'cabinetMemberships.permissions.permission',
    ].forEach((relation) => joins.add(relation));

    return Array.from(joins).join(',');
  }

  private async normalizeCabinetIdsForRole(
    roleId?: string,
    cabinetIds?: number[],
  ): Promise<number[]> {
    const roleType = await this.inferRoleTypeFromRoleId(roleId);
    return this.normalizeCabinetIdsForRoleType(roleType, cabinetIds);
  }

  private normalizeCabinetIdsForRoleType(
    roleType: CabinetUserRoleType,
    cabinetIds?: number[],
  ): number[] {
    const normalizedCabinetIds = this.normalizeCabinetIds(cabinetIds);

    return roleType === CabinetUserRoleType.ADMIN
      ? normalizedCabinetIds
      : normalizedCabinetIds.slice(0, 1);
  }

  private async inferRoleTypeFromRoleId(
    roleId?: string,
  ): Promise<CabinetUserRoleType> {
    if (!roleId) return CabinetUserRoleType.COLLABORATOR;

    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (isAdminRoleLabel(role?.label)) return CabinetUserRoleType.ADMIN;
    if (isCollaboratorRoleLabel(role?.label)) {
      return CabinetUserRoleType.COLLABORATOR;
    }
    return CabinetUserRoleType.CUSTOM;
  }

  private normalizeRoleType(
    roleType?: CabinetUserRoleType | string | null,
    fallback: CabinetUserRoleType = CabinetUserRoleType.COLLABORATOR,
  ): CabinetUserRoleType {
    if (!roleType) return fallback;
    if (
      Object.values(CabinetUserRoleType).includes(
        roleType as CabinetUserRoleType,
      )
    ) {
      return roleType as CabinetUserRoleType;
    }
    throw new BadRequestException('Le type de rôle sélectionné est invalide.');
  }

  private buildUsernameCandidate(seed?: string, email?: string): string {
    const source = seed?.trim() || email?.split('@')[0] || 'user';
    const sanitized = source
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '.')
      .replace(/\.{2,}/g, '.')
      .replace(/^[._-]+|[._-]+$/g, '');

    return sanitized || 'user';
  }

  private async resolveUsername(
    username?: string,
    email?: string,
    excludedUserId?: string,
  ): Promise<string> {
    const baseUsername = this.buildUsernameCandidate(username, email);
    let candidate = baseUsername;
    let suffix = 1;

    while (true) {
      const existingUser = await this.findOneByUsername(candidate);

      if (!existingUser || existingUser.id === excludedUserId) {
        return candidate;
      }

      candidate = `${baseUsername}.${suffix}`;
      suffix += 1;
    }
  }

  private hasProfilePayload(
    profile?: CreateProfileDto | UpdateProfileDto,
  ): boolean {
    return Boolean(
      profile &&
        Object.values(profile).some(
          (value) => value !== undefined && value !== null,
        ),
    );
  }

  private async upsertProfile(
    profile: CreateProfileDto | UpdateProfileDto | undefined,
    existingProfileId?: number,
  ) {
    if (!profile || !this.hasProfilePayload(profile)) {
      return existingProfileId
        ? this.profileService.findOneById(existingProfileId)
        : undefined;
    }

    if (existingProfileId) {
      return this.profileService.updateWithUpload(existingProfileId, profile);
    }

    return this.profileService.saveWithUpload(profile);
  }

  @Transactional()
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity | null> {
    const existingUser = await this.userRepository.findOne({
      where: { id },
      relations: [
        'profile',
        'role',
        'role.permissions',
        'cabinetMemberships',
        'cabinetMemberships.cabinet',
        'cabinetMemberships.permissions',
      ],
    });
    if (!existingUser) throw new UserNotFoundException();

    const {
      profile,
      cabinetIds,
      password,
      username,
      roleType,
      permissionIds,
      ...userData
    } = updateUserDto;

    const nextProfile = profile
      ? await this.upsertProfile(profile, existingUser.profileId)
      : existingUser.profile;
    const nextRoleId = updateUserDto.roleId ?? existingUser.roleId;
    const nextRoleType = this.normalizeRoleType(
      roleType,
      await this.inferRoleTypeFromRoleId(nextRoleId),
    );
    const nextCabinetIds = this.normalizeCabinetIdsForRoleType(
      nextRoleType,
      cabinetIds !== undefined
        ? cabinetIds
        : this.getUserCabinetIds(existingUser),
    );
    const nextRole = nextRoleId
      ? await this.roleRepository.findOne({ where: { id: nextRoleId } })
      : null;

    const sanitizedUser = this.sanitizePartial(userData);
    const nextUsername =
      username !== undefined
        ? await this.resolveUsername(
            username,
            updateUserDto.email ?? existingUser.email,
            existingUser.id,
          )
        : existingUser.username;

    const nextUser = this.userRepository.create({
      ...existingUser,
      ...sanitizedUser,
      username: nextUsername,
      password: password ? await hashPassword(password) : existingUser.password,
      roleId: nextRoleId,
      role: nextRole ?? existingUser.role,
      profileId: nextProfile?.id ?? existingUser.profileId,
      profile: nextProfile ?? existingUser.profile,
    });

    const updatedUser = await this.userRepository.save(nextUser);
    await this.syncUserCabinetRbac(
      updatedUser.id,
      nextCabinetIds,
      nextRoleType,
      await this.resolvePermissionPayload(
        nextRoleType,
        permissionIds,
        existingUser,
        nextCabinetIds,
      ),
    );

    return this.findOneById(updatedUser.id);
  }

  @Transactional()
  async updateForActor(
    actorUserId: string,
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity | null> {
    const actor = await this.getActorOrFail(actorUserId);
    this.assertActorAdmin(actor);

    const targetUser = await this.findOneById(id);
    this.assertUsersShareCabinet(actor, targetUser);

    if (
      actor.id === targetUser.id &&
      (updateUserDto.roleId ||
        updateUserDto.roleType ||
        updateUserDto.permissionIds)
    ) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de modifier votre propre rôle ou vos permissions.",
      );
    }

    const nextRoleType = await this.resolveAssignableRoleType(
      actor,
      updateUserDto.roleType,
      updateUserDto.roleId,
      targetUser,
    );
    const nextRole = await this.resolveHistoricalRoleForRoleType(
      nextRoleType,
      updateUserDto.roleId ?? targetUser.roleId,
    );
    const nextCabinetIds = this.resolveAssignableCabinetIds(
      actor,
      nextRoleType,
      updateUserDto.cabinetIds,
      targetUser,
    );

    await this.assertPrincipalAdminMutationIsSafe(
      targetUser,
      nextRoleType,
      nextCabinetIds,
      updateUserDto,
    );

    if (
      this.isAdminInAnyCabinet(targetUser) &&
      nextRoleType !== CabinetUserRoleType.ADMIN &&
      !(await this.canRemoveAdminFromEveryCabinet(targetUser))
    ) {
      throw new ForbiddenException(
        'Ce cabinet doit conserver au moins un administrateur actif.',
      );
    }

    if (updateUserDto.isActive === false) {
      await this.assertCanDeactivateOrDeleteUser(actor, targetUser);
    }

    return this.update(id, {
      ...updateUserDto,
      roleId: nextRole.id,
      roleType: nextRoleType,
      cabinetIds: nextCabinetIds,
    });
  }

  @Transactional()
  async updateCurrentProfile(
    id: string,
    updateCurrentProfileDto: UpdateCurrentProfileDto,
  ): Promise<UserEntity | null> {
    const existingUser = await this.userRepository.findOne({
      where: { id },
      relations: ['profile'],
    });
    if (!existingUser) throw new UserNotFoundException();

    const nextProfile =
      updateCurrentProfileDto.profile !== undefined
        ? await this.upsertProfile(
            updateCurrentProfileDto.profile,
            existingUser.profileId,
          )
        : existingUser.profile;

    const sanitizedProfile = this.sanitizePartial({
      firstName: updateCurrentProfileDto.firstName,
      lastName: updateCurrentProfileDto.lastName,
      email: updateCurrentProfileDto.email,
      dateOfBirth: updateCurrentProfileDto.dateOfBirth
        ? new Date(updateCurrentProfileDto.dateOfBirth)
        : undefined,
      username:
        updateCurrentProfileDto.username !== undefined
          ? await this.resolveUsername(
              updateCurrentProfileDto.username,
              updateCurrentProfileDto.email ?? existingUser.email,
              existingUser.id,
            )
          : undefined,
      profileId: nextProfile?.id ?? existingUser.profileId,
    });

    await this.userRepository.update(id, sanitizedProfile);
    return this.findOneById(id);
  }

  @Transactional()
  async changeCurrentPassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<UserEntity | null> {
    const user = await this.findOneById(id);

    if (!user.password) {
      throw new UnauthorizedException(
        'settings.profile.errors.password_change_unavailable',
      );
    }

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'settings.profile.errors.invalid_current_password',
      );
    }

    const hashedPassword = await hashPassword(newPassword);
    return this.userRepository.update(id, {
      password: hashedPassword,
      mustChangePassword: false,
    });
  }

  async softDelete(id: string): Promise<UserEntity | null> {
    return await this.userRepository.softDelete(id);
  }

  //Extended Methods ===========================================================================

  @Transactional()
  async saveWithProfile(createUserDto: CreateUserDto): Promise<UserEntity> {
    const {
      profile,
      cabinetIds,
      username,
      roleType,
      permissionIds,
      ...userData
    } = createUserDto;
    const resolvedUsername = await this.resolveUsername(
      username,
      createUserDto.email,
    );
    const createdProfile = await this.upsertProfile(profile);
    const nextRoleType = this.normalizeRoleType(
      roleType,
      await this.inferRoleTypeFromRoleId(createUserDto.roleId),
    );
    const nextCabinetIds = this.normalizeCabinetIdsForRoleType(
      nextRoleType,
      cabinetIds,
    );
    const normalizedPermissionIds = await this.resolvePermissionPayload(
      nextRoleType,
      permissionIds,
    );

    const createdUser = await this.save({
      ...userData,
      username: resolvedUsername,
      profileId: createdProfile?.id,
      profile: createdProfile,
    });

    await this.syncUserCabinetRbac(
      createdUser.id,
      nextCabinetIds,
      nextRoleType,
      normalizedPermissionIds,
    );

    return this.findOneById(createdUser.id);
  }

  @Transactional()
  async saveWithProfileForActor(
    actorUserId: string,
    createUserDto: CreateUserDto,
  ): Promise<UserEntity> {
    const actor = await this.getActorOrFail(actorUserId);
    this.assertActorAdmin(actor);

    const requestedRoleType = await this.resolveAssignableRoleType(
      actor,
      createUserDto.roleType,
      createUserDto.roleId,
    );
    const role = await this.resolveHistoricalRoleForRoleType(
      requestedRoleType,
      createUserDto.roleId,
    );
    const cabinetIds = this.resolveAssignableCabinetIds(
      actor,
      requestedRoleType,
      createUserDto.cabinetIds,
    );

    return this.saveWithProfile({
      ...createUserDto,
      roleId: role.id,
      roleType: requestedRoleType,
      cabinetIds,
      isActive: createUserDto.isActive ?? true,
      isApproved: createUserDto.isApproved ?? true,
    });
  }

  async findOneByUsernameOrEmail(
    usernameOrEmail: string,
  ): Promise<UserEntity | null> {
    const user = await this.userRepository.findOne({
      where: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
      relations: [
        'role',
        'role.permissions',
        'role.permissions.permission',
        'profile',
        'profile.picture',
        'cabinetMemberships',
        'cabinetMemberships.cabinet',
        'cabinetMemberships.permissions',
        'cabinetMemberships.permissions.permission',
      ],
    });
    return user ? this.withComputedRbac(user) : null;
  }

  async findOneByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: [
        'role',
        'role.permissions',
        'role.permissions.permission',
        'profile',
        'profile.picture',
        'cabinetMemberships',
        'cabinetMemberships.cabinet',
        'cabinetMemberships.permissions',
        'cabinetMemberships.permissions.permission',
      ],
    });
    return user ? this.withComputedRbac(user) : null;
  }

  async addCabinetMembership(userId: string, cabinetId: number): Promise<void> {
    const userCabinetRepository = this.getUserCabinetRepository();
    const existing = await userCabinetRepository.findOne({
      where: { userId, cabinetId },
    });
    if (existing) return;

    await userCabinetRepository.save({
      userId,
      cabinetId,
      roleType: CabinetUserRoleType.ADMIN,
      isActive: true,
      isPrincipalAdmin: false,
    });
    await this.recomputePrincipalAdminForCabinet(cabinetId);
  }

  async findOneByUsername(username: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async activate(id: string): Promise<UserEntity | null> {
    await this.findOneById(id);
    return this.userRepository.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<UserEntity | null> {
    await this.findOneById(id);
    return this.userRepository.update(id, { isActive: false });
  }

  async activateForActor(
    actorUserId: string,
    id: string,
  ): Promise<UserEntity | null> {
    const actor = await this.getActorOrFail(actorUserId);
    this.assertActorAdmin(actor);
    const targetUser = await this.findOneById(id);
    this.assertUsersShareCabinet(actor, targetUser);
    return this.userRepository.update(id, { isActive: true });
  }

  async deactivateForActor(
    actorUserId: string,
    id: string,
  ): Promise<UserEntity | null> {
    const actor = await this.getActorOrFail(actorUserId);
    this.assertActorAdmin(actor);
    const targetUser = await this.findOneById(id);
    this.assertUsersShareCabinet(actor, targetUser);
    await this.assertCanDeactivateOrDeleteUser(actor, targetUser);
    return this.userRepository.update(id, { isActive: false });
  }

  async softDeleteForActor(
    actorUserId: string,
    id: string,
  ): Promise<UserEntity | null> {
    const actor = await this.getActorOrFail(actorUserId);
    this.assertActorAdmin(actor);
    const targetUser = await this.findOneById(id);
    this.assertUsersShareCabinet(actor, targetUser);
    await this.assertCanDeactivateOrDeleteUser(actor, targetUser);
    await this.userRepository.softDelete(id);
    return targetUser;
  }

  async approve(id: string): Promise<UserEntity | null> {
    await this.findOneById(id);
    return this.userRepository.update(id, { isApproved: true });
  }

  async disapprove(id: string): Promise<UserEntity | null> {
    await this.findOneById(id);
    return this.userRepository.update(id, { isApproved: false });
  }

  async changePassword(
    id: string,
    password: string,
  ): Promise<UserEntity | null> {
    const hashedPassword = await hashPassword(password);
    return this.userRepository.update(id, { password: hashedPassword });
  }

  private async getActorOrFail(actorUserId: string): Promise<UserEntity> {
    return this.findOneById(actorUserId);
  }

  private getUserCabinetIds(user?: UserEntity | null): number[] {
    const membershipCabinetIds = (user?.cabinetMemberships || [])
      .filter((membership) => membership.isActive !== false)
      .map((membership) => Number(membership.cabinetId));

    return membershipCabinetIds.filter(
      (cabinetId) => Number.isInteger(cabinetId) && cabinetId > 0,
    );
  }

  private usersShareCabinet(
    actor: UserEntity,
    targetUser: UserEntity,
  ): boolean {
    const actorCabinetIds = new Set(this.getUserCabinetIds(actor));
    return this.getUserCabinetIds(targetUser).some((cabinetId) =>
      actorCabinetIds.has(cabinetId),
    );
  }

  private assertUsersShareCabinet(actor: UserEntity, targetUser: UserEntity) {
    if (!this.usersShareCabinet(actor, targetUser)) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de consulter cet utilisateur.",
      );
    }
  }

  private assertActorAdmin(actor: UserEntity) {
    if (!this.isAdminInAnyCabinet(actor) && !isAdminRole(actor.role)) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de gérer les utilisateurs.",
      );
    }
  }

  private getCurrentRoleType(
    user: UserEntity,
    actor?: UserEntity,
  ): CabinetUserRoleType {
    const actorCabinetIds = actor
      ? new Set(this.getUserCabinetIds(actor))
      : null;
    const membership =
      (user.cabinetMemberships || []).find(
        (cabinetMembership) =>
          cabinetMembership.isActive !== false &&
          (!actorCabinetIds ||
            actorCabinetIds.has(cabinetMembership.cabinetId)),
      ) || resolveCabinetMembership(user);

    if (membership?.roleType) return membership.roleType;
    if (isAdminRole(user.role)) return CabinetUserRoleType.ADMIN;
    return CabinetUserRoleType.COLLABORATOR;
  }

  private isAdminInAnyCabinet(user: UserEntity): boolean {
    return (user.cabinetMemberships || []).some(
      (membership) =>
        membership.isActive !== false &&
        membership.roleType === CabinetUserRoleType.ADMIN,
    );
  }

  private async resolveAssignableRoleType(
    actor: UserEntity,
    requestedRoleType?: CabinetUserRoleType | string,
    requestedRoleId?: string,
    existingUser?: UserEntity,
  ): Promise<CabinetUserRoleType> {
    const fallbackRoleType = requestedRoleId
      ? await this.inferRoleTypeFromRoleId(requestedRoleId)
      : existingUser
        ? this.getCurrentRoleType(existingUser, actor)
        : CabinetUserRoleType.COLLABORATOR;
    const roleType = this.normalizeRoleType(
      requestedRoleType,
      fallbackRoleType,
    );

    if (roleType === CabinetUserRoleType.ADMIN && !isAdminRole(actor.role)) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation d'attribuer le rôle administrateur.",
      );
    }

    return roleType;
  }

  private async resolveHistoricalRoleForRoleType(
    roleType: CabinetUserRoleType,
    requestedRoleId?: string,
  ): Promise<RoleEntity> {
    if (
      roleType === CabinetUserRoleType.ADMIN ||
      roleType === CabinetUserRoleType.COLLABORATOR
    ) {
      const systemRoleLabel =
        roleType === CabinetUserRoleType.ADMIN ? 'admin' : 'standard-user';
      const role = await this.roleRepository.findOne({
        where: { label: systemRoleLabel },
        relations: ['permissions', 'permissions.permission'],
      });
      if (!role) {
        throw new BadRequestException(
          `Le rôle système ${systemRoleLabel} est introuvable.`,
        );
      }
      return role;
    }

    if (requestedRoleId) {
      const role = await this.roleRepository.findOne({
        where: { id: requestedRoleId },
        relations: ['permissions', 'permissions.permission'],
      });
      if (!role) {
        throw new BadRequestException('Le rôle sélectionné est introuvable.');
      }
      if (!isSystemRoleLabel(role.label)) {
        return role;
      }
    }

    const role = await this.roleRepository.findOne({
      where: { label: 'standard-user' },
      relations: ['permissions', 'permissions.permission'],
    });
    if (!role) {
      throw new BadRequestException(
        'Le rôle système standard-user est introuvable.',
      );
    }
    return role;
  }

  private async resolvePermissionPayload(
    roleType: CabinetUserRoleType,
    permissionIds?: string[],
    existingUser?: UserEntity,
    cabinetIds?: number[],
  ): Promise<string[]> {
    if (roleType !== CabinetUserRoleType.CUSTOM) return [];

    if (permissionIds === undefined && existingUser) {
      const membership = cabinetIds?.length
        ? resolveCabinetMembership(existingUser, cabinetIds[0])
        : resolveCabinetMembership(existingUser);
      return normalizePermissionSelection(
        (membership?.permissions || [])
          .map((permission) => permission.permissionId)
          .filter(Boolean),
      );
    }

    const officialPermissionIds =
      await this.permissionService.assertPermissionsExist(permissionIds || []);
    return normalizePermissionSelection(officialPermissionIds);
  }

  private async resolveAssignableRole(
    actor: UserEntity,
    roleId?: string,
  ): Promise<RoleEntity> {
    if (!roleId) {
      throw new BadRequestException('Un rôle valide est requis.');
    }

    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions', 'permissions.permission'],
    });
    if (!role) {
      throw new BadRequestException('Le rôle sélectionné est introuvable.');
    }

    if (isAdminRole(role) && !isAdminRole(actor.role)) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation d'attribuer le rôle administrateur.",
      );
    }

    if (role.cabinetId) {
      const actorCabinetIds = this.getUserCabinetIds(actor);
      if (!actorCabinetIds.includes(Number(role.cabinetId))) {
        throw new ForbiddenException(
          "Vous n'avez pas l'autorisation d'utiliser ce rôle.",
        );
      }
    }

    return role;
  }

  private resolveAssignableCabinetIds(
    actor: UserEntity,
    roleType: CabinetUserRoleType,
    cabinetIds?: number[],
    existingUser?: UserEntity,
  ): number[] {
    const actorCabinetIds = this.getUserCabinetIds(actor);
    const existingCabinetIds = this.getUserCabinetIds(existingUser);
    const requestedCabinetIds = this.normalizeCabinetIds(
      cabinetIds !== undefined
        ? cabinetIds
        : existingCabinetIds.length > 0
          ? existingCabinetIds
          : [actorCabinetIds[0]],
    );

    if (requestedCabinetIds.length === 0) {
      throw new BadRequestException('Un cabinet valide est requis.');
    }

    const forbiddenCabinetIds = requestedCabinetIds.filter(
      (cabinetId) => !actorCabinetIds.includes(cabinetId),
    );
    if (forbiddenCabinetIds.length > 0) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de gérer ce cabinet.",
      );
    }

    return roleType === CabinetUserRoleType.ADMIN
      ? requestedCabinetIds
      : requestedCabinetIds.slice(0, 1);
  }

  private async syncUserCabinetRbac(
    userId: string,
    cabinetIds: number[],
    roleType: CabinetUserRoleType,
    permissionIds: string[] = [],
  ): Promise<void> {
    const normalizedCabinetIds = this.normalizeCabinetIdsForRoleType(
      roleType,
      cabinetIds,
    );
    const userCabinetRepository = this.getUserCabinetRepository();
    const userCabinetPermissionRepository =
      this.getUserCabinetPermissionRepository();
    const existingMemberships = await userCabinetRepository.find({
      where: { userId },
    });
    const requestedCabinetIds = new Set(normalizedCabinetIds);

    await Promise.all(
      existingMemberships
        .filter((membership) => !requestedCabinetIds.has(membership.cabinetId))
        .map((membership) =>
          userCabinetRepository.delete({
            userId,
            cabinetId: membership.cabinetId,
          }),
        ),
    );

    for (const cabinetId of normalizedCabinetIds) {
      await userCabinetRepository.save({
        userId,
        cabinetId,
        roleType,
        isActive: true,
        isPrincipalAdmin: false,
      });

      await userCabinetPermissionRepository.delete({ userId, cabinetId });

      if (roleType === CabinetUserRoleType.CUSTOM && permissionIds.length > 0) {
        await userCabinetPermissionRepository.save(
          permissionIds.map((permissionId) => ({
            userId,
            cabinetId,
            permissionId,
          })),
        );
      }

      await this.recomputePrincipalAdminForCabinet(cabinetId);
    }

    await Promise.all(
      existingMemberships
        .filter((membership) => !requestedCabinetIds.has(membership.cabinetId))
        .map((membership) =>
          this.recomputePrincipalAdminForCabinet(membership.cabinetId),
        ),
    );
  }

  private async withComputedRbac(
    user: UserEntity,
    actor?: UserEntity,
    requestedCabinetId?: number | null,
  ): Promise<UserEntity> {
    const actorCabinetIds = actor
      ? new Set(this.getUserCabinetIds(actor))
      : null;
    const memberships = user.cabinetMemberships || [];
    const requestedMembership = requestedCabinetId
      ? memberships.find(
          (membership) =>
            membership.isActive !== false &&
            Number(membership.cabinetId) === Number(requestedCabinetId) &&
            (!actorCabinetIds ||
              actorCabinetIds.has(Number(membership.cabinetId))),
        )
      : undefined;
    const currentMembership =
      requestedMembership ||
      memberships.find(
        (membership) =>
          membership.isActive !== false &&
          (!actorCabinetIds ||
            actorCabinetIds.has(Number(membership.cabinetId))),
      ) ||
      resolveCabinetMembership(user);
    const currentCabinetId =
      currentMembership?.cabinetId || memberships[0]?.cabinetId || null;
    const currentCabinet =
      currentMembership?.cabinet ||
      memberships.find((m) => m.cabinetId === currentCabinetId)?.cabinet ||
      memberships[0]?.cabinet ||
      null;

    return Object.assign(user, {
      roleType:
        currentMembership?.roleType ?? this.getCurrentRoleType(user, actor),
      currentCabinetId,
      currentCabinet,
      permissions: getStoredPermissionIds(user, currentCabinetId),
      effectivePermissions: getEffectivePermissionIds(user, currentCabinetId),
      isCabinetPrincipalAdmin: Boolean(currentMembership?.isPrincipalAdmin),
    });
  }

  private async isPrincipalAdminForCabinet(
    user: UserEntity,
    cabinetId: number,
  ): Promise<boolean> {
    const membership = resolveCabinetMembership(user, cabinetId);
    return Boolean(
      membership?.roleType === CabinetUserRoleType.ADMIN &&
        membership.isPrincipalAdmin,
    );
  }

  private async findPrincipalAdminForCabinet(
    cabinetId: number,
  ): Promise<UserEntity | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoin('user.cabinetMemberships', 'membership')
      .where('membership.cabinetId = :cabinetId', { cabinetId })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .andWhere('membership.isActive = :membershipActive', {
        membershipActive: true,
      })
      .andWhere('membership.roleType = :roleType', {
        roleType: CabinetUserRoleType.ADMIN,
      })
      .orderBy('user.createdAt', 'ASC')
      .addOrderBy('user.id', 'ASC')
      .getOne();
  }

  private async assertPrincipalAdminMutationIsSafe(
    targetUser: UserEntity,
    nextRoleType: CabinetUserRoleType,
    nextCabinetIds: number[],
    updateUserDto: UpdateUserDto,
  ) {
    for (const cabinetId of this.getUserCabinetIds(targetUser)) {
      const isPrincipalAdmin = await this.isPrincipalAdminForCabinet(
        targetUser,
        cabinetId,
      );
      if (!isPrincipalAdmin) continue;

      if (nextRoleType !== CabinetUserRoleType.ADMIN) {
        throw new ForbiddenException(
          "L'administrateur principal ne peut pas être rétrogradé.",
        );
      }

      if (!nextCabinetIds.includes(cabinetId)) {
        throw new ForbiddenException(
          "L'administrateur principal ne peut pas être détaché de son cabinet.",
        );
      }

      if (
        updateUserDto.isActive === false ||
        updateUserDto.isApproved === false
      ) {
        throw new ForbiddenException(
          "L'administrateur principal ne peut pas être désactivé.",
        );
      }
    }
  }

  private async assertCanDeactivateOrDeleteUser(
    actor: UserEntity,
    targetUser: UserEntity,
  ) {
    if (actor.id === targetUser.id) {
      throw new ForbiddenException(
        'Vous ne pouvez pas supprimer ou désactiver votre propre compte.',
      );
    }

    for (const cabinetId of this.getUserCabinetIds(targetUser)) {
      if (await this.isPrincipalAdminForCabinet(targetUser, cabinetId)) {
        throw new ForbiddenException(
          "L'administrateur principal ne peut pas être supprimé ou désactivé.",
        );
      }
    }

    if (this.isAdminInAnyCabinet(targetUser)) {
      const canRemove = await this.canRemoveAdminFromEveryCabinet(targetUser);
      if (!canRemove) {
        throw new ForbiddenException(
          'Impossible de supprimer ou désactiver cet administrateur, car le cabinet doit conserver au moins un administrateur actif.',
        );
      }
    }
  }

  private async canRemoveAdminFromEveryCabinet(
    user: UserEntity,
  ): Promise<boolean> {
    for (const cabinetId of this.getUserCabinetIds(user)) {
      const activeAdminCount =
        await this.countActiveAdminsForCabinet(cabinetId);
      if (activeAdminCount <= 1) {
        return false;
      }
    }

    return true;
  }

  private async countActiveAdminsForCabinet(
    cabinetId: number,
  ): Promise<number> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.cabinetMemberships', 'membership')
      .where('membership.cabinetId = :cabinetId', { cabinetId })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .andWhere('membership.isActive = :membershipActive', {
        membershipActive: true,
      })
      .andWhere('membership.roleType = :roleType', {
        roleType: CabinetUserRoleType.ADMIN,
      })
      .getCount();
  }

  private async recomputePrincipalAdminForCabinet(cabinetId: number) {
    const userCabinetRepository = this.getUserCabinetRepository();

    await userCabinetRepository.update(
      { cabinetId, roleType: CabinetUserRoleType.ADMIN },
      { isPrincipalAdmin: false },
    );

    const principalAdmin = await this.findPrincipalAdminForCabinet(cabinetId);
    if (!principalAdmin?.id) return;

    await userCabinetRepository.update(
      {
        userId: principalAdmin.id,
        cabinetId,
      },
      { isPrincipalAdmin: true },
    );
  }
}
