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
import { UserService } from '../services/user.service';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { ResponseUserDto } from '../dtos/user/response-user.dto';
import { CreateUserDto } from '../dtos/user/create-user.dto';
import { UpdateUserDto } from '../dtos/user/update-user.dto';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { toDto, toDtoArray } from 'src/shared/database/utils/dtos';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { AdvancedRequest } from 'src/types';
import { UpdateCurrentProfileDto } from '../dtos/user/update-current-profile.dto';
import { ChangeCurrentPasswordDto } from '../dtos/user/change-current-password.dto';
import { RequireAdminRole } from 'src/shared/auth/decorators/require-permissions.decorator';
import { AuthEmailService } from 'src/shared/auth/services/auth-email.service';
import { randomBytes } from 'crypto';

@ApiTags('user')
@ApiBearerAuth('access_token')
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(LogInterceptor)
@Controller({ version: '1', path: '/user' })
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authEmailService: AuthEmailService,
  ) {}

  private generateTemporaryPassword(): string {
    return randomBytes(12).toString('base64url').slice(0, 16);
  }

  private resolveCabinetId(req: AdvancedRequest): number | undefined {
    const rawCabinetId =
      req.headers?.['x-cabinet-id'] ||
      req.headers?.['X-Cabinet-Id'] ||
      req.headers?.['x-cabinetid'];
    const cabinetId = Number(
      Array.isArray(rawCabinetId) ? rawCabinetId[0] : rawCabinetId,
    );
    return Number.isInteger(cabinetId) && cabinetId > 0 ? cabinetId : undefined;
  }

  @Get()
  @RequireAdminRole(
    "Vous n'avez pas l'autorisation de consulter les utilisateurs.",
  )
  async findOne(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseUserDto | null> {
    const user = await this.userService.findOneByCondition(query);
    return user
      ? toDto(
          ResponseUserDto,
          await this.userService.findOneByIdForActor(req.user.sub, user.id),
        )
      : null;
  }

  @Get('/list')
  @RequireAdminRole(
    "Vous n'avez pas l'autorisation de consulter les utilisateurs.",
  )
  @ApiPaginatedResponse(ResponseUserDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<PageDto<ResponseUserDto>> {
    const paginated = await this.userService.findAllPaginatedForActor(
      req.user.sub,
      query,
    );
    return { ...paginated, data: toDtoArray(ResponseUserDto, paginated.data) };
  }

  @Get('/all')
  @RequireAdminRole(
    "Vous n'avez pas l'autorisation de consulter les utilisateurs.",
  )
  async findAll(
    @Query() options: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseUserDto[]> {
    const users = await this.userService.findAllForActor(req.user.sub, options);
    return toDtoArray(ResponseUserDto, users);
  }

  @Get('/email/:email')
  @RequireAdminRole(
    "Vous n'avez pas l'autorisation de consulter les utilisateurs.",
  )
  async findOneByEmail(
    @Param('email') email: string,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseUserDto | null> {
    return toDto(
      ResponseUserDto,
      await this.userService.findOneByEmailForActor(req.user.sub, email),
    );
  }

  @Get('/current')
  async findCurrentUser(
    @Request() req: AdvancedRequest,
  ): Promise<ResponseUserDto | null> {
    return toDto(
      ResponseUserDto,
      await this.userService.findOneById(
        req.user.sub,
        this.resolveCabinetId(req),
      ),
    );
  }

  @Put('/current/profile')
  @LogEvent(EVENT_TYPE.USER_UPDATED)
  async updateCurrentProfile(
    @Body() updateCurrentProfileDto: UpdateCurrentProfileDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseUserDto | null> {
    const user = await this.userService.updateCurrentProfile(
      req.user.sub,
      updateCurrentProfileDto,
    );
    req.logInfo = { id: user?.id, firstName: user?.firstName };
    return toDto(ResponseUserDto, user);
  }

  @Put('/current/password')
  @LogEvent(EVENT_TYPE.USER_UPDATED)
  async changeCurrentPassword(
    @Body() changeCurrentPasswordDto: ChangeCurrentPasswordDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseUserDto | null> {
    const user = await this.userService.changeCurrentPassword(
      req.user.sub,
      changeCurrentPasswordDto.currentPassword,
      changeCurrentPasswordDto.newPassword,
    );
    req.logInfo = { id: user?.id, firstName: user?.firstName };
    return toDto(ResponseUserDto, user);
  }

  @Get(':id')
  @RequireAdminRole(
    "Vous n'avez pas l'autorisation de consulter cet utilisateur.",
  )
  async findOneById(
    @Param('id') id: string,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseUserDto | null> {
    return toDto(
      ResponseUserDto,
      await this.userService.findOneByIdForActor(req.user.sub, id),
    );
  }

  @Post()
  @RequireAdminRole("Vous n'avez pas l'autorisation de créer un utilisateur.")
  @LogEvent(EVENT_TYPE.USER_CREATED)
  async create(
    @Body() createUserDto: CreateUserDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseUserDto> {
    const initialPassword =
      createUserDto.password?.trim() || this.generateTemporaryPassword();
    const createPayload = {
      ...createUserDto,
      password: initialPassword,
      emailVerified: new Date(),
      mustChangePassword: true,
    };

    const userEntity = await this.userService.saveWithProfileForActor(
      req.user.sub,
      createPayload,
    );

    void this.authEmailService
      .sendTemporaryPasswordEmail(userEntity, initialPassword)
      .catch((error) => {
        console.error('Failed to send temporary password email:', error);
      });

    const user = toDto(ResponseUserDto, userEntity);
    req.logInfo = { id: user.id, firstName: user.firstName };
    return user;
  }

  @Put(':id')
  @RequireAdminRole(
    "Vous n'avez pas l'autorisation de modifier cet utilisateur.",
  )
  @LogEvent(EVENT_TYPE.USER_UPDATED)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseUserDto | null> {
    const user = await this.userService.updateForActor(
      req.user.sub,
      id,
      updateUserDto,
    );
    req.logInfo = { id: user?.id, firstName: user?.firstName };
    return toDto(ResponseUserDto, user);
  }

  @Put('/activate/:id')
  @RequireAdminRole("Vous n'avez pas l'autorisation d'activer cet utilisateur.")
  @LogEvent(EVENT_TYPE.USER_ACTIVATED)
  async activate(
    @Param('id') id: string,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseUserDto | null> {
    const user = await this.userService.activateForActor(req.user.sub, id);
    req.logInfo = { id: user?.id, firstName: user?.firstName };
    return toDto(ResponseUserDto, user);
  }

  @Put('/deactivate/:id')
  @RequireAdminRole(
    "Vous n'avez pas l'autorisation de désactiver cet utilisateur.",
  )
  @LogEvent(EVENT_TYPE.USER_DEACTIVATED)
  async deactivate(
    @Param('id') id: string,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseUserDto | null> {
    req.logInfo = { id };
    return toDto(
      ResponseUserDto,
      await this.userService.deactivateForActor(req.user.sub, id),
    );
  }

  @Delete(':id')
  @RequireAdminRole(
    "Vous n'avez pas l'autorisation de supprimer cet utilisateur.",
  )
  @LogEvent(EVENT_TYPE.USER_DELETED)
  async delete(
    @Param('id') id: string,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseUserDto | null> {
    const user = await this.userService.softDeleteForActor(req.user.sub, id);
    req.logInfo = { id: user?.id, firstName: user?.firstName };
    return toDto(ResponseUserDto, user);
  }
}
