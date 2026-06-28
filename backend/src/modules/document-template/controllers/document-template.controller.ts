import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';
import { AdvancedRequest } from 'src/types';
import { CreateDocumentTemplateDto } from '../dtos/document-template.create.dto';
import { DocumentTemplateDocumentRenderDto } from '../dtos/document-template-document-render.dto';
import { DocumentTemplatePreviewDto } from '../dtos/document-template-preview.dto';
import { UpdateDocumentTemplateDto } from '../dtos/document-template.update.dto';
import { CreateDocumentTemplateVersionDto } from '../dtos/document-template-version.create.dto';
import { UploadTemplateAssetDto } from '../dtos/template-asset.upload.dto';
import { DocumentTemplateEntity } from '../entities/document-template.entity';
import { DocumentTemplateAssetEntity } from '../entities/document-template-asset.entity';
import { DocumentTemplateVersionEntity } from '../entities/document-template-version.entity';
import { DocumentTemplateRendererService } from '../services/document-template-renderer.service';
import { DocumentTemplateService } from '../services/document-template.service';
import { DocumentTemplateVersionService } from '../services/document-template-version.service';
import { TemplateAssetService } from '../services/template-asset.service';
import { RequirePermissions } from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';

@ApiTags('document-templates')
@Controller({ version: '1', path: '/document-templates' })
@RequirePermissions(
  PERMISSIONS.DOCUMENT_SETTINGS.READ,
  "Vous n'avez pas l'autorisation de consulter les paramètres documents.",
)
export class DocumentTemplateController {
  constructor(
    private readonly documentTemplateService: DocumentTemplateService,
    private readonly versionService: DocumentTemplateVersionService,
    private readonly rendererService: DocumentTemplateRendererService,
    private readonly assetService: TemplateAssetService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('')
  async findAllPaginated(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<PageDto<DocumentTemplateEntity>> {
    return this.documentTemplateService.findAllPaginated(
      query,
      this.getUserId(req),
    );
  }

  @Get('/all')
  async findAll(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<DocumentTemplateEntity[]> {
    return this.documentTemplateService.findAll(query, this.getUserId(req));
  }

  @Get('/document-type/:documentType/default')
  @ApiParam({ name: 'documentType', type: 'string', required: true })
  async findDefaultByDocumentType(
    @Param('documentType') documentType: string,
    @Request() req: AdvancedRequest,
  ): Promise<DocumentTemplateEntity | null> {
    return this.documentTemplateService.findDefaultByDocumentType(
      documentType,
      this.getUserId(req),
    );
  }

  @Get('/available/:documentType')
  @ApiParam({ name: 'documentType', type: 'string', required: true })
  async findAvailableByDocumentType(
    @Param('documentType') documentType: string,
    @Request() req: AdvancedRequest,
  ): Promise<DocumentTemplateEntity[]> {
    return this.documentTemplateService.findAvailableByDocumentType(
      documentType,
      this.getUserId(req),
    );
  }

  @Get('/default/:documentType')
  @ApiParam({ name: 'documentType', type: 'string', required: true })
  async findDefaultTemplate(
    @Param('documentType') documentType: string,
    @Request() req: AdvancedRequest,
  ): Promise<DocumentTemplateEntity | null> {
    return this.documentTemplateService.findDefaultByDocumentType(
      documentType,
      this.getUserId(req),
    );
  }

  @Post('/preview-document')
  async previewDocument(
    @Body() dto: DocumentTemplateDocumentRenderDto,
    @Request() req: AdvancedRequest,
  ): Promise<StreamableFile> {
    const pdfBuffer = await this.rendererService.previewDocument(
      dto,
      this.getUserId(req),
    );
    return this.toPdfStream(pdfBuffer, 'document-preview.pdf', 'inline');
  }

  @Post('/generate-document')
  async generateDocument(
    @Body() dto: DocumentTemplateDocumentRenderDto,
    @Request() req: AdvancedRequest,
  ): Promise<StreamableFile> {
    const pdfBuffer = await this.rendererService.generateDocument(
      dto,
      this.getUserId(req),
    );
    return this.toPdfStream(pdfBuffer, 'generated-document.pdf', 'attachment');
  }

  @Post('/assets/upload')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.CREATE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadTemplateAssetDto })
  async uploadAsset(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadTemplateAssetDto,
    @Request() req: AdvancedRequest,
  ): Promise<DocumentTemplateAssetEntity> {
    const cabinetId = await this.tenantContext.getCurrentCabinetIdOrFail(
      this.getUserId(req),
    );
    if (dto.templateId) {
      await this.documentTemplateService.findOneById(
        dto.templateId,
        this.getUserId(req),
      );
    }
    return this.assetService.upload(file, dto, cabinetId);
  }

  @Delete('/assets/:id')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.DELETE)
  @ApiParam({ name: 'id', type: 'number', required: true })
  async deleteAsset(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AdvancedRequest,
  ): Promise<DocumentTemplateAssetEntity> {
    const cabinetId = await this.tenantContext.getCurrentCabinetIdOrFail(
      this.getUserId(req),
    );
    return this.assetService.delete(id, cabinetId);
  }

