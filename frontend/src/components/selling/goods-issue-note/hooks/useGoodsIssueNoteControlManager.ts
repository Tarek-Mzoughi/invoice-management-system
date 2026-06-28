import { create } from 'zustand';

export type GoodsIssueNoteControlManager = {
  isBankAccountDetailsHidden: boolean;
  isInvoiceAddressHidden: boolean;
  isDeliveryAddressHidden: boolean;
  isGeneralConditionsHidden: boolean;
  isArticleDescriptionHidden: boolean;
  isPricesHidden: boolean;
  toggle: (field: keyof GoodsIssueNoteControlManager) => void;
  set: (field: keyof GoodsIssueNoteControlManager, value: boolean) => void;
  setControls: (
    data: Omit<
      GoodsIssueNoteControlManager,
      'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'
    >
  ) => void;
  getControls: () => Omit<
    GoodsIssueNoteControlManager,
    'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'
  >;
  reset: () => void;
};

export const useGoodsIssueNoteControlManager = create<GoodsIssueNoteControlManager>()(
  (set, get) => ({
    isBankAccountDetailsHidden: false,
    isInvoiceAddressHidden: false,
    isDeliveryAddressHidden: false,
    isGeneralConditionsHidden: false,
    isArticleDescriptionHidden: false,
    isPricesHidden: false,
    toggle: (field: keyof GoodsIssueNoteControlManager) =>
      set((state) => ({ ...state, [field]: !state[field] })),
    set: (field: keyof GoodsIssueNoteControlManager, value: boolean) =>
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
  })
);
