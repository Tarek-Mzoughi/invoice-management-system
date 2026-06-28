import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleService } from '../services/role.service';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { CreateRoleDto } from '../dtos/role/create-role.dto';
import { UpdateRoleDto } from '../dtos/role/update-role.dto';
import { ResponseRoleDto } from '../dtos/role/response-role.dto';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { toDto, toDtoArray } from 'src/shared/database/utils/dtos';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { AdvancedRequest } from 'src/types';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { RequireAdminRole } from 'src/shared/auth/decorators/require-permissions.decorator';

@ApiTags('role')
@ApiBearerAuth('access_token')
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(LogInterceptor)
@Controller({ version: '1', path: '/role' })
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get('/list')
  @RequireAdminRole("Vous n'avez pas l'autorisation de consulter les rôles.")
  @ApiPaginatedResponse(ResponseRoleDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<PageDto<ResponseRoleDto>> {
    const paginated = await this.roleService.findAllPaginatedForActor(
      req.user.sub,
      query,
    );
    return { ...paginated, data: toDtoArray(ResponseRoleDto, paginated.data) };
  }

  @Get('/all')
  @RequireAdminRole("Vous n'avez pas l'autorisation de consulter les rôles.")
  async findAll(
    @Query() options: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseRoleDto[]> {
    return toDtoArray(
      ResponseRoleDto,
      await this.roleService.findAllForActor(req.user.sub, options),
    );
  }

  @Get(':id')
  @RequireAdminRole("Vous n'avez pas l'autorisation de consulter ce rôle.")
  async findOneById(
    @Param('id') id: string,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseRoleDto | null> {
    return toDto(
      ResponseRoleDto,
      await this.roleService.findOneByIdForActor(req.user.sub, id),
    );
  }

  @Post()
  @RequireAdminRole("Vous n'avez pas l'autorisation de créer un rôle.")
  @LogEvent(EVENT_TYPE.ROLE_CREATED)
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseRoleDto> {
    const role = await this.roleService.saveWithPermissionsForActor(
      req.user.sub,
      createRoleDto,
    );
    req.logInfo = { id: role.id, label: role.label };
    return toDto(ResponseRoleDto, role);
  }

  @Post('duplicate/:id')
  @RequireAdminRole("Vous n'avez pas l'autorisation de dupliquer ce rôle.")
  @LogEvent(EVENT_TYPE.ROLE_DUPLICATED)
  async duplicate(
    @Param('id') id: string,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseRoleDto | null> {
    const role = await this.roleService.duplicateWithPermissionsForActor(
      req.user.sub,
      id,
    );
    req.logInfo = { id: role?.id, fid: id, label: role?.label };
    return toDto(ResponseRoleDto, role);
  }

  @Put(':id')
  @RequireAdminRole("Vous n'avez pas l'autorisation de modifier ce rôle.")
  @LogEvent(EVENT_TYPE.ROLE_UPDATED)
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseRoleDto | null> {
    const role = await this.roleService.updateWithPermissionsForActor(
      req.user.sub,
      id,
      updateRoleDto,
    );
    req.logInfo = { id, label: role?.label };
    return toDto(ResponseRoleDto, role);
  }

  @Delete(':id')
  @RequireAdminRole("Vous n'avez pas l'autorisation de supprimer ce rôle.")
  @LogEvent(EVENT_TYPE.ROLE_DELETED)
  async delete(
    @Param('id') id: string,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseRoleDto | null> {
    const role = await this.roleService.softDeleteForActor(req.user.sub, id);
    req.logInfo = { id, label: role?.label };
    return toDto(ResponseRoleDto, role);
  }
}
