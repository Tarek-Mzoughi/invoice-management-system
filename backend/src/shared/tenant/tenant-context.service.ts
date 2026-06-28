import { ForbiddenException, Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { UserService } from 'src/modules/user-management/services/user.service';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';

const OR_DELIMITER = '||$or||';
const CONDITION_DELIMITER = ';';
const LOOKUP_DELIMITER = '||';
const CABINET_FIELD = 'cabinetId';

@Injectable()
export class TenantContextService {
  constructor(
    private readonly userService: UserService,
    private readonly cls: ClsService,
  ) {}

  async getCurrentCabinetIdOrFail(
    userId?: string,
    requestedCabinetId?: number,
  ): Promise<number> {
    if (!userId) {
      throw new ForbiddenException('Authenticated user is required');
    }

    const effectiveCabinetId =
      requestedCabinetId ?? this.cls.get('requestedCabinetId') ?? undefined;

    const user = await this.userService.findOneById(userId);
    if (effectiveCabinetId) {
      return this.assertUserCanAccessCabinet(userId, effectiveCabinetId);
    }

    const activeMembership = user.cabinetMemberships?.find(
      (membership) => membership.isActive !== false,
    );
    const cabinetId = activeMembership?.cabinetId;

    if (!cabinetId) {
      throw new ForbiddenException('No cabinet is linked to this user');
    }

    return cabinetId;
  }

  async assertUserCanAccessCabinet(
    userId: string | undefined,
    cabinetId: number,
  ): Promise<number> {
    if (!userId) {
      throw new ForbiddenException('Authenticated user is required');
    }

    const normalizedCabinetId = this.normalizeCabinetId(cabinetId);
    const user = await this.userService.findOneById(userId);
    const canAccessCabinet = user.cabinetMemberships?.some(
      (membership) =>
        membership.isActive !== false &&
        Number(membership.cabinetId) === normalizedCabinetId,
    );

    if (!canAccessCabinet) {
      throw new ForbiddenException('Cabinet access denied');
    }

    return normalizedCabinetId;
  }

  scopeQueryToCabinet(
    query: IQueryObject = {},
    cabinetId: number,
  ): IQueryObject {
    return this.scopeQueryToCabinetField(query, cabinetId, CABINET_FIELD);
  }

  scopeQueryToCabinetField(
    query: IQueryObject = {},
    cabinetId: number,
    field: string = CABINET_FIELD,
  ): IQueryObject {
    const normalizedCabinetId = this.normalizeCabinetId(cabinetId);
    const scopedQuery: IQueryObject = { ...query };
    const cabinetFilter = `${field}||$eq||${normalizedCabinetId}`;

    if (!query.filter?.trim()) {
      scopedQuery.filter = cabinetFilter;
      return scopedQuery;
    }

    scopedQuery.filter = query.filter
      .split(OR_DELIMITER)
      .map((branch) => this.scopeFilterBranch(branch, cabinetFilter, field))
      .join(OR_DELIMITER);

    return scopedQuery;
  }

  private normalizeCabinetId(cabinetId: number): number {
    const normalizedCabinetId = Number(cabinetId);
    if (!Number.isInteger(normalizedCabinetId) || normalizedCabinetId <= 0) {
      throw new ForbiddenException('A valid cabinet context is required');
    }
    return normalizedCabinetId;
  }

  private scopeFilterBranch(
    branch: string,
    cabinetFilter: string,
    scopedField: string,
  ): string {
    const conditions = branch
      .split(CONDITION_DELIMITER)
      .map((condition) => condition.trim())
      .filter((condition) => condition.length > 0)
      .filter((condition) => {
        const [field] = condition.split(LOOKUP_DELIMITER);
        return field !== CABINET_FIELD && field !== scopedField;
      });

    return [...conditions, cabinetFilter].join(CONDITION_DELIMITER);
  }
}
