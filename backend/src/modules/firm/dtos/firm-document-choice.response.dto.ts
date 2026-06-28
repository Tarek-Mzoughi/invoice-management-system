import { ResponseCurrencyDto } from 'src/modules/currency/dtos/currency.response.dto';
import { ResponsePaymentConditionDto } from 'src/modules/payment-condition/dtos/payment-condition.response.dto';
import { ResponseAddressDto } from 'src/modules/address/dtos/address.response.dto';
import { ResponseFirmInterlocutorEntryDto } from 'src/modules/firm-interlocutor-entry/dtos/firm-interlocutor-entry.response.dto';

export class ResponseFirmDocumentChoiceDto {
  id: number;
  name: string;
  label: string;
  currency?: ResponseCurrencyDto;
  currencyId?: number;
  paymentCondition?: ResponsePaymentConditionDto;
  paymentConditionId?: number;
  invoicingAddress?: ResponseAddressDto;
  invoicingAddressId?: number;
  deliveryAddress?: ResponseAddressDto;
  deliveryAddressId?: number;
  interlocutorsToFirm?: ResponseFirmInterlocutorEntryDto[];
}
