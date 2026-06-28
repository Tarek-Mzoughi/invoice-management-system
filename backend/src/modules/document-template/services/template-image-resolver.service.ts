import { Injectable, Logger } from '@nestjs/common';
import { ReadStream } from 'fs';
import { StorageEntity } from 'src/shared/storage/entities/storage.entity';
import { StorageService } from 'src/shared/storage/services/storage.service';
import {
  GenericDocumentTemplateData,
  TemplateRenderOptions,
} from '../interfaces/template-engine.interface';

type TemplateImageElement = {
  id?: string;
  type?: string;
  content?: unknown;
  binding?: { path?: string };
  visible?: boolean;
};

type ImageResolutionResult = {
  source: string;
  sourceType: string;
  mimeType?: string;
  byteLength?: number;
};

type StorageLikeValue = Partial<
  Pick<StorageEntity, 'id' | 'slug' | 'relativePath' | 'mimeType' | 'filename'>
>;

@Injectable()
export class TemplateImageResolverService {
  private readonly logger = new Logger(TemplateImageResolverService.name);

  constructor(private readonly storageService: StorageService) {}

  async resolveTemplateImages(
    schema: Record<string, unknown>,
    data: GenericDocumentTemplateData,
    options?: TemplateRenderOptions,
  ): Promise<{
    schema: Record<string, unknown>;
    data: GenericDocumentTemplateData;
  }> {
    if (!this.isZcBuilderSchema(schema)) {
      return { schema, data };
    }

    const resolvedSchema = this.clonePlain(schema);
    const resolvedData = this.clonePlain(data) as GenericDocumentTemplateData;
    const elements = Array.isArray(resolvedSchema.elements)
      ? (resolvedSchema.elements as TemplateImageElement[])
      : [];

    for (const element of elements) {
      if (element.visible === false || !this.isImageElementType(element.type)) {
        continue;
      }

      if (element.binding?.path) {
        const value = this.getPathValue(resolvedData, element.binding.path);
        const resolved = await this.resolveImageValue(value, {
          element,
          bindingPath: element.binding.path,
          options,
        });
        this.setPathValue(
          resolvedData,
          element.binding.path,
          resolved?.source || '',
        );
        continue;
      }

      if (element.content != null && element.content !== '') {
        const resolved = await this.resolveImageValue(element.content, {
          element,
          options,
        });
        element.content = resolved?.source || '';
      }
    }

    return { schema: resolvedSchema, data: resolvedData };
  }

