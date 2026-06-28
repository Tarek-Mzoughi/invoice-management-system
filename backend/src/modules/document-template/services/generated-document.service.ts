import { BadRequestException, Injectable } from '@nestjs/common';
import { StorageService } from 'src/shared/storage/services/storage.service';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../enums/document-template-document-type.enum';
import { GENERATED_DOCUMENT_STATUS } from '../enums/generated-document-status.enum';
import { GeneratedDocumentEntity } from '../entities/generated-document.entity';
import { GeneratedDocumentRepository } from '../repositories/generated-document.repository';

type SaveGeneratedDocumentInput = {
  pdfBuffer: Buffer;
  templateId?: number;
  templateVersionId?: number;
  documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE;
  sourceDocumentId?: number;
  cabinetId?: number;
  filename: string;
  generatedById?: string;
};

@Injectable()
export class GeneratedDocumentService {
  constructor(
    private readonly generatedDocumentRepository: GeneratedDocumentRepository,
    private readonly storageService: StorageService,
  ) {}

  async savePdf(
    input: SaveGeneratedDocumentInput,
  ): Promise<GeneratedDocumentEntity> {
    const cabinetId = Number(input.cabinetId);
    if (!Number.isInteger(cabinetId) || cabinetId <= 0) {
      throw new BadRequestException('A valid cabinet context is required');
    }

    const file = {
      buffer: input.pdfBuffer,
      originalname: input.filename,
      mimetype: 'application/pdf',
      size: input.pdfBuffer.length,
    } as Express.Multer.File;
    const storage = await this.storageService.store(file, false);

    return this.generatedDocumentRepository.save({
      templateId: input.templateId,
      templateVersionId: input.templateVersionId,
      documentType: input.documentType,
      sourceDocumentId: input.sourceDocumentId,
      cabinetId,
      storageId: storage.id,
      filename: input.filename,
      mimeType: 'application/pdf',
      status: GENERATED_DOCUMENT_STATUS.GENERATED,
      generatedById: input.generatedById,
    });
  }
}
