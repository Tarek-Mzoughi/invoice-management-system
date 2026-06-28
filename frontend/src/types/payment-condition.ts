import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';

export interface PaymentCondition extends DatabaseEntity {
  id?: number;
  label?: string;
  description?: string;
}
export interface CreatePaymentConditionDto
  extends Pick<PaymentCondition, 'label' | 'description'> {}
export interface UpdatePaymentConditionDto
  extends Pick<PaymentCondition, 'label' | 'description' | 'id'> {}
export interface PagedPaymentCondition extends PagedResponse<PaymentCondition> {}