  private async resolveImageValue(
    value: unknown,
    context: {
      element: TemplateImageElement;
      bindingPath?: string;
      options?: TemplateRenderOptions;
    },
  ): Promise<ImageResolutionResult | null> {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        this.debugSkipped(context, 'Image value is empty');
        return null;
      }
      if (this.isValidImageDataUrl(trimmed)) {
        this.debugResolved(context, {
          source: trimmed,
          sourceType: 'data-url',
          mimeType: this.getDataUrlMimeType(trimmed),
          byteLength: this.getDataUrlByteLength(trimmed),
        });
        return {
          source: trimmed,
          sourceType: 'data-url',
          mimeType: this.getDataUrlMimeType(trimmed),
          byteLength: this.getDataUrlByteLength(trimmed),
        };
      }
      if (this.isHttpUrl(trimmed)) {
        return this.resolveUrlToDataUrl(trimmed, context);
      }
      return this.resolveStorageReference(trimmed, context);
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return this.resolveStorageReference(value, context);
    }

    if (value && typeof value === 'object') {
      return this.resolveStorageReference(value as StorageLikeValue, context);
    }

    this.debugSkipped(context, 'Image value is missing or unsupported');
    return null;
  }

  private async resolveStorageReference(
    value: string | number | StorageLikeValue,
    context: {
      element: TemplateImageElement;
      bindingPath?: string;
      options?: TemplateRenderOptions;
    },
  ): Promise<ImageResolutionResult | null> {
    const storage = await this.findStorageEntity(value);
    if (!storage) {
      this.debugSkipped(
        context,
        'Storage image reference could not be resolved',
        {
          sourceType: this.describeStorageReference(value),
        },
      );
      return null;
    }

    if (!this.isSupportedPdfmeImageMimeType(storage.mimeType)) {
      this.debugSkipped(
        context,
        'Storage image MIME type is not supported by pdfme',
        {
          sourceType: 'storage',
          mimeType: storage.mimeType,
        },
      );
      return null;
    }

    try {
      const resource = await this.storageService.loadResource(storage.slug);
      const buffer = await this.streamToBuffer(resource);
      const source = this.bufferToDataUrl(buffer, storage.mimeType);
      const result = {
        source,
        sourceType: 'storage',
        mimeType: storage.mimeType,
        byteLength: buffer.length,
      };
      this.debugResolved(context, result);
      return result;
    } catch (error) {
      this.debugSkipped(context, 'Storage image could not be read', {
        sourceType: 'storage',
        mimeType: storage.mimeType,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private async resolveUrlToDataUrl(
    url: string,
    context: {
      element: TemplateImageElement;
      bindingPath?: string;
      options?: TemplateRenderOptions;
    },
  ): Promise<ImageResolutionResult | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        this.debugSkipped(
          context,
          `Image URL returned HTTP ${response.status}`,
          {
            sourceType: 'url',
          },
        );
        return null;
      }

      const mimeType =
        response.headers.get('content-type')?.split(';')[0] || '';
      if (!this.isSupportedPdfmeImageMimeType(mimeType)) {
        this.debugSkipped(
          context,
          'Image URL MIME type is not supported by pdfme',
          {
            sourceType: 'url',
            mimeType,
          },
        );
        return null;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const result = {
        source: this.bufferToDataUrl(buffer, mimeType),
        sourceType: 'url',
        mimeType,
        byteLength: buffer.length,
      };
      this.debugResolved(context, result);
      return result;
    } catch (error) {
      this.debugSkipped(context, 'Image URL could not be fetched', {
        sourceType: 'url',
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private async findStorageEntity(
    value: string | number | StorageLikeValue,
  ): Promise<StorageEntity | null> {
    if (typeof value === 'number') {
      return this.storageService.findOneById(value);
    }

    if (typeof value === 'string') {
      const numericId = Number(value);
      if (Number.isInteger(numericId) && numericId > 0) {
        const byId = await this.storageService.findOneById(numericId);
        if (byId) return byId;
      }

      const bySlug = await this.storageService.findBySlug(value);
      if (bySlug) return bySlug;

      return this.storageService.storageRepository.findOne({
        where: { relativePath: value },
      });
    }

    if (typeof value.id === 'number') {
      const byId = await this.storageService.findOneById(value.id);
      if (byId) return byId;
    }

    if (typeof value.slug === 'string' && value.slug.trim()) {
      const bySlug = await this.storageService.findBySlug(value.slug);
      if (bySlug) return bySlug;
    }

    if (typeof value.relativePath === 'string' && value.relativePath.trim()) {
      return this.storageService.storageRepository.findOne({
        where: { relativePath: value.relativePath },
      });
    }

    return null;
  }

  private streamToBuffer(stream: ReadStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  private bufferToDataUrl(buffer: Buffer, mimeType: string): string {
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }

  private isZcBuilderSchema(schema: Record<string, unknown>): boolean {
    return (
      Array.isArray(schema.elements) &&
      !(Array.isArray(schema.schemas) && schema.basePdf)
    );
  }

  private isImageElementType(type?: string): boolean {
    return ['image', 'logo', 'signature', 'stamp'].includes(type || '');
  }

  private isValidImageDataUrl(value: string): boolean {
    return /^data:image\/(png|jpe?g);base64,/i.test(value);
  }

  private isHttpUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
  }

  private isSupportedPdfmeImageMimeType(mimeType?: string): boolean {
    return ['image/png', 'image/jpeg', 'image/jpg'].includes(
      (mimeType || '').toLowerCase(),
    );
  }

  private getDataUrlMimeType(value: string): string | undefined {
    return value.match(/^data:([^;]+);base64,/i)?.[1];
  }

  private getDataUrlByteLength(value: string): number | undefined {
    const base64 = value.split(';base64,')[1];
    if (!base64) return undefined;
    return Buffer.from(base64, 'base64').length;
  }

  private getPathValue(source: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((current, key) => {
      if (!current || typeof current !== 'object') return undefined;
      return (current as Record<string, unknown>)[key];
    }, source);
  }

  private setPathValue(
    target: Record<string, unknown>,
    path: string,
    value: unknown,
  ): void {
    const keys = path.split('.');
    let current: Record<string, unknown> = target;
    keys.slice(0, -1).forEach((key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    });
    current[keys[keys.length - 1]] = value;
  }

  private clonePlain<T>(value: T): T {
    if (Array.isArray(value)) {
      return value.map((item) => this.clonePlain(item)) as T;
    }
    if (value && typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>).reduce(
        (result, [key, item]) => {
          result[key] = this.clonePlain(item);
          return result;
        },
        {} as Record<string, unknown>,
      ) as T;
    }
    return value;
  }

  private describeStorageReference(
    value: string | number | StorageLikeValue,
  ): string {
    if (typeof value === 'number') return 'storage-id';
    if (typeof value === 'string') return 'storage-string';
    if (typeof value.id === 'number') return 'storage-object-id';
    if (typeof value.slug === 'string') return 'storage-object-slug';
    if (typeof value.relativePath === 'string')
      return 'storage-object-relative-path';
    return 'storage-object';
  }

  private debugResolved(
    context: {
      element: TemplateImageElement;
      bindingPath?: string;
      options?: TemplateRenderOptions;
    },
    result: ImageResolutionResult,
  ): void {
    if (!this.isDebugEnabled()) return;
    this.logger.debug(
      JSON.stringify({
        source: 'TEMPLATE_IMAGE_RESOLUTION',
        status: 'resolved',
        templateId: context.options?.templateId,
        documentType: context.options?.documentType,
        elementId: context.element.id,
        elementType: context.element.type,
        bindingPath: context.bindingPath,
        sourceType: result.sourceType,
        mimeType: result.mimeType,
        byteLength: result.byteLength,
      }),
    );
  }

  private debugSkipped(
    context: {
      element: TemplateImageElement;
      bindingPath?: string;
      options?: TemplateRenderOptions;
    },
    reason: string,
    extra?: Record<string, unknown>,
  ): void {
    if (!this.isDebugEnabled()) return;
    this.logger.debug(
      JSON.stringify({
        source: 'TEMPLATE_IMAGE_RESOLUTION',
        status: 'skipped',
        templateId: context.options?.templateId,
        documentType: context.options?.documentType,
        elementId: context.element.id,
        elementType: context.element.type,
        bindingPath: context.bindingPath,
        reason,
        ...(extra || {}),
      }),
    );
  }

  private isDebugEnabled(): boolean {
    return process.env.DOCUMENT_TEMPLATE_RENDER_DEBUG === 'true';
  }
}
