import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StorageService } from 'src/shared/storage/services/storage.service';
import { UploadTemplateAssetDto } from '../dtos/template-asset.upload.dto';
import { DOCUMENT_TEMPLATE_ASSET_TYPE } from '../enums/document-template-asset-type.enum';
import { DocumentTemplateAssetEntity } from '../entities/document-template-asset.entity';
import { DocumentTemplateAssetRepository } from '../repositories/document-template-asset.repository';
import { DocumentTemplateRepository } from '../repositories/document-template.repository';

@Injectable()
export class TemplateAssetService {
  constructor(
    private readonly assetRepository: DocumentTemplateAssetRepository,
    private readonly templateRepository: DocumentTemplateRepository,
    private readonly storageService: StorageService,
  ) {}

  async upload(
    file: Express.Multer.File,
    dto: UploadTemplateAssetDto,
    cabinetId?: number,
  ): Promise<DocumentTemplateAssetEntity> {
    if (!file) throw new BadRequestException('Template asset file is required');

    if (dto.templateId) {
      const template = await this.templateRepository.findOne({
        where: cabinetId
          ? { id: dto.templateId, cabinetId }
          : { id: dto.templateId },
      });
      if (!template) throw new NotFoundException('Document template not found');
    }

    const storage = await this.storageService.store(file, false);
    return this.assetRepository.save({
      templateId: dto.templateId,
      storageId: storage.id,
      assetType: dto.assetType || DOCUMENT_TEMPLATE_ASSET_TYPE.IMAGE,
      name: dto.name || file.originalname,
      metadata: dto.metadata,
    });
  }

  async delete(
    id: number,
    cabinetId?: number,
  ): Promise<DocumentTemplateAssetEntity> {
    const asset = await this.assetRepository.findOne({
      where: { id },
      relations: { storage: true, template: true },
    });
    if (!asset) throw new NotFoundException('Template asset not found');
    if (
      cabinetId &&
      asset.templateId &&
      asset.template?.cabinetId !== cabinetId
    ) {
      throw new NotFoundException('Template asset not found');
    }

    if (asset.storageId) {
      await this.storageService.delete(asset.storageId);
    }
    return this.assetRepository.softDelete(id);
  }
}
