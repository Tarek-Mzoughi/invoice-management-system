import axios from './axios';
import type { AxiosError } from 'axios';
import {
  CreateDocumentTemplateDto,
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE,
  DOCUMENT_TEMPLATE_STATUS,
  DocumentTemplate,
  DocumentTemplateAsset,
  DocumentTemplateDocumentRenderDto,
  DocumentTemplatePreviewDto,
  DocumentTemplateVersion,
  PagedDocumentTemplate,
  UpdateDocumentTemplateDto
} from '@/types';
import { downloadBlob } from './utils/document-api-factory';

export interface FindPaginatedDocumentTemplateOptions {
  search?: string;
  documentType?: DOCUMENT_TEMPLATE_DOCUMENT_TYPE | 'all';
  status?: DOCUMENT_TEMPLATE_STATUS | 'all';
}

const buildFilters = (options: FindPaginatedDocumentTemplateOptions = {}) => {
  const andConditions = [
    options.documentType && options.documentType !== 'all'
      ? `documentType||$eq||${options.documentType}`
      : '',
    options.status && options.status !== 'all' ? `status||$eq||${options.status}` : ''
  ].filter(Boolean);

  const search = options.search?.trim();
  if (!search) return andConditions.join(';');

  return ['name', 'slug']
    .map((field) => [`${field}||$cont||${search}`, ...andConditions].filter(Boolean).join(';'))
    .join('||$or||');
};

const findPaginated = async (
  page: number = 1,
  size: number = 10,
  order: 'ASC' | 'DESC' = 'DESC',
  sortKey: string = 'id',
  options: FindPaginatedDocumentTemplateOptions = {}
): Promise<PagedDocumentTemplate> => {
  const params = new URLSearchParams({
    sort: `${sortKey},${order}`,
    limit: size.toString(),
    page: page.toString()
  });
  const filter = buildFilters(options);
  if (filter) params.set('filter', filter);

  const response = await axios.get<PagedDocumentTemplate>(
    `public/document-templates?${params.toString()}`
  );
  return response.data;
};

const findAll = async (
  options: FindPaginatedDocumentTemplateOptions = {}
): Promise<DocumentTemplate[]> => {
  const params = new URLSearchParams();
  const filter = buildFilters(options);
  if (filter) params.set('filter', filter);
  const response = await axios.get<DocumentTemplate[]>(
    `public/document-templates/all?${params.toString()}`
  );
  return response.data;
};

const findOne = async (id: number): Promise<DocumentTemplate> => {
  const response = await axios.get<DocumentTemplate>(`public/document-templates/${id}`);
  return response.data;
};

const create = async (payload: CreateDocumentTemplateDto): Promise<DocumentTemplate> => {
  const response = await axios.post<DocumentTemplate>('public/document-templates', payload);
  return response.data;
};

const update = async (
  id: number,
  payload: UpdateDocumentTemplateDto
): Promise<DocumentTemplate> => {
  const response = await axios.patch<DocumentTemplate>(`public/document-templates/${id}`, payload);
  return response.data;
};

const remove = async (id: number): Promise<DocumentTemplate> => {
  const response = await axios.delete<DocumentTemplate>(`public/document-templates/${id}`);
  return response.data;
};

const duplicate = async (id: number): Promise<DocumentTemplate> => {
  const response = await axios.post<DocumentTemplate>(`public/document-templates/${id}/duplicate`);
  return response.data;
};

const setDefault = async (id: number): Promise<DocumentTemplate> => {
  const response = await axios.post<DocumentTemplate>(`public/document-templates/${id}/set-default`);
  return response.data;
};

const findDefaultByDocumentType = async (
  documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE
): Promise<DocumentTemplate | null> => {
  const response = await axios.get<DocumentTemplate | null>(
    `public/document-templates/document-type/${documentType}/default`
  );
  return response.data;
};

const getAvailableTemplates = async (
  documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE
): Promise<DocumentTemplate[]> => {
  const response = await axios.get<DocumentTemplate[]>(
    `public/document-templates/available/${documentType}`
  );
  return response.data;
};

