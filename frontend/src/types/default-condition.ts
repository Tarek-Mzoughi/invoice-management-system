import { ACTIVITY_TYPE } from './enums/activity-type';
import { DOCUMENT_TYPE } from './enums/document-type';
import { DatabaseEntity } from './response/DatabaseEntity';

export interface DefaultCondition extends DatabaseEntity {
  id?: number;
  document_type?: DOCUMENT_TYPE;
  activity_type?: ACTIVITY_TYPE;
  value?: string;
}

export interface UpdateDefaultConditionDto {
  id?: number;
  value?: string;
}
