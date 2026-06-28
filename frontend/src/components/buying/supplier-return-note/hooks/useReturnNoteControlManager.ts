import { create } from 'zustand';

export type ReturnNoteControlManager = {
  isBankAccountDetailsHidden: boolean;
  isInvoiceAddressHidden: boolean;
  isDeliveryAddressHidden: boolean;
  isGeneralConditionsHidden: boolean;
  isArticleDescriptionHidden: boolean;
  isPricesHidden: boolean;
  toggle: (field: keyof ReturnNoteControlManager) => void;
  set: (field: keyof ReturnNoteControlManager, value: boolean) => void;
  setControls: (
    data: Omit<ReturnNoteControlManager, 'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'>
  ) => void;
  getControls: () => Omit<
    ReturnNoteControlManager,
    'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'
  >;
  reset: () => void;
};

export const useReturnNoteControlManager = create<ReturnNoteControlManager>()((set, get) => ({
  isBankAccountDetailsHidden: false,
  isInvoiceAddressHidden: false,
  isDeliveryAddressHidden: false,
  isGeneralConditionsHidden: false,
  isArticleDescriptionHidden: false,
  isPricesHidden: false,
  toggle: (field: keyof ReturnNoteControlManager) =>
    set((state) => ({ ...state, [field]: !state[field] })),
  set: (field: keyof ReturnNoteControlManager, value: boolean) =>
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
