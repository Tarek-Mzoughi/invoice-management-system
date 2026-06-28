import { Activity, Address, Cabinet, CabinetInvoiceDisplayType, Country, Currency } from '@/types';
import { create } from 'zustand';

const createEmptyAddress = (): Address => ({
  address: '',
  address2: '',
  region: '',
  zipcode: '',
  countryId: 227
});

const hasAddressValue = (address?: Address) =>
  Boolean(
    address?.address?.trim() ||
      address?.address2?.trim() ||
      address?.region?.trim() ||
      address?.zipcode?.trim()
  );

type CabinetManager = {
  // data
  id?: number;
  enterpriseName?: string;
  email?: string;
  website?: string;
  isPerson?: boolean;
  phone?: string;
  phoneNumbers: string[];
  taxIdNumber?: string;
  activityType?: string;
  activity?: Activity;
  activities: Activity[];
  currency?: Currency;
  country?: Country;
  countryId?: number;
  invoiceDisplayType?: CabinetInvoiceDisplayType;
  address?: Address;
  invoicingAddress?: Address;
  deliveryAddress?: Address;
  logo?: File;
  logoId?: number;
  signature?: File;
  signatureId?: number;
  stamp?: File;
  stampId?: number;
  // methods
  set: (name: keyof CabinetManager, value: any) => void;
  reset: () => void;
  setCabinet: (cabinet: Partial<Cabinet>) => void;
  getCabinet: () => Partial<Cabinet>;
};

const initialState: Omit<CabinetManager, 'set' | 'reset' | 'setCabinet' | 'getCabinet'> = {
  id: undefined,
  enterpriseName: '',
  email: '',
  website: '',
  isPerson: false,
  phone: '',
  phoneNumbers: [''],
  taxIdNumber: '',
  activityType: '',
  activity: undefined,
  activities: [],
  currency: undefined,
  country: undefined,
  countryId: 227,
  invoiceDisplayType: 'invoice',
  address: createEmptyAddress(),
  invoicingAddress: createEmptyAddress(),
  deliveryAddress: createEmptyAddress(),
  logo: undefined,
  logoId: undefined,
  signature: undefined,
  signatureId: undefined,
  stamp: undefined,
  stampId: undefined
};

export const useCabinetManager = create<CabinetManager>((set, get) => ({
  ...initialState,
  set: (name: keyof CabinetManager, value: any) => {
    set((state) => ({
      ...state,
      [name]: value
    }));
  },
  reset: () => {
    set({ ...initialState });
  },
  setCabinet: (cabinet: Partial<Cabinet>) => {
    set((state) => ({
      ...state,
      id: cabinet?.id,
      enterpriseName: cabinet?.enterpriseName,
      email: cabinet?.email,
      website: cabinet?.website,
      isPerson: cabinet?.isPerson ?? false,
      phone: cabinet?.phone || '',
      phoneNumbers:
        cabinet?.phoneNumbers?.length && cabinet.phoneNumbers.length > 0
          ? [...cabinet.phoneNumbers]
          : cabinet?.phone
            ? [cabinet.phone]
            : [''],
      taxIdNumber: cabinet?.taxIdNumber,
      activityType: cabinet?.activityType ?? '',
      activity: cabinet?.activity || cabinet?.activities?.[0],
      activities:
        cabinet?.activities?.length && cabinet.activities.length > 0
          ? [...cabinet.activities]
          : cabinet?.activity
            ? [cabinet.activity]
            : [],
      currency: cabinet?.currency,
      country: cabinet?.country,
      countryId:
        cabinet?.countryId ??
        cabinet?.country?.id ??
        cabinet?.invoicingAddress?.countryId ??
        cabinet?.address?.countryId ??
        227,
      invoiceDisplayType: cabinet?.invoiceDisplayType ?? 'invoice',
      address: cabinet?.invoicingAddress
        ? { ...cabinet.invoicingAddress }
        : cabinet?.address
          ? { ...cabinet.address }
          : createEmptyAddress(),
      invoicingAddress: cabinet?.invoicingAddress
        ? { ...cabinet.invoicingAddress }
        : cabinet?.address
          ? { ...cabinet.address }
          : createEmptyAddress(),
      deliveryAddress: cabinet?.deliveryAddress
        ? { ...cabinet.deliveryAddress }
        : createEmptyAddress(),
      logo: cabinet?.logo,
      logoId: cabinet?.logoId,
      signature: cabinet?.signature,
      signatureId: cabinet?.signatureId,
      stamp: cabinet?.stamp,
      stampId: cabinet?.stampId
    }));
  },
  getCabinet: () => {
    const { set, reset, setCabinet, getCabinet, ...data } = get();
    const phoneNumbers = data.phoneNumbers
      .map((phone) => phone.trim())
      .filter((phone) => phone.length > 0);
    const activities = data.activities.filter((activity) => Boolean(activity?.id));
    const invoicingAddress = {
      ...(data.invoicingAddress || data.address || createEmptyAddress())
    };
    const deliveryAddress = {
      ...(data.deliveryAddress || createEmptyAddress())
    };

    return {
      id: data.id,
      enterpriseName: data.enterpriseName,
      email: data.email,
      website: data.website,
      isPerson: data.isPerson,
      phone: phoneNumbers[0] || '',
      phoneNumbers,
      countryId: data.country?.id ?? data.countryId,
      invoiceDisplayType: data.invoiceDisplayType,
      taxIdNumber: data?.taxIdNumber,
      activityType: data.activityType,
      activityId: activities[0]?.id,
      activityIds: activities
        .map((activity) => activity.id)
        .filter((activityId): activityId is number => typeof activityId === 'number'),
      currencyId: data?.currency?.id,
      address: invoicingAddress,
      invoicingAddress,
      deliveryAddress: hasAddressValue(deliveryAddress) ? deliveryAddress : undefined,
      logo: data?.logo,
      logoId: data.logoId,
      signature: data?.signature,
      signatureId: data.signatureId,
      stamp: data.stamp,
      stampId: data.stampId
    };
  }
}));
