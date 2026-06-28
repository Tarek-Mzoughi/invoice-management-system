import axios from './axios';
import { address } from './address';
import { interlocutor } from './interlocutor';
import { SOCIAL_TITLE } from '../types/enums';
import { isValidUrl } from '@/utils/string.utils';
import {
  CreateFirmDto,
  Firm,
  FirmEntityType,
  PagedFirm,
  ToastValidation,
  UpdateFirmDto
} from '@/types';
import { FIRM_FILTER_ATTRIBUTES } from '@/constants/firm.filter-attributes';
import type { ApiRequestOptions } from './request-options';

export interface FindPaginatedFirmOptions {
  search?: string;
  relations?: string[];
  isPerson?: boolean;
  entityType?: FirmEntityType;
}

const factory = (): CreateFirmDto => {
  return {
    website: '',
    name: '',
    entityType: 'clients',
    taxIdNumber: '',
    isPerson: false,
    invoicingAddress: {
      address: '',
      address2: '',
      region: '',
      zipcode: '',
      countryId: -1
    },
    deliveryAddress: {
      address: '',
      address2: '',
      region: '',
      zipcode: '',
      countryId: -1
    },
    activityId: -1,
    currencyId: -1,
    paymentConditionId: -1,
    mainInterlocutor: {
      title: SOCIAL_TITLE.MR,
      name: '',
      surname: '',
      email: '',
      phone: '',
      position: ''
    },
    notes: ''
  };
};

const stripCabinetId = <T extends CreateFirmDto | UpdateFirmDto>(firm: T) => {
  const { cabinetId: _ignoredCabinetId, ...payload } = firm;
  return payload;
};

const buildFirmFilters = ({ search = '', isPerson, entityType }: FindPaginatedFirmOptions) => {
  const andConditions = [
    typeof isPerson === 'boolean' ? `${FIRM_FILTER_ATTRIBUTES.ISPERSON}||$eq||${isPerson}` : '',
    entityType ? `entityType||$eq||${entityType}` : ''
  ].filter(Boolean);

  const trimmedSearch = search.trim();
  if (!trimmedSearch) {
    return andConditions.join(';');
  }

  return Object.values(FIRM_FILTER_ATTRIBUTES)
    .map((attribute) =>
      [`${attribute}||$cont||${trimmedSearch}`, ...andConditions].filter(Boolean).join(';')
    )
    .join('||$or||');
};

const findPaginated = async (
  page: number = 1,
  size: number = 5,
  order: 'ASC' | 'DESC' = 'ASC',
  sortKey: string = 'id',
  searchOrOptions: string | FindPaginatedFirmOptions = '',
  relations: string[] = [
    'interlocutorsToFirm',
    'interlocutorsToFirm.interlocutor',
    'currency',
    'activity'
  ]
): Promise<PagedFirm> => {
  const options =
    typeof searchOrOptions === 'string'
      ? {
          search: searchOrOptions,
          relations
        }
      : {
          relations: [
            'interlocutorsToFirm',
            'interlocutorsToFirm.interlocutor',
            'currency',
            'activity'
          ],
          ...searchOrOptions
        };

  const filter = buildFirmFilters(options);
  const params = new URLSearchParams({
    sort: `${sortKey},${order}`,
    limit: size.toString(),
    page: page.toString(),
    join: (options.relations || relations).join(',')
  });

  if (filter) {
    params.set('filter', filter);
  }

  const response = await axios.get<PagedFirm>(`public/firm/list?${params.toString()}`);
  return response.data;
};

const findChoices = async (
  relations: string[] = [
    'interlocutorsToFirm',
    'interlocutorsToFirm.interlocutor',
    'currency',
    'activity',
    'paymentCondition'
  ],
  entityType?: FirmEntityType,
  options: ApiRequestOptions = {}
): Promise<Partial<Firm>[]> => {
  const params = new URLSearchParams({
    join: relations.join(',')
  });

  if (entityType) {
    params.set('filter', `entityType||$eq||${entityType}`);
  }

  const response = await axios.get<Partial<Firm>[]>(`public/firm/all?${params.toString()}`, {
    silentForbiddenToast: options.silentForbiddenToast
  });
  return response.data;
};

