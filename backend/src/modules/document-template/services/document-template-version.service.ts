import { Injectable, NotFoundException } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { DocumentTemplateEntity } from '../entities/document-template.entity';
import { DocumentTemplateVersionEntity } from '../entities/document-template-version.entity';
import { DocumentTemplateRepository } from '../repositories/document-template.repository';
import { DocumentTemplateVersionRepository } from '../repositories/document-template-version.repository';

@Injectable()
export class DocumentTemplateVersionService {
  constructor(
    private readonly versionRepository: DocumentTemplateVersionRepository,
    private readonly templateRepository: DocumentTemplateRepository,
  ) {}

  async findByTemplateId(
    templateId: number,
  ): Promise<DocumentTemplateVersionEntity[]> {
    return this.versionRepository.findAll({
      where: { templateId },
      order: { versionNumber: 'DESC' },
    });
  }

  @Transactional()
  async createFromTemplate(
    template: DocumentTemplateEntity,
    userId?: string,
    changeDescription?: string,
  ): Promise<DocumentTemplateVersionEntity> {
    return this.versionRepository.save({
      templateId: template.id,
      versionNumber: template.versionNumber || 1,
      name: template.name,
      status: template.status,
      templateSchema: template.templateSchema,
      pageSettings: template.pageSettings,
      variablesConfig: template.variablesConfig,
      changeDescription,
      createdById: userId,
    });
  }

  @Transactional()
  async restore(
    templateId: number,
    versionId: number,
    userId?: string,
    cabinetId?: number,
  ): Promise<DocumentTemplateEntity> {
    const template = cabinetId
      ? await this.templateRepository.findOne({
          where: { id: templateId, cabinetId },
        })
      : await this.templateRepository.findOneById(templateId);
    if (!template) throw new NotFoundException('Document template not found');

    const version = await this.versionRepository.findOne({
      where: { id: versionId, templateId },
    });
    if (!version) throw new NotFoundException('Template version not found');

    const restored = await this.templateRepository.save({
      ...template,
      name: version.name,
      status: version.status,
      templateSchema: version.templateSchema,
      pageSettings: version.pageSettings,
      variablesConfig: version.variablesConfig,
      versionNumber: (template.versionNumber || 1) + 1,
      updatedById: userId,
    });

    await this.createFromTemplate(
      restored,
      userId,
      `Restored version ${version.id}`,
    );
    return restored;
  }
}
