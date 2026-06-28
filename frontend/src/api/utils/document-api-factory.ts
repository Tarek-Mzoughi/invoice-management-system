import axios from '../axios';
import { upload } from '../upload';
import { ACTIVITY_TYPE } from '@/types';

export interface FindPaginatedOptions {
  search?: string;
  relations?: string[];
  activityType?: ACTIVITY_TYPE;
  firmId?: number;
  interlocutorId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  minTotal?: number;
  maxTotal?: number;
}

export interface DocumentApiConfig {
  entityPath: string;
  filterAttributes: Record<string, string>;
  defaultListRelations: string[];
  defaultFindOneRelations: string[];
}

export interface SendDocumentEmailPayload {
  to: string;
  cc?: string;
  subject: string;
  message: string;
  template?: string;
}

export const downloadBlob = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
};

export const buildFilters = (
  filterAttributes: Record<string, string>,
  options: FindPaginatedOptions
) => {
  const {
    search = '',
    activityType,
    firmId,
    interlocutorId,
    status,
    startDate,
    endDate,
    minTotal,
    maxTotal
  } = options;

  const andConditions = [
    activityType ? `activityType||$eq||${activityType}` : '',
    firmId ? `firmId||$eq||${firmId}` : '',
    interlocutorId ? `interlocutorId||$eq||${interlocutorId}` : '',
    status ? `status||$eq||${status}` : '',
    startDate ? `date||$gte||${startDate}` : '',
    endDate ? `date||$lte||${endDate}` : '',
    minTotal !== undefined ? `total||$gte||${minTotal}` : '',
    maxTotal !== undefined ? `total||$lte||${maxTotal}` : ''
  ].filter(Boolean);

  const trimmedSearch = search.trim();
  if (!trimmedSearch) {
    return andConditions.join(';');
  }

  return Object.values(filterAttributes)
    .map((attribute) =>
      [`${attribute}||$cont||${trimmedSearch}`, ...andConditions].filter(Boolean).join(';')
    )
    .join('||$or||');
};

export const createDocumentApi = <TEntity extends { sequential?: string; uploads?: any[] }>(
  config: DocumentApiConfig
) => {
  const { entityPath, filterAttributes, defaultListRelations, defaultFindOneRelations } = config;

  const findPaginated = async (
    page: number = 1,
    size: number = 5,
    order: 'ASC' | 'DESC' = 'ASC',
    sortKey: string = 'id',
    searchOrOptions: string | FindPaginatedOptions = {},
    relations: string[] = defaultListRelations,
    firmId?: number,
    interlocutorId?: number
  ) => {
    const options =
      typeof searchOrOptions === 'string'
        ? { search: searchOrOptions, relations, firmId, interlocutorId }
        : { relations: defaultListRelations, ...searchOrOptions };

    const filter = buildFilters(filterAttributes, options);
    const params = new URLSearchParams({
      sort: `${sortKey},${order}`,
      limit: size.toString(),
      page: page.toString(),
      join: (options.relations || relations).join(',')
    });

    if (filter) {
      params.set('filter', filter);
    }

    const response = await axios.get(`public/${entityPath}/list?${params.toString()}`);
    return response.data;
  };

  const findOne = async (
    id: number,
    relations: string[] = defaultFindOneRelations
  ): Promise<any> => {
    const response = await axios.get(`public/${entityPath}/${id}?join=${relations.join(',')}`);
    return response.data;
  };

  const uploadFiles = async (files: File[]): Promise<number[]> => {
    return files && files?.length > 0 ? await upload.uploadFiles(files) : [];
  };

  const getUploads = async (entity: TEntity): Promise<any[]> => {
    if (!entity?.uploads) return [];
    const uploads = await Promise.all(
      entity.uploads.map(async (u: any) => {
        if (u?.upload?.slug) {
          const blob = await upload.fetchBlobBySlug(u.upload.slug);
          const filename = u.upload.filename || '';
          if (blob)
            return { upload: u, file: new File([blob], filename, { type: u.upload.mimetype }) };
        }
        return { upload: u, file: undefined };
      })
    );
    return uploads
      .filter((u: any) => !!u.file)
      .sort(
        (a: any, b: any) =>
          new Date(a.upload.createdAt ?? 0).getTime() - new Date(b.upload.createdAt ?? 0).getTime()
      );
  };

  const fetchPdfBlob = async (id: number, template: string): Promise<Blob> => {
    const response = await axios.get<Blob>(
      `public/${entityPath}/${id}/download?template=${template}`,
      { responseType: 'blob' }
    );
    return new Blob([response.data], { type: 'application/pdf' });
  };

  const preview = async (id: number, template: string): Promise<Blob> => {
    return fetchPdfBlob(id, template);
  };

  const download = async (id: number, template: string): Promise<Blob> => {
    const entity = await findOne(id, []);
    const blob = await fetchPdfBlob(id, template);
    downloadBlob(blob, `${entity.sequential || entityPath + '-' + id}.pdf`);
    return blob;
  };

  const sendEmail = async (
    id: number,
    payload: SendDocumentEmailPayload
  ): Promise<{ success: boolean }> => {
    const response = await axios.post<{ success: boolean }>(`public/${entityPath}/${id}/send-email`, {
      ...payload,
      template: payload.template || 'template1'
    });
    return response.data;
  };

  const duplicate = async (dto: any) => {
    const response = await axios.post(`public/${entityPath}/duplicate`, dto);
    return response.data;
  };

  const remove = async (id: number) => {
    const response = await axios.delete(`public/${entityPath}/${id}`);
    return response.data;
  };

  return {
    findPaginated,
    findOne,
    uploadFiles,
    getUploads,
    fetchPdfBlob,
    downloadBlob,
    preview,
    download,
    sendEmail,
    duplicate,
    remove
  };
};