const getDefaultTemplate = async (
  documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE
): Promise<DocumentTemplate | null> => {
  const response = await axios.get<DocumentTemplate | null>(
    `public/document-templates/default/${documentType}`
  );
  return response.data;
};

const findVersions = async (id: number): Promise<DocumentTemplateVersion[]> => {
  const response = await axios.get<DocumentTemplateVersion[]>(
    `public/document-templates/${id}/versions`
  );
  return response.data;
};

const createVersion = async (
  id: number,
  changeDescription?: string
): Promise<DocumentTemplateVersion> => {
  const response = await axios.post<DocumentTemplateVersion>(
    `public/document-templates/${id}/versions`,
    { changeDescription }
  );
  return response.data;
};

const restoreVersion = async (
  id: number,
  versionId: number
): Promise<DocumentTemplate> => {
  const response = await axios.post<DocumentTemplate>(
    `public/document-templates/${id}/restore-version/${versionId}`
  );
  return response.data;
};

const rethrowBlobError = async (error: unknown): Promise<never> => {
  const responseData = (error as AxiosError)?.response?.data;
  if (responseData instanceof Blob) {
    const text = await responseData.text();
    let parsed: { message?: unknown; error?: unknown } | null = null;
    try {
      parsed = JSON.parse(text) as { message?: unknown; error?: unknown };
    } catch {
      parsed = null;
    }

    if (parsed) {
      const message = Array.isArray(parsed.message)
        ? parsed.message.join(', ')
        : parsed.message || parsed.error;
      if (typeof message === 'string' && message.trim()) {
        throw new Error(message);
      }
    }
    if (text.trim()) throw new Error(text);
  }

  throw error;
};

const preview = async (
  id: number,
  payload: DocumentTemplatePreviewDto = {}
): Promise<Blob> => {
  try {
    const response = await axios.post<Blob>(`public/document-templates/${id}/preview`, payload, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    return rethrowBlobError(error);
  }
};

const generatePdf = async (
  id: number,
  payload: DocumentTemplatePreviewDto = {},
  filename = 'generated-document.pdf'
): Promise<Blob> => {
  try {
    const response = await axios.post<Blob>(
      `public/document-templates/${id}/generate-pdf`,
      payload,
      { responseType: 'blob' }
    );
    downloadBlob(response.data, filename);
    return response.data;
  } catch (error) {
    return rethrowBlobError(error);
  }
};

const previewDocumentWithTemplate = async (
  payload: DocumentTemplateDocumentRenderDto
): Promise<Blob> => {
  try {
    const response = await axios.post<Blob>('public/document-templates/preview-document', payload, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    return rethrowBlobError(error);
  }
};

const generateDocumentWithTemplate = async (
  payload: DocumentTemplateDocumentRenderDto,
  filename = 'generated-document.pdf'
): Promise<Blob> => {
  try {
    const response = await axios.post<Blob>(
      'public/document-templates/generate-document',
      {
        ...payload,
        storeGeneratedDocument: payload.storeGeneratedDocument ?? false
      },
      { responseType: 'blob' }
    );
    downloadBlob(response.data, filename);
    return response.data;
  } catch (error) {
    return rethrowBlobError(error);
  }
};

const uploadAsset = async (
  file: File,
  payload: {
    templateId?: number;
    assetType?: DocumentTemplateAsset['assetType'];
    name?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<DocumentTemplateAsset> => {
  const formData = new FormData();
  formData.append('file', file);
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  });

  const response = await axios.post<DocumentTemplateAsset>(
    'public/document-templates/assets/upload',
    formData
  );
  return response.data;
};

const deleteAsset = async (id: number): Promise<DocumentTemplateAsset> => {
  const response = await axios.delete<DocumentTemplateAsset>(
    `public/document-templates/assets/${id}`
  );
  return response.data;
};

export const documentTemplate = {
  findPaginated,
  findAll,
  findOne,
  create,
  update,
  remove,
  duplicate,
  setDefault,
  findDefaultByDocumentType,
  getAvailableTemplates,
  getDefaultTemplate,
  findVersions,
  createVersion,
  restoreVersion,
  preview,
  generatePdf,
  previewDocumentWithTemplate,
  generateDocumentWithTemplate,
  uploadAsset,
  deleteAsset
};
