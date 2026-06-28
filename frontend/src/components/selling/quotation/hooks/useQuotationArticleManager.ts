import { ArticleQuotationEntry, Tax } from '@/types';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

type QuotationPseudoItem = { id: string; article: ArticleQuotationEntry & { total?: number } };

export type QuotationArticleManager = {
  articles: QuotationPseudoItem[];
  taxSummary: { tax: Tax; amount: number }[];
  add: (article?: ArticleQuotationEntry) => void;
  update: (id: string, article: ArticleQuotationEntry) => void;
  delete: (id: string) => void;
  setArticles: (articles: ArticleQuotationEntry[]) => void;
  reset: () => void;
  getArticles: () => (ArticleQuotationEntry & { total: number })[];
  //feature
  removeArticleDescription: () => void;
};

const calculateForQuotation = (article: ArticleQuotationEntry) => {
  const quantity = article?.quantity || 0;
  const unit_price = article?.unit_price || 0;
  const discount = article?.discount || 0;
  const discount_type = article?.discount_type || DISCOUNT_TYPE?.PERCENTAGE;

  const subTotal = quantity * unit_price;

  const discountAmount =
    discount_type === DISCOUNT_TYPE.PERCENTAGE ? (subTotal * discount) / 100 : discount;

  const subTotalPlusDiscount = subTotal - discountAmount;

  //calculate tax rates
  let regularTaxAmount = 0;
  let specialTaxAmount = 0;
  let fixedTaxAmount = 0;

  if (article?.articleQuotationEntryTaxes) {
    for (const entry of article?.articleQuotationEntryTaxes) {
      if (entry?.tax?.isRate) {
        if (entry?.tax?.isSpecial) {
          specialTaxAmount += entry?.tax?.value || 0;
        } else {
          regularTaxAmount += entry?.tax?.value || 0;
        }
      } else fixedTaxAmount += entry?.tax?.value || 0;
    }
  }

  // Apply regular taxes first
  const totalAfterRegularTax = subTotalPlusDiscount * (1 + regularTaxAmount / 100);
  // Apply special taxes on top of the total after regular taxes
  const total = totalAfterRegularTax * (1 + specialTaxAmount / 100) + fixedTaxAmount;

  return { subTotal, total };
};

const calculateTaxSummary = (articles: QuotationPseudoItem[]) => {
  const taxSummaryMap = new Map<number, { tax: Tax; amount: number }>();

  articles.forEach((articleItem) => {
    const article = articleItem.article;
    const taxes = article.articleQuotationEntryTaxes || [];
    const subTotalPlusDiscount = article.subTotal || 0;

    // Calculate regular taxes first
    let regularTaxAmount = 0;
    taxes.forEach((taxEntry) => {
      const tax = taxEntry.tax;

      // Check if the tax is a percentage-based tax
      if (!tax?.isSpecial && tax?.isRate) {
        const taxAmount = subTotalPlusDiscount * ((tax?.value || 0) / 100);
        regularTaxAmount += taxAmount;
        if (tax?.id && taxSummaryMap.has(tax.id)) {
          taxSummaryMap.get(tax.id)!.amount += taxAmount;
        } else {
          tax?.id && taxSummaryMap.set(tax.id, { tax, amount: taxAmount });
        }
      }
      // Check if the tax is a fixed value tax (not rate-based)
      else if (!tax?.isSpecial && !tax?.isRate) {
        const taxAmount = tax?.value || 0; // Fixed amount tax
        if (tax?.id && taxSummaryMap.has(tax.id)) {
          taxSummaryMap.get(tax.id)!.amount += taxAmount;
        } else {
          tax?.id && taxSummaryMap.set(tax.id, { tax, amount: taxAmount });
        }
      }
    });

    // Apply special taxes on top of the amount including regular taxes
    const totalAfterRegularTax = subTotalPlusDiscount + regularTaxAmount;
    taxes.forEach((taxEntry) => {
      const tax = taxEntry.tax;
      if (tax?.isSpecial && tax?.isRate) {
        const taxAmount = totalAfterRegularTax * ((tax?.value || 0) / 100);
        if (tax?.id && taxSummaryMap.has(tax.id)) {
          taxSummaryMap.get(tax.id)!.amount += taxAmount;
        } else {
          tax?.id && taxSummaryMap.set(tax.id, { tax, amount: taxAmount });
        }
      }
      // Add special fixed tax amount (non-percentage-based special tax)
      else if (tax?.isSpecial && !tax?.isRate) {
        const taxAmount = tax?.value || 0; // Fixed amount special tax
        if (tax?.id && taxSummaryMap.has(tax.id)) {
          taxSummaryMap.get(tax.id)!.amount += taxAmount;
        } else {
          tax?.id && taxSummaryMap.set(tax.id, { tax, amount: taxAmount });
        }
      }
    });
  });

  return Array.from(taxSummaryMap.values());
};

export const useQuotationArticleManager = create<QuotationArticleManager>()((set, get) => ({
  articles: [],
  taxSummary: [],

  add: (article: ArticleQuotationEntry = {}) => {
    const { subTotal, total } = calculateForQuotation(article);

    set((state) => ({
      articles: [
        ...state.articles,
        {
          id: uuidv4(),
          article: {
            ...article,
            total,
            subTotal,
            discount_type: article.discount_type || DISCOUNT_TYPE.AMOUNT,
            discount: article.discount || 0
          }
        }
      ]
    }));

    const taxSummary = calculateTaxSummary(get().articles);
    set(() => ({
      taxSummary
    }));
  },

  update: (id: string, article: ArticleQuotationEntry) => {
    const { subTotal, total } = calculateForQuotation(article);

    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === id ? { ...a, article: { ...article, total, subTotal } } : a
      )
    }));

    const taxSummary = calculateTaxSummary(get().articles);
    set(() => ({
      taxSummary
    }));
  },

  delete: (id: string) => {
    set((state) => ({
      articles: state.articles.filter((a) => a.id !== id)
    }));

    const taxSummary = calculateTaxSummary(get().articles);
    set(() => ({
      taxSummary
    }));
  },

  setArticles: (articles: ArticleQuotationEntry[]) => {
    set({
      articles: articles.map((article) => {
        const { subTotal, total } = calculateForQuotation(article);
        return {
          id: uuidv4(),
          article: { ...article, total, subTotal }
        };
      })
    });

    const taxSummary = calculateTaxSummary(get().articles);
    set(() => ({
      taxSummary
    }));
  },

  reset: () =>
    set({
      articles: [],
      taxSummary: []
    }),

  getArticles: () => {
    return get().articles.map((item) => {
      const { subTotal, total } = calculateForQuotation(item.article);
      return { ...item.article, total, subTotal };
    });
  },
  removeArticleDescription: () => {
    set((state) => ({
      articles: state.articles.map((item) => {
        return {
          ...item,
          article: { ...item.article, article: { ...item.article.article, description: '' } }
        };
      })
    }));
  }
}));
