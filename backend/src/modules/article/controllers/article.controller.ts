import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiParam } from '@nestjs/swagger';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { ArticleService } from '../services/article.service';
import { ResponseArticleDto } from '../dtos/article.response.dto';
import { CreateArticleDto } from '../dtos/article.create.dto';
import { UpdateArticleDto } from '../dtos/article.update.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { AdvancedRequest } from 'src/types';
import { ArticleNotFoundException } from '../errors/article.notfound.error';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';
import { ARTICLE_DESTINATION } from '../enums/article-destination.enum';
import { ResponseArticleDocumentChoiceDto } from '../dtos/article-document-choice.response.dto';

@ApiTags('article')
@Controller({ version: '1', path: '/article' })
@RequirePermissions(
  PERMISSIONS.PRODUCTS.READ,
  "Vous n'avez pas l'autorisation de consulter les articles.",
)
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  private getAuthenticatedUserId(req: AdvancedRequest): string {
    if (!req.user?.sub) {
      throw new ForbiddenException('Authenticated user is required');
    }
    return req.user.sub;
  }

  @Get('/document-choices')
  @RequireAnyPermissions(
    [
      PERMISSIONS.PRODUCTS.READ,
      PERMISSIONS.SELLING_DOCUMENTS.CREATE,
      PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
      PERMISSIONS.BUYING_DOCUMENTS.CREATE,
      PERMISSIONS.BUYING_DOCUMENTS.UPDATE,
    ],
    "Vous n'avez pas l'autorisation de consulter les articles.",
  )
  async findDocumentChoices(
    @Query('activityType')
    activityType: ARTICLE_DESTINATION.SELLING | ARTICLE_DESTINATION.BUYING,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseArticleDocumentChoiceDto[]> {
    if (
      ![ARTICLE_DESTINATION.SELLING, ARTICLE_DESTINATION.BUYING].includes(
        activityType,
      )
    ) {
      throw new BadRequestException(
        'Invalid article document choice activity type.',
      );
    }

    const articles = await this.articleService.findAll(
      {
        filter: `destination||$in||${activityType},${ARTICLE_DESTINATION.BOTH}`,
      },
      this.getAuthenticatedUserId(req),
    );

    return articles.map((article) => ({
      id: article.id,
      title: article.title,
      label: article.title,
      reference: article.reference,
      description: article.description,
      destination: article.destination,
      articleType: article.articleType,
      salePrice: article.salePrice,
      purchasePrice: article.purchasePrice,
      unit: article.unit,
      taxIds: article.taxIds || [],
      additionalTaxIds: article.additionalTaxIds || [],
      discountEnabled: article.discountEnabled,
      discountValue: article.discountValue,
      discountType: article.discountType,
    }));
  }

  @Get('/all')
  async findAll(
    @Query() options: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseArticleDto[]> {
    return await this.articleService.findAll(
      options,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponseArticleDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<PageDto<ResponseArticleDto>> {
    return await this.articleService.findAllPaginated(
      query,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/:id')
  @ApiParam({ name: 'id', type: 'number', required: true })
  async findOneById(
    @Param('id') id: number,
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseArticleDto> {
    const article = await this.articleService.findOneByCondition(
      {
        ...query,
        filter: `id||$eq||${id}`,
      },
      this.getAuthenticatedUserId(req),
    );
    if (!article) {
      throw new ArticleNotFoundException();
    }
    return article;
  }

  @Post('')
  @RequirePermissions(
    PERMISSIONS.PRODUCTS.CREATE,
    "Vous n'avez pas l'autorisation de créer cet article.",
  )
  async save(
    @Body() createArticleDto: CreateArticleDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseArticleDto> {
    return await this.articleService.save(
      createArticleDto,
      this.getAuthenticatedUserId(req),
    );
  }

  @Put('/:id')
  @RequirePermissions(
    PERMISSIONS.PRODUCTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cet article.",
  )
  @ApiParam({ name: 'id', type: 'number', required: true })
  async update(
    @Param('id') id: number,
    @Body() updateArticleDto: UpdateArticleDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseArticleDto> {
    return await this.articleService.update(
      id,
      updateArticleDto,
      this.getAuthenticatedUserId(req),
    );
  }

  @Delete('/:id')
  @RequirePermissions(
    PERMISSIONS.PRODUCTS.DELETE,
    "Vous n'avez pas l'autorisation de supprimer cet article.",
  )
  @ApiParam({ name: 'id', type: 'number', required: true })
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseArticleDto> {
    return await this.articleService.softDelete(
      id,
      this.getAuthenticatedUserId(req),
    );
  }
}
