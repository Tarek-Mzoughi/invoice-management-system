import { DefaultCondition, UpdateDefaultConditionDto } from '@/types';
import axios from './axios';
import { ACTIVITY_TYPE } from '@/types/enums/activity-type';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import type { ApiRequestOptions } from './request-options';

const find = async (
  activity_type?: ACTIVITY_TYPE,
  document_type?: DOCUMENT_TYPE,
  options: ApiRequestOptions = {}
): Promise<DefaultCondition[]> => {
  const filterString = [
    activity_type && `activity_type||$eq||${activity_type}`,
    document_type && `document_type||$eq||${document_type}`
  ]
    .filter(Boolean)
    .join(';');
  const response = await axios.get(
    `public/default-condition/all${filterString ? `?filter=${filterString}` : ''}`,
    { silentForbiddenToast: options.silentForbiddenToast }
  );
  return response.data;
};

const update = async (
  defaultCondition: UpdateDefaultConditionDto | UpdateDefaultConditionDto[]
): Promise<DefaultCondition | DefaultCondition[]> => {
  const response = await axios.put<DefaultCondition | DefaultCondition[]>(
    Array.isArray(defaultCondition)
      ? 'public/default-condition/batch-update/'
      : `public/default-condition/${defaultCondition.id}`,
    defaultCondition
  );
  return response.data;
};

export const defaultCondition = { find, update };
