import { DatabaseEntity } from './response/DatabaseEntity';

export interface Upload extends DatabaseEntity {
  id?: number;
  slug?: string;
  filename?: string;
  relativePath?: string;
  mimetype?: string;
  size?: number;
}

export interface UploadFileDto {
  file: File;
}
