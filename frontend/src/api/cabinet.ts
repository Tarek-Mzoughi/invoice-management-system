import axios from './axios';
import { isEmail } from '@/utils/validations/string.validations';
import { address } from './address';
import { Cabinet, CreateCabinetPayload, ToastValidation, UpdateCabinetDto } from '@/types';
import { upload } from './upload';
import { api } from '.';
import { isValidUrl } from '@/utils/string.utils';
import { ResponseUserDto } from '@/types/user';

const normalizeCabinet = (cabinet: Cabinet): Cabinet => {
  const invoicingAddress = cabinet.invoicingAddress ?? cabinet.address;
  const phoneNumbers =
    cabinet.phoneNumbers?.filter(Boolean) ??
    (cabinet.phone ? [cabinet.phone] : []);
  const activities =
    cabinet.activities?.length && cabinet.activities.length > 0
      ? cabinet.activities
      : cabinet.activity
        ? [cabinet.activity]
        : [];

  return {
    ...cabinet,
    address: invoicingAddress,
    invoicingAddress,
    phoneNumbers,
    phone: phoneNumbers[0] ?? cabinet.phone,
    activities,
    activity: cabinet.activity ?? activities[0],
    activityId: cabinet.activityId ?? activities[0]?.id,
    activityIds: cabinet.activityIds ?? activities.map((activity) => activity.id || -1).filter((id) => id > 0),
    countryId:
      cabinet.countryId ??
      cabinet.country?.id ??
      invoicingAddress?.countryId ??
      invoicingAddress?.country?.id
  };
};

const findAll = async (): Promise<Cabinet[]> => {
  const response = await axios.get<Cabinet[]>(`public/cabinet/list`);
  return response.data.map(normalizeCabinet);
};

const findOne = async (
  id: number,
  loadMedia: 'indeed' | 'falsely' = 'falsely'
): Promise<Cabinet> => {
  const response = await axios.get<Cabinet>(`public/cabinet/${id}`);
  const normalizedCabinet = normalizeCabinet(response.data);
  if (loadMedia != 'falsely') {
    const logoBlob = normalizedCabinet.logoId
      ? await api.upload.fetchBlobById(normalizedCabinet.logoId)
      : undefined;
    const signatureBlob = normalizedCabinet.signatureId
      ? await api.upload.fetchBlobById(normalizedCabinet.signatureId)
      : undefined;
    const stampBlob = normalizedCabinet.stampId
      ? await api.upload.fetchBlobById(normalizedCabinet.stampId)
      : undefined;
    return {
      ...normalizedCabinet,
      logo: logoBlob ? new File([logoBlob], 'logo', { type: logoBlob.type }) : undefined,
      signature: signatureBlob
        ? new File([signatureBlob], 'signature', { type: signatureBlob.type })
        : undefined,
      stamp: stampBlob ? new File([stampBlob], 'stamp', { type: stampBlob.type }) : undefined
    };
  }
  return normalizedCabinet;
};

const update = async (cabinet: UpdateCabinetDto): Promise<Cabinet> => {
  const logoId = cabinet.logo ? (await upload.uploadFile(cabinet.logo)).id : undefined;
  const signatureId = cabinet.signature
    ? (await upload.uploadFile(cabinet.signature)).id
    : undefined;
  const stampId = cabinet.stamp ? (await upload.uploadFile(cabinet.stamp)).id : undefined;
  const { logo, signature, stamp, ...payload } = cabinet;
  const response = await axios.put<Cabinet>(`public/cabinet/${cabinet.id}`, {
    ...payload,
    phone: cabinet.phoneNumbers?.filter(Boolean)?.[0] || cabinet.phone || null,
    logoId: logoId || null,
    signatureId: signatureId || null,
    stampId: stampId || null
  });
  return normalizeCabinet(response.data);
};

const validate = (cabinet: Partial<Cabinet>): ToastValidation => {
  if (!cabinet.enterpriseName?.trim()) {
    return { message: 'cabinet.errors.enterprise_name_required' };
  }

  if (!cabinet.email?.trim() || !isEmail(cabinet.email || '')) {
    return { message: 'cabinet.errors.invalid_email' };
  }

  if (cabinet.website?.trim() && !isValidUrl(cabinet.website)) {
    return { message: 'cabinet.errors.invalid_website' };
  }

  if (!cabinet.isPerson && !cabinet.taxIdNumber?.trim()) {
    return { message: 'cabinet.errors.tax_number_required' };
  }

  if (!cabinet.invoiceDisplayType) {
    return { message: 'cabinet.errors.invoice_display_type_required' };
  }

  const addressValidation = cabinet?.invoicingAddress
    ? address.validate(cabinet.invoicingAddress)
    : undefined;
  if (addressValidation?.message) {
    if (addressValidation.message === 'Adresse est obligatoire') {
      return { message: 'cabinet.errors.invoicing_address_required' };
    }

    if (addressValidation.message === 'Code postal doit être un nombre') {
      return { message: 'cabinet.errors.invoicing_address_zip_code_number' };
    }

    if (addressValidation.message === 'Code postal doit avoir 5 chiffres au maximum') {
      return { message: 'cabinet.errors.invoicing_address_zip_code_length' };
    }
  }

  return { message: '' };
};

const create = async (payload: CreateCabinetPayload): Promise<Cabinet> => {
  const response = await axios.post<Cabinet>('public/cabinet', payload);
  return normalizeCabinet(response.data);
};

const switchActiveCabinet = async (cabinetId: number): Promise<ResponseUserDto> => {
  const response = await axios.patch<ResponseUserDto>(`public/cabinet/switch/${cabinetId}`);
  return response.data;
};

const initNew = async (): Promise<ResponseUserDto> => {
  const response = await axios.post<ResponseUserDto>('public/cabinet/init-new');
  return response.data;
};

export const cabinet = { findAll, findOne, update, validate, create, switchActiveCabinet, initNew };
