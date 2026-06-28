import { create } from 'zustand';

export type CustomerOrderControlManager = {
  isBankAccountDetailsHidden: boolean;
  isInvoiceAddressHidden: boolean;
  isDeliveryAddressHidden: boolean;
  isGeneralConditionsHidden: boolean;
  isArticleDescriptionHidden: boolean;
  toggle: (field: keyof CustomerOrderControlManager) => void;
  set: (field: keyof CustomerOrderControlManager, value: boolean) => void;
  setControls: (
    data: Omit<
      CustomerOrderControlManager,
      'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'
    >
  ) => void;
  getControls: () => Omit<
    CustomerOrderControlManager,
    'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'
  >;
  reset: () => void;
};

export const useCustomerOrderControlManager = create<CustomerOrderControlManager>()((set, get) => ({
  isBankAccountDetailsHidden: false,
  isInvoiceAddressHidden: false,
  isDeliveryAddressHidden: false,
  isGeneralConditionsHidden: false,
  isArticleDescriptionHidden: false,
  toggle: (field: keyof CustomerOrderControlManager) =>
    set((state) => ({ ...state, [field]: !state[field] })),
  set: (field: keyof CustomerOrderControlManager, value: boolean) =>
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
      isArticleDescriptionHidden: false
    })
}));
