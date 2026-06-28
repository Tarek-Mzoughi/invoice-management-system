import { create } from 'zustand';

export type DeliveryNoteControlManager = {
  isBankAccountDetailsHidden: boolean;
  isInvoiceAddressHidden: boolean;
  isDeliveryAddressHidden: boolean;
  isGeneralConditionsHidden: boolean;
  isArticleDescriptionHidden: boolean;
  isPricesHidden: boolean;
  toggle: (field: keyof DeliveryNoteControlManager) => void;
  set: (field: keyof DeliveryNoteControlManager, value: boolean) => void;
  setControls: (
    data: Omit<
      DeliveryNoteControlManager,
      'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'
    >
  ) => void;
  getControls: () => Omit<
    DeliveryNoteControlManager,
    'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'
  >;
  reset: () => void;
};

export const useDeliveryNoteControlManager = create<DeliveryNoteControlManager>()((set, get) => ({
  isBankAccountDetailsHidden: false,
  isInvoiceAddressHidden: false,
  isDeliveryAddressHidden: false,
  isGeneralConditionsHidden: false,
  isArticleDescriptionHidden: false,
  isPricesHidden: false,
  toggle: (field: keyof DeliveryNoteControlManager) =>
    set((state) => ({ ...state, [field]: !state[field] })),
  set: (field: keyof DeliveryNoteControlManager, value: boolean) =>
    set((state) => ({ ...state, [field]: value })),
  setControls: (data: any) => {
    set((state) => ({ ...state, ...data }));
  },
  getControls: () => {
    return get();
  },
  reset: () =>
    set({
      isBankAccountDetailsHidden: false,
      isInvoiceAddressHidden: false,
      isDeliveryAddressHidden: false,
      isGeneralConditionsHidden: false,
      isArticleDescriptionHidden: false,
      isPricesHidden: false
    })
}));
