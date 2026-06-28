import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdvancedRequest } from 'src/types';
import { DashboardService } from './dashboard.service';
import { DashboardExtendedService } from './dashboard-extended.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import {
  DashboardActivityDto,
  DashboardGlobalDto,
  DashboardOverviewDto,
  DashboardPaymentsDto,
  DashboardPurchasesDto,
  DashboardReferentialsDto,
  DashboardSalesDto,
  DashboardTreasuryDto,
  DashboardWithholdingDto,
} from './dto/dashboard-response.dto';
import { RequirePermissions } from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';

@ApiTags('dashboard')
@Controller({ version: '1', path: '/dashboard' })
@RequirePermissions(
  PERMISSIONS.DASHBOARD.READ,
  "Vous n'avez pas l'autorisation de consulter le tableau de bord.",
)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly dashboardExtendedService: DashboardExtendedService,
  ) {}

  /** Legacy overview — kept for backward compatibility */
  @Get('/overview')
  async getOverview(
    @Query() query: DashboardQueryDto,
    @Request() req: AdvancedRequest,
  ): Promise<DashboardOverviewDto> {
    if (!req.user?.sub) {
      throw new ForbiddenException('Authenticated user is required');
    }

    return this.dashboardService.getOverview(query, req.user.sub);
  }

  /** New: Vue globale — aggregated selling + buying + treasury */
  @Get('/global')
  async getGlobal(
    @Query() query: DashboardQueryDto,
    @Request() req: AdvancedRequest,
  ): Promise<DashboardGlobalDto> {
    if (!req.user?.sub) {
      throw new ForbiddenException('Authenticated user is required');
    }

    return this.dashboardService.getGlobal(query, req.user.sub);
  }

  /** New: Vente — dedicated selling tab */
  @Get('/sales')
  async getSales(
    @Query() query: DashboardQueryDto,
    @Request() req: AdvancedRequest,
  ): Promise<DashboardSalesDto> {
    if (!req.user?.sub) {
      throw new ForbiddenException('Authenticated user is required');
    }

    return this.dashboardService.getSales(query, req.user.sub);
  }

  @Get('/purchases')
  async getPurchases(
    @Query() query: DashboardQueryDto,
    @Request() req: AdvancedRequest,
  ): Promise<DashboardPurchasesDto> {
    if (!req.user?.sub) {
      throw new ForbiddenException('Authenticated user is required');
    }

    return this.dashboardExtendedService.getPurchases(query, req.user.sub);
  }

  /** New: Paiements — consolidated selling + buying payments */
  @Get('/payments')
  async getPayments(
    @Query() query: DashboardQueryDto,
    @Request() req: AdvancedRequest,
  ): Promise<DashboardPaymentsDto> {
    if (!req.user?.sub) {
      throw new ForbiddenException('Authenticated user is required');
    }

    return this.dashboardService.getPayments(query, req.user.sub);
  }

  @Get('/treasury')
  async getTreasury(
    @Query() query: DashboardQueryDto,
    @Request() req: AdvancedRequest,
  ): Promise<DashboardTreasuryDto> {
    if (!req.user?.sub) {
      throw new ForbiddenException('Authenticated user is required');
    }

    return this.dashboardExtendedService.getTreasury(query, req.user.sub);
  }

  @Get('/withholding')
  async getWithholding(
    @Query() query: DashboardQueryDto,
    @Request() req: AdvancedRequest,
  ): Promise<DashboardWithholdingDto> {
    if (!req.user?.sub) {
      throw new ForbiddenException('Authenticated user is required');
    }

    return this.dashboardExtendedService.getWithholding(query, req.user.sub);
  }

  /** New: Référentiels — entity counts + top lists + quotation stats */
  @Get('/referentials')
  async getReferentials(
    @Query() query: DashboardQueryDto,
    @Request() req: AdvancedRequest,
  ): Promise<DashboardReferentialsDto> {
    if (!req.user?.sub) {
      throw new ForbiddenException('Authenticated user is required');
    }

    return this.dashboardService.getReferentials(query, req.user.sub);
  }

  /** New: Activité & Alertes — recent activity + alerts */
  @Get('/activity')
  async getActivity(
    @Query() query: DashboardQueryDto,
    @Request() req: AdvancedRequest,
  ): Promise<DashboardActivityDto> {
    if (!req.user?.sub) {
      throw new ForbiddenException('Authenticated user is required');
    }

    return this.dashboardService.getActivity(query, req.user.sub);
  }
}