const findDocumentChoices = async (
  entityType: FirmEntityType,
  options: ApiRequestOptions = {}
): Promise<Partial<Firm>[]> => {
  const params = new URLSearchParams({
    entityType
  });

  const response = await axios.get<Partial<Firm>[]>(
    `public/firm/document-choices?${params.toString()}`,
    {
      silentForbiddenToast: options.silentForbiddenToast
    }
  );
  return response.data;
};

const findOne = async (
  id?: number,
  relations: string[] = [
    'interlocutorsToFirm',
    'interlocutorsToFirm.interlocutor',
    'currency',
    'activity',
    'paymentCondition',
    'invoicingAddress',
    'invoicingAddress.country',
    'deliveryAddress',
    'deliveryAddress.country'
  ]
): Promise<Firm> => {
  const response = await axios.get<Firm>(`public/firm/${id}?join=${relations.join(',')}`);
  return response.data;
};

const create = async (firm: CreateFirmDto): Promise<Firm> => {
  const response = await axios.post<Firm>('public/firm', stripCabinetId(firm));
  return response.data;
};

const validate = (firm: CreateFirmDto | UpdateFirmDto): ToastValidation => {
  const interlocutorValidation = firm?.mainInterlocutor
    ? interlocutor.validate(firm?.mainInterlocutor)
    : undefined;
  if (interlocutorValidation?.message) return interlocutorValidation;

  if (!firm.name) return { message: 'firm.errors.empty_entreprise_name' };
  if (!firm.taxIdNumber && !firm.isPerson)
    return { message: 'firm.errors.tax_number_required' };

  if (firm?.website != '' && !isValidUrl(firm?.website || ''))
    return { message: 'firm.errors.invalid_website' };

  if (!firm.paymentConditionId)
    return { message: 'firm.errors.payment_condition_required' };

  const validateAddress = (
    target: 'invoicingAddress' | 'deliveryAddress',
    currentAddress?: CreateFirmDto['invoicingAddress']
  ): ToastValidation | undefined => {
    const addressValidation = currentAddress ? address.validate(currentAddress) : undefined;
    if (!addressValidation?.message) return undefined;

    if (addressValidation.message === 'Adresse est obligatoire') {
      return {
        message:
          target === 'invoicingAddress'
            ? 'firm.errors.invoicing_address_required'
            : 'firm.errors.delivery_address_required'
      };
    }

    if (addressValidation.message === 'Code postal doit être un nombre') {
      return {
        message:
          target === 'invoicingAddress'
            ? 'firm.errors.invoicing_address_zip_code_number'
            : 'firm.errors.delivery_address_zip_code_number'
      };
    }

    if (addressValidation.message === 'Code postal doit avoir 5 chiffres au maximum') {
      return {
        message:
          target === 'invoicingAddress'
            ? 'firm.errors.invoicing_address_zip_code_length'
            : 'firm.errors.delivery_address_zip_code_length'
      };
    }

    return addressValidation;
  };

  const invoicingAddressValidation = validateAddress('invoicingAddress', firm?.invoicingAddress);
  if (invoicingAddressValidation?.message) return invoicingAddressValidation;

  const deliveryAddressValidation = validateAddress('deliveryAddress', firm?.deliveryAddress);
  if (deliveryAddressValidation?.message) return deliveryAddressValidation;

  return { message: '' };
};

const update = async (firm: UpdateFirmDto): Promise<Firm> => {
  const response = await axios.put<Firm>(`public/firm/${firm.id}`, stripCabinetId(firm));
  return response.data;
};

const remove = async (id: number) => {
  const { data, status } = await axios.delete<Firm>(`public/firm/${id}`);
  return { data, status };
};

const activate = async (id: number): Promise<Firm> => {
  const response = await axios.put<Firm>(`public/firm/${id}/activate`);
  return response.data;
};

const deactivate = async (id: number): Promise<Firm> => {
  const response = await axios.put<Firm>(`public/firm/${id}/deactivate`);
  return response.data;
};

export const firm = {
  findPaginated,
  findOne,
  findChoices,
  findDocumentChoices,
  create,
  factory,
  update,
  activate,
  deactivate,
  remove,
  validate
};
