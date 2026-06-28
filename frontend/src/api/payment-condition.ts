import axios from './axios';
import type { ApiRequestOptions } from './request-options';
import { isAlphabeticOrSpace } from '@/utils/validations/string.validations';
import {
  CreatePaymentConditionDto,
  PagedPaymentCondition,
  PaymentCondition,
  ToastValidation,
  UpdatePaymentConditionDto
} from '@/types';
import { PAYMENT_CONDITION_FILTER_ATTRIBUTES } from '@/constants/payment-condition.filter-attributes';

const findPaginated = async (
  page: number = 1,
  size: number = 5,
  order: 'ASC' | 'DESC' = 'ASC',
  sortKey: string = 'id',
  search: string = ''
): Promise<PagedPaymentCondition> => {
  const generalFilter = search
    ? Object.values(PAYMENT_CONDITION_FILTER_ATTRIBUTES)
        .map((key) => `${key}||$cont||${search}`)
        .join('||$or||')
    : '';
  const response = await axios.get<PagedPaymentCondition>(
    `public/payment-condition/list?sort=${sortKey},${order}&filter=${generalFilter}&limit=${size}&page=${page}`
  );
  return response.data;
};

const find = async (options: ApiRequestOptions = {}): Promise<PaymentCondition[]> => {
  const response = await axios.get<PaymentCondition[]>('public/payment-condition/all', {
    silentForbiddenToast: options.silentForbiddenToast
  });
  return response.data;
};

const create = async (paymentMethod: CreatePaymentConditionDto): Promise<PaymentCondition> => {
  const response = await axios.post<PaymentCondition>('public/payment-condition', paymentMethod);
  return response.data;
};

const update = async (paymentMethod: UpdatePaymentConditionDto): Promise<PaymentCondition> => {
  const response = await axios.put<PaymentCondition>(
    `public/payment-condition/${paymentMethod.id}`,
    paymentMethod
  );
  return response.data;
};

const validate = (
  paymentCondition: CreatePaymentConditionDto | UpdatePaymentConditionDto
): ToastValidation => {
  if (
    paymentCondition &&
    paymentCondition?.label &&
    paymentCondition?.label?.length > 3 &&
    isAlphabeticOrSpace(paymentCondition?.label)
  ) {
    return { message: '' };
  }
  return { message: 'Veuillez entrer un titre valide' };
};

const remove = async (id: number) => {
  const { data, status } = await axios.delete<PaymentCondition>(`public/payment-condition/${id}`);
  return { data, status };
};

export const paymentCondition = { find, findPaginated, create, update, validate, remove };
