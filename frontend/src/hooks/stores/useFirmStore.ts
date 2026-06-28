import { api } from '@/api';
import { Activity, Address, Currency, Firm, FirmBankAccount, FirmEntityType, PaymentCondition, SOCIAL_TITLE } from '@/types';
import _ from 'lodash';
import { create } from 'zustand';

interface FirmData {
  //snapshot
  snapshot?: Firm;
  changed?: boolean;
  // data
  id?: number;
  title?: SOCIAL_TITLE;
  name?: string;
  surname?: string;
  enterpriseName?: string;
  position?: string;
  website?: string;
  entreprisePhone?: string;
  email?: string;
  phone?: string;
  entityType?: FirmEntityType;
  isPerson?: boolean;
  taxIdNumber?: string;
  activity?: Activity;
  currency?: Currency;
  paymentCondition?: PaymentCondition;
  notes?: string;
  invoicingAddress?: Address;
  deliveryAddress?: Address;
  bankAccounts?: FirmBankAccount[];
  // methods
}

export interface FirmStore extends FirmData {
  set: (name: keyof FirmData, value: any) => void;
  setFirm: (firm: Firm) => void;
  reset: () => void;
  getFirm: () => Firm;
}

const initialState: FirmData = {
  id: undefined,
  title: SOCIAL_TITLE.MR,
  name: '',
  surname: '',
  enterpriseName: '',
  website: '',
  entreprisePhone: '',
  email: '',
  phone: '',
  entityType: 'clients',
  isPerson: false,
  taxIdNumber: '',
  activity: undefined,
  currency: undefined,
  paymentCondition: undefined,
  notes: '',
  invoicingAddress: api.address.factory(),
  deliveryAddress: api.address.factory(),
  position: '',
  snapshot: undefined,
  changed: false,
  bankAccounts: []
};

export const useFirmStore = create<FirmStore>((set, get) => ({
  ...initialState,
  set: (name: keyof FirmData, value: any) => {
    set((state) => {
      const newState = {
        ...state,
        [name]: value
      };
      newState.changed = !_.isEqual(newState.snapshot, getNormalizedFirm(newState));
      return newState;
    });
  },
  setFirm: (firm: Firm) => {
    const mainInterlocutor = firm?.interlocutorsToFirm?.find((interlocutor) => interlocutor.isMain);
    const data = {
      id: firm?.id,
      title: mainInterlocutor?.interlocutor?.title as SOCIAL_TITLE,
      name: mainInterlocutor?.interlocutor?.name,
      surname: mainInterlocutor?.interlocutor?.surname,
      enterpriseName: firm?.name,
      website: firm?.website,
      entreprisePhone: firm?.phone,
      email: mainInterlocutor?.interlocutor?.email,
      phone: mainInterlocutor?.interlocutor?.phone,
      entityType: firm?.entityType,
      position: mainInterlocutor?.position,
      isPerson: firm?.isPerson,
      taxIdNumber: firm?.taxIdNumber,
      activity: firm?.activity,
      currency: firm?.currency,
      paymentCondition: firm?.paymentCondition,
      notes: firm?.notes,
      invoicingAddress: firm?.invoicingAddress,
      deliveryAddress: firm?.deliveryAddress,
      bankAccounts: firm?.bankAccounts || []
    };
    set((state) => ({
      ...state,
      ...data,
      snapshot: getNormalizedFirm(data)
    }));
  },
  getFirm: () => {
    const { set, reset, ...data } = get();
    return getNormalizedFirm(data);
  },
  reset: () => {
    set(() => ({
      ...initialState
    }));
  }
}));

const getNormalizedFirm = (data: any) => {
  return {
    id: data.id,
    name: data.enterpriseName,
    mainInterlocutor: {
      title: data?.title,
      name: data?.name,
      surname: data?.surname,
      phone: data?.phone,
      email: data?.email,
      position: data?.position
    },
    activityId: data?.activity?.id,
    currencyId: data?.currency?.id,
    paymentConditionId: data?.paymentCondition?.id,
    isPerson: data?.isPerson,
    entityType: data?.entityType,
    website: data?.website,
    phone: data?.entreprisePhone,
    ...(data?.isPerson ? {} : { taxIdNumber: data?.taxIdNumber }),
    notes: data?.notes,
    invoicingAddress: data?.invoicingAddress,
    deliveryAddress: data?.deliveryAddress,
    bankAccounts: data?.bankAccounts || []
  } as Firm;
};
