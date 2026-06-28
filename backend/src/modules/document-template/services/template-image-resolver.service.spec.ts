import { Readable } from 'stream';
import { StorageEntity } from 'src/shared/storage/entities/storage.entity';
import { StorageService } from 'src/shared/storage/services/storage.service';
import { TemplateImageResolverService } from './template-image-resolver.service';

describe('TemplateImageResolverService', () => {
  let service: TemplateImageResolverService;
  let storageService: jest.Mocked<
    Pick<StorageService, 'findOneById' | 'findBySlug' | 'loadResource'> & {
      storageRepository: {
        findOne: jest.Mock;
      };
    }
  >;

  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );
  const dataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`;
  const storage = {
    id: 12,
    slug: 'company-logo',
    filename: 'logo.png',
    relativePath: 'cabinet/logo.png',
    mimeType: 'image/png',
    size: pngBuffer.length,
    isTemporary: false,
  } as StorageEntity;

  const zcSchema = {
    elements: [
      {
        id: 'company_logo',
        type: 'logo',
        name: 'Logo',
        binding: { path: 'company.logo' },
        visible: true,
      },
    ],
  };

  beforeEach(() => {
    storageService = {
      findOneById: jest.fn(),
      findBySlug: jest.fn(),
      loadResource: jest.fn(),
      storageRepository: {
        findOne: jest.fn(),
      },
    };
    service = new TemplateImageResolverService(
      storageService as unknown as StorageService,
    );
  });

  it('passes valid image data URLs through unchanged', async () => {
    const result = await service.resolveTemplateImages(zcSchema, {
      company: { logo: dataUrl },
    });

    expect(result.data.company?.logo).toBe(dataUrl);
    expect(storageService.findOneById).not.toHaveBeenCalled();
    expect(storageService.loadResource).not.toHaveBeenCalled();
  });

  it('resolves storage entity objects to base64 data URLs', async () => {
    storageService.findOneById.mockResolvedValue(storage);
    storageService.loadResource.mockResolvedValue(
      Readable.from(pngBuffer) as any,
    );

    const result = await service.resolveTemplateImages(zcSchema, {
      company: { logo: { id: storage.id, slug: storage.slug } },
    });

    expect(storageService.findOneById).toHaveBeenCalledWith(storage.id);
    expect(storageService.loadResource).toHaveBeenCalledWith(storage.slug);
    expect(result.data.company?.logo).toBe(dataUrl);
  });

  it('resolves storage slugs to base64 data URLs', async () => {
    storageService.findBySlug.mockResolvedValue(storage);
    storageService.loadResource.mockResolvedValue(
      Readable.from(pngBuffer) as any,
    );

    const result = await service.resolveTemplateImages(zcSchema, {
      company: { logo: storage.slug },
    });

    expect(storageService.findBySlug).toHaveBeenCalledWith(storage.slug);
    expect(storageService.loadResource).toHaveBeenCalledWith(storage.slug);
    expect(result.data.company?.logo).toBe(dataUrl);
  });

  it('resolves legacy relative paths without changing StorageService globally', async () => {
    storageService.findBySlug.mockResolvedValue(null);
    storageService.storageRepository.findOne.mockResolvedValue(storage);
    storageService.loadResource.mockResolvedValue(
      Readable.from(pngBuffer) as any,
    );

    const result = await service.resolveTemplateImages(zcSchema, {
      company: { logo: storage.relativePath },
    });

    expect(storageService.storageRepository.findOne).toHaveBeenCalledWith({
      where: { relativePath: storage.relativePath },
    });
    expect(result.data.company?.logo).toBe(dataUrl);
  });

  it('cleans invalid image bindings instead of passing raw values to pdfme', async () => {
    storageService.findBySlug.mockResolvedValue(null);
    storageService.storageRepository.findOne.mockResolvedValue(null);

    const result = await service.resolveTemplateImages(zcSchema, {
      company: { logo: 'Logo' },
    });

    expect(result.data.company?.logo).toBe('');
  });

  it('leaves native pdfme templates unchanged', async () => {
    const nativeSchema = {
      basePdf: { width: 210, height: 297 },
      schemas: [[]],
    };
    const data = { company: { logo: storage.slug } };
    const result = await service.resolveTemplateImages(nativeSchema, data);

    expect(result.schema).toBe(nativeSchema);
    expect(result.data).toBe(data);
    expect(storageService.findBySlug).not.toHaveBeenCalled();
  });
});
