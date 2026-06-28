import { Transactional } from '@nestjs-cls/transactional';
import { BadRequestException, Injectable } from '@nestjs/common';
import { DeepPartial, FindManyOptions, FindOneOptions } from 'typeorm';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { PermissionRepository } from '../repositories/permission.repository';
import { PermissionEntity } from '../entities/permission.entity';
import { CreatePermissionDto } from '../dtos/permission/create-permission.dto';
import { PermissionNotFoundException } from '../errors/permission/permission.notfound.error';
import { PermissionAlreadyExistsException } from '../errors/permission/permission.alreadyexists.error';
import {
  OFFICIAL_PERMISSION_IDS,
  PERMISSION_MATRIX,
} from '../rbac/permission.constants';

@Injectable()
export class PermissionService {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  private buildPermissionLabel(permissionId: string): string {
    return permissionId.replace(/[^a-z0-9]+/gi, '_').toUpperCase();
  }

  private buildPermissionDescription(permissionId: string): string {
    const [action, ...entityParts] = permissionId.split('-');
    const entityLabel = entityParts.join(' ');
    return `Permission to ${action} ${entityLabel}`.trim();
  }

  async findOneById(id: string): Promise<PermissionEntity> {
    const permission = await this.permissionRepository.findOneById(id);
    if (!permission) {
      throw new PermissionNotFoundException();
    }
    return permission;
  }

  async findOneByCondition(
    query: IQueryObject,
  ): Promise<PermissionEntity | null> {
    const queryBuilder = new QueryBuilder(
      this.permissionRepository.getMetadata(),
    );
    const queryOptions = queryBuilder.build(query);
    const permission = await this.permissionRepository.findOne(
      queryOptions as FindOneOptions<PermissionEntity>,
    );
    if (!permission) return null;
    return permission;
  }

  async findAll(query: IQueryObject = {}): Promise<PermissionEntity[]> {
    const queryBuilder = new QueryBuilder(
      this.permissionRepository.getMetadata(),
    );
    const queryOptions = queryBuilder.build(query);
    return await this.permissionRepository.findAll(
      queryOptions as FindManyOptions<PermissionEntity>,
    );
  }

  findPermissionMatrix() {
    return PERMISSION_MATRIX;
  }

  validateOfficialPermissionIds(permissionIds: string[]): string[] {
    const normalizedPermissionIds = Array.from(
      new Set(permissionIds.filter(Boolean)),
    );
    const unknownPermissionIds = normalizedPermissionIds.filter(
      (permissionId) => !OFFICIAL_PERMISSION_IDS.has(permissionId),
    );

    if (unknownPermissionIds.length > 0) {
      throw new BadRequestException(
        `Permissions invalides: ${unknownPermissionIds.join(', ')}`,
      );
    }

    return normalizedPermissionIds;
  }

  async assertPermissionsExist(permissionIds: string[]): Promise<string[]> {
    const normalizedPermissionIds =
      this.validateOfficialPermissionIds(permissionIds);
    if (normalizedPermissionIds.length === 0) return [];

    const existingPermissions = await this.permissionRepository.findAll({
      where: normalizedPermissionIds.map((id) => ({ id })),
    });
    const existingPermissionIds = new Set(
      existingPermissions.map((permission) => permission.id),
    );
    const missingPermissionIds = normalizedPermissionIds.filter(
      (permissionId) => !existingPermissionIds.has(permissionId),
    );

    if (missingPermissionIds.length > 0) {
      throw new BadRequestException(
        `Permissions absentes du catalogue: ${missingPermissionIds.join(', ')}`,
      );
    }

    return normalizedPermissionIds;
  }

  async findAllPaginated(
    query: IQueryObject,
  ): Promise<PageDto<PermissionEntity>> {
    const queryBuilder = new QueryBuilder(
      this.permissionRepository.getMetadata(),
    );
    const queryOptions = queryBuilder.build(query);
    const count = await this.permissionRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.permissionRepository.findAll(
      queryOptions as FindManyOptions<PermissionEntity>,
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
  async save(
    createPermissionDto: DeepPartial<PermissionEntity>,
  ): Promise<PermissionEntity> {
    const existingPermission = await this.permissionRepository.findOne({
      where: {
        label: createPermissionDto.label,
      },
    });
    if (existingPermission) throw new PermissionAlreadyExistsException();
    return this.permissionRepository.save(createPermissionDto);
  }

  async saveMany(createPermissionDto: CreatePermissionDto[]) {
    return this.permissionRepository.saveMany(createPermissionDto);
  }

  @Transactional()
  async ensurePermissionsExist(permissionIds: string[]): Promise<void> {
    await this.assertPermissionsExist(permissionIds);
  }

  async softDelete(id: string): Promise<PermissionEntity | null> {
    return this.permissionRepository.softDelete(id);
  }

  async delete(id: string): Promise<PermissionEntity | null> {
    const permission = await this.findOneById(id);
    return this.permissionRepository.remove(permission);
  }
}
