import {
  Controller,
  Param,
  Get,
  Body,
  Post,
  Put,
  Patch,
  Delete,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { CabinetService } from '../services/cabinet.service';
import { ApiTags, ApiParam } from '@nestjs/swagger';
import { CabinetEntity } from '../entities/cabinet.entity';
import { CreateCabinetDto } from '../dtos/cabinet.create.dto';
import { ResponseCabinetDto } from '../dtos/cabinet.response.dto';
import { UpdateCabinetDto } from '../dtos/cabinet.update.dto';
import { RequirePermissions } from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';
import { AdvancedRequest } from 'src/types';
import { UserService } from 'src/modules/user-management/services/user.service';
import { ResponseUserDto } from 'src/modules/user-management/dtos/user/response-user.dto';
import { toDto } from 'src/shared/database/utils/dtos';

@ApiTags('cabinet')
@Controller({
  version: '1',
  path: '/cabinet',
})
export class CabinetController {
  constructor(
    private readonly cabinetService: CabinetService,
    private readonly userService: UserService,
  ) {}

  @Get('/list')
  async findAll(
    @Request() req: AdvancedRequest,
  ): Promise<ResponseCabinetDto[]> {
    const user = await this.userService.findOneById(req.user.sub);
    const membershipCabinets = (user.cabinetMemberships || [])
      .map((m) => m.cabinet)
      .filter(Boolean);
    return membershipCabinets.length > 0
      ? membershipCabinets
      : (user as any).cabinets || [];
  }

  @Get('/:id')
  @ApiParam({
    name: 'id',
    type: 'number',
    required: true,
  })
  async findOneById(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseCabinetDto> {
    await this.assertUserCanAccessCabinet(req.user.sub, Number(id));
    const cabinet = await this.cabinetService.findOneById(id);
    return {
      ...cabinet,
    };
  }

  @Post('')
  @RequirePermissions(
    PERMISSIONS.ENTERPRISE.CREATE,
    "Vous n'avez pas l'autorisation de créer cette entreprise.",
  )
  async save(
    @Body() createCabinetDto: CreateCabinetDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseCabinetDto> {
    const cabinet = await this.cabinetService.save(createCabinetDto);
    await this.userService.addCabinetMembership(req.user.sub, cabinet.id);
    return this.cabinetService.findOneById(cabinet.id);
  }

  @Post('/init-new')
  @RequirePermissions(
    PERMISSIONS.ENTERPRISE.CREATE,
    "Vous n'avez pas l'autorisation de créer une entreprise.",
  )
  async initNewCabinet(
    @Request() req: AdvancedRequest,
  ): Promise<ResponseUserDto> {
    return toDto(
      ResponseUserDto,
      await this.userService.findOneById(req.user.sub),
    );
  }

  @Patch('/switch/:id')
  @ApiParam({
    name: 'id',
    type: 'number',
    required: true,
  })
  async switchActiveCabinet(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseUserDto> {
    await this.assertUserCanAccessCabinet(req.user.sub, Number(id));
    return toDto(
      ResponseUserDto,
      await this.userService.findOneById(req.user.sub, Number(id)),
    );
  }

  @Put('/:id')
  @RequirePermissions(
    PERMISSIONS.ENTERPRISE.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette entreprise.",
  )
  @ApiParam({
    name: 'id',
    type: 'number',
    required: true,
  })
  async update(
    @Param('id') id: number,
    @Body() updateCabinetDto: UpdateCabinetDto,
    @Request() req: AdvancedRequest,
  ): Promise<CabinetEntity> {
    await this.assertUserCanAccessCabinet(req.user.sub, Number(id));
    return this.cabinetService.update(id, updateCabinetDto);
  }

  @Delete('/:id')
  @RequirePermissions(
    PERMISSIONS.ENTERPRISE.DELETE,
    "Vous n'avez pas l'autorisation de supprimer cette entreprise.",
  )
  @ApiParam({
    name: 'id',
    type: 'number',
    required: true,
  })
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<CabinetEntity> {
    await this.assertUserCanAccessCabinet(req.user.sub, Number(id));
    return this.cabinetService.softDelete(id);
  }

  private async assertUserCanAccessCabinet(userId: string, cabinetId: number) {
    const user = await this.userService.findOneById(userId);
    const membershipCabinetIds = (user.cabinetMemberships || []).map(
      (membership) => Number(membership.cabinetId),
    );
    const legacyCabinetIds = ((user as any).cabinets || []).map((cabinet) =>
      Number(cabinet.id),
    );
    const canAccessCabinet = [
      ...membershipCabinetIds,
      ...legacyCabinetIds,
    ].some((userCabinetId) => userCabinetId === Number(cabinetId));
    if (!canAccessCabinet) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de consulter cette entreprise.",
      );
    }
  }
}