  @Get('/:id')
  @ApiParam({ name: 'id', type: 'number', required: true })
  async findOneById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AdvancedRequest,
  ): Promise<DocumentTemplateEntity> {
    return this.documentTemplateService.findOneById(id, this.getUserId(req));
  }

  @Post('')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.CREATE)
  async save(
    @Body() dto: CreateDocumentTemplateDto,
    @Request() req: AdvancedRequest,
  ): Promise<DocumentTemplateEntity> {
    const template = await this.documentTemplateService.save(
      dto,
      this.getUserId(req),
    );
    req.logInfo = { id: template.id };
    return template;
  }

  @Patch('/:id')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.UPDATE)
  @ApiParam({ name: 'id', type: 'number', required: true })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDocumentTemplateDto,
    @Request() req: AdvancedRequest,
  ): Promise<DocumentTemplateEntity> {
    req.logInfo = { id };
    return this.documentTemplateService.update(id, dto, this.getUserId(req));
  }

  @Delete('/:id')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.DELETE)
  @ApiParam({ name: 'id', type: 'number', required: true })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AdvancedRequest,
  ): Promise<DocumentTemplateEntity> {
    req.logInfo = { id };
    return this.documentTemplateService.delete(id, this.getUserId(req));
  }

  @Post('/:id/duplicate')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.CREATE)
  @ApiParam({ name: 'id', type: 'number', required: true })
  async duplicate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AdvancedRequest,
  ): Promise<DocumentTemplateEntity> {
    const template = await this.documentTemplateService.duplicate(
      id,
      this.getUserId(req),
    );
    req.logInfo = { id, duplicateId: template.id };
    return template;
  }

  @Post('/:id/set-default')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.UPDATE)
  @ApiParam({ name: 'id', type: 'number', required: true })
  async setDefault(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AdvancedRequest,
  ): Promise<DocumentTemplateEntity> {
    req.logInfo = { id };
    return this.documentTemplateService.setDefault(id, this.getUserId(req));
  }

  @Get('/:id/versions')
  @ApiParam({ name: 'id', type: 'number', required: true })
  async findVersions(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AdvancedRequest,
  ): Promise<DocumentTemplateVersionEntity[]> {
    await this.documentTemplateService.findOneById(id, this.getUserId(req));
    return this.versionService.findByTemplateId(id);
  }

  @Post('/:id/versions')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.UPDATE)
  @ApiParam({ name: 'id', type: 'number', required: true })
  async createVersion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateDocumentTemplateVersionDto,
    @Request() req: AdvancedRequest,
  ): Promise<DocumentTemplateVersionEntity> {
    const template = await this.documentTemplateService.findOneById(
      id,
      this.getUserId(req),
    );
    return this.versionService.createFromTemplate(
      template,
      this.getUserId(req),
      dto.changeDescription,
    );
  }

  @Post('/:id/restore-version/:versionId')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.UPDATE)
  @ApiParam({ name: 'id', type: 'number', required: true })
  @ApiParam({ name: 'versionId', type: 'number', required: true })
  async restoreVersion(
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
    @Request() req: AdvancedRequest,
  ): Promise<DocumentTemplateEntity> {
    req.logInfo = { id, versionId };
    const template = await this.documentTemplateService.findOneById(
      id,
      this.getUserId(req),
    );
    return this.versionService.restore(
      id,
      versionId,
      this.getUserId(req),
      template.cabinetId,
    );
  }

  @Post('/:id/preview')
  @ApiParam({ name: 'id', type: 'number', required: true })
  async preview(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DocumentTemplatePreviewDto,
    @Request() req: AdvancedRequest,
  ): Promise<StreamableFile> {
    const pdfBuffer = await this.rendererService.preview(
      id,
      dto,
      this.getUserId(req),
    );
    return this.toPdfStream(pdfBuffer, 'template-preview.pdf', 'inline');
  }

  @Post('/:id/generate-pdf')
  @ApiParam({ name: 'id', type: 'number', required: true })
  async generatePdf(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DocumentTemplatePreviewDto,
    @Request() req: AdvancedRequest,
  ): Promise<StreamableFile> {
    const pdfBuffer = await this.rendererService.generate(
      id,
      dto,
      this.getUserId(req),
    );
    return this.toPdfStream(pdfBuffer, 'generated-document.pdf', 'attachment');
  }

  private toPdfStream(
    pdfBuffer: Buffer,
    filename: string,
    disposition: 'inline' | 'attachment',
  ): StreamableFile {
    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `${disposition}; filename="${filename}"`,
    });
  }

  private getUserId(req: AdvancedRequest): string {
    const userId = req.user?.sub;
    if (!userId) throw new ForbiddenException('Authenticated user is required');
    return userId;
  }
}
