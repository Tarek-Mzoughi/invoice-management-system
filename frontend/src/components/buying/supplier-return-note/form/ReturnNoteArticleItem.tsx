import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ArticleReturnNoteEntry, Currency, ReturnNoteTaxEntry, Tax } from '@/types';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

type ArticlePriceMode = 'HT' | 'TTC';

interface ReturnNoteArticleItemProps {
  className?: string;
  article: ArticleReturnNoteEntry;
  onChange: (item: ArticleReturnNoteEntry) => void;
  showDescription?: boolean;
  currency?: Currency;
  taxes: Tax[];
  canReadTaxes?: boolean;
  edit?: boolean;
  priceMode?: ArticlePriceMode;
  showPrices?: boolean;
}

const formatTaxOption = (tax: Tax, currency?: Currency) => {
  if (tax.isRate) {
    return `${tax.label} (${(tax.value ?? 0).toFixed(2)}%)`;
  }

  return `${tax.label} (${(tax.value ?? 0).toFixed(currency?.digitAfterComma || 3)} ${
    currency?.symbol || '$'
  })`;
};

export const ReturnNoteArticleItem: React.FC<ReturnNoteArticleItemProps> = ({
  className,
  article,
  onChange,
  taxes,
  canReadTaxes = true,
  currency,
  showDescription = false,
  edit = true,
  priceMode = 'HT',
  showPrices = true
}) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const digitAfterComma = currency?.digitAfterComma || 3;
  const currencySymbol = currency?.symbol || '$';
  const inputId = React.useId();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(
    showDescription || !!article.article?.description
  );
  const [isDiscountEnabled, setIsDiscountEnabled] = React.useState((article.discount || 0) > 0);

  React.useEffect(() => {
    if (showDescription || article.article?.description) {
      setIsDescriptionExpanded(true);
    }
  }, [showDescription, article.article?.description]);

  React.useEffect(() => {
    if ((article.discount || 0) > 0) {
      setIsDiscountEnabled(true);
    }
  }, [article.discount]);

  const selectedTaxIds = React.useMemo(
    () => (canReadTaxes ? article.articleReturnNoteEntryTaxes?.map((taxEntry) => taxEntry.tax?.id) || [] : []),
    [article.articleReturnNoteEntryTaxes, canReadTaxes]
  );
  const primaryTax = canReadTaxes ? article.articleReturnNoteEntryTaxes?.[0] : undefined;
  const extraTaxes = React.useMemo(
    () => (canReadTaxes ? article.articleReturnNoteEntryTaxes?.slice(1) || [] : []),
    [article.articleReturnNoteEntryTaxes, canReadTaxes]
  );

  const getAvailableTaxes = React.useCallback(
    (index: number) => {
      const currentTaxId = article.articleReturnNoteEntryTaxes?.[index]?.tax?.id;
      return canReadTaxes ? taxes.filter((tax) => !selectedTaxIds.includes(tax.id) || tax.id === currentTaxId) : [];
    },
    [article.articleReturnNoteEntryTaxes, canReadTaxes, selectedTaxIds, taxes]
  );

  const updateArticle = React.useCallback(
    (partial: Partial<ArticleReturnNoteEntry>) => {
      onChange({
        ...article,
        ...partial
      });
    },
    [article, onChange]
  );

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateArticle({
      article: {
        ...article.article,
        title: event.target.value
      }
    });
  };

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateArticle({
      article: {
        ...article.article,
        description: event.target.value
      }
    });
  };

  const handleDecimalChange = (
    value: string,
    field: 'quantity' | 'unit_price' | 'discount',
    allowPercentage = false
  ) => {
    const regex = new RegExp(`^\\d*(\\.\\d{0,${3}})?$`);
    if (!regex.test(value)) {
      return;
    }

    if (field === 'discount' && allowPercentage && value !== '') {
      updateArticle({
        discount: parseFloat(value)
      });
      return;
    }

    updateArticle({
      [field]: value === '' ? undefined : parseFloat(value)
    });
  };

  const handleDiscountTypeChange = (value: string) => {
    updateArticle({
      discount_type: value === 'PERCENTAGE' ? DISCOUNT_TYPE.PERCENTAGE : DISCOUNT_TYPE.AMOUNT,
      discount: 0
    });
  };

  const handleTaxChange = (value: string, index: number) => {
    if (!canReadTaxes) return;
    const selectedTax = taxes.find((tax) => tax.id === parseInt(value, 10));
    const updatedTaxes = [...(article.articleReturnNoteEntryTaxes || [])];

    if (selectedTax) {
      updatedTaxes[index] = { tax: selectedTax };
    } else {
      updatedTaxes.splice(index, 1);
    }

    updateArticle({ articleReturnNoteEntryTaxes: updatedTaxes });
  };

  const handleTaxDelete = (index: number) => {
    if (!canReadTaxes) return;
    const updatedTaxes = article.articleReturnNoteEntryTaxes?.filter((_, i) => i !== index);
    updateArticle({ articleReturnNoteEntryTaxes: updatedTaxes });
  };

  const handleAddTax = () => {
    if (!canReadTaxes) return;
    if ((article.articleReturnNoteEntryTaxes?.length || 0) >= taxes.length) {
      toast.info(tInvoicing('returnNote.errors.surpassed_tax_limit'));
      return;
    }

    updateArticle({
      articleReturnNoteEntryTaxes: [
        ...(article.articleReturnNoteEntryTaxes || []),
        {} as ReturnNoteTaxEntry
      ]
    });
  };

  const discountType = article.discount_type === DISCOUNT_TYPE.PERCENTAGE ? 'PERCENTAGE' : 'AMOUNT';
  const descriptionToggleId = `${inputId}-description`;
  const discountToggleId = `${inputId}-discount`;

  return (
    <div
      className={cn(
        'grid gap-4 lg:items-start',
        showPrices
          ? 'lg:grid-cols-[minmax(0,2.2fr)_150px_170px_180px_170px]'
          : 'lg:grid-cols-[minmax(0,2.6fr)_150px]',
        className
      )}
    >
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="lg:hidden">{tInvoicing('article.attributes.designation')}</Label>
          <Input
            className="h-10"
            disabled={!edit}
            placeholder={tInvoicing('returnNote.editor.product_placeholder')}
            value={article.article?.title || ''}
            onChange={handleTitleChange}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Checkbox
              id={descriptionToggleId}
              checked={isDescriptionExpanded}
              disabled={!edit}
              onCheckedChange={(checked) => setIsDescriptionExpanded(checked === true)}
            />
            <Label htmlFor={descriptionToggleId}>
              {tInvoicing('returnNote.editor.show_description')}
            </Label>
          </div>

          {isDescriptionExpanded && (
            <Textarea
              className="min-h-[100px] resize-none"
              disabled={!edit}
              placeholder={tInvoicing('article.attributes.description')}
              rows={4}
              value={article.article?.description || ''}
              onChange={handleDescriptionChange}
            />
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="lg:hidden">{tInvoicing('article.attributes.quantity')}</Label>
          <Input
            className="h-10"
            type="text"
            inputMode="decimal"
            disabled={!edit}
            value={article.quantity ?? ''}
            onChange={(event) => handleDecimalChange(event.target.value, 'quantity')}
          />
        </div>

        {showPrices && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                id={discountToggleId}
                checked={isDiscountEnabled}
                disabled={!edit}
                onCheckedChange={(checked) => {
                  const enabled = checked === true;
                  setIsDiscountEnabled(enabled);

                  if (!enabled) {
                    updateArticle({
                      discount: 0,
                      discount_type: DISCOUNT_TYPE.PERCENTAGE
                    });
                  }
                }}
              />
              <Label htmlFor={discountToggleId}>
                {tInvoicing('returnNote.editor.apply_discount')}
              </Label>
            </div>

            {isDiscountEnabled && (
              <div className="grid gap-2 sm:grid-cols-[90px_minmax(0,1fr)]">
                <Select
                  disabled={!edit}
                  onValueChange={handleDiscountTypeChange}
                  value={discountType}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="%" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="PERCENTAGE">%</SelectItem>
                    <SelectItem value="AMOUNT">{currencySymbol}</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  className="h-10"
                  type="text"
                  inputMode="decimal"
                  disabled={!edit}
                  value={article.discount ?? ''}
                  onChange={(event) =>
                    handleDecimalChange(
                      event.target.value,
                      'discount',
                      article.discount_type === DISCOUNT_TYPE.PERCENTAGE
                    )
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>

      {showPrices && (
        <>
          <div className="space-y-2">
            <Label className="lg:hidden">{tInvoicing('article.attributes.unit_price')}</Label>
            <div className="relative">
              <Input
                className="h-10 pr-20"
                type="text"
                inputMode="decimal"
                disabled={!edit}
                value={article.unit_price ?? ''}
                onChange={(event) => handleDecimalChange(event.target.value, 'unit_price')}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-zinc-500 dark:text-zinc-400">
                {currencySymbol} {priceMode}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="lg:hidden">{tInvoicing('article.attributes.taxes')}</Label>
            {!canReadTaxes ? (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            {tInvoicing('article.no_applied_tax')}
          </div>
        ) : edit ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Select
                    onValueChange={(value) => handleTaxChange(value, 0)}
                    value={primaryTax?.tax?.id?.toString() || ''}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={tInvoicing('returnNote.editor.select_taxes')} />
                    </SelectTrigger>
                    <SelectContent align="start">
                      {getAvailableTaxes(0).map((tax) => (
                        <SelectItem key={tax.id} value={tax.id?.toString() || ''}>
                          {formatTaxOption(tax, currency)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={handleAddTax}
                  >
                    +
                  </Button>
                </div>

                {extraTaxes.map((taxEntry, index) => (
                  <div
                    key={`${taxEntry.tax?.id || 'empty'}-${index}`}
                    className="flex items-center gap-2"
                  >
                    <Select
                      onValueChange={(value) => handleTaxChange(value, index + 1)}
                      value={taxEntry.tax?.id?.toString() || ''}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={tInvoicing('returnNote.editor.select_taxes')} />
                      </SelectTrigger>
                      <SelectContent align="start">
                        {getAvailableTaxes(index + 1).map((tax) => (
                          <SelectItem key={tax.id} value={tax.id?.toString() || ''}>
                            {formatTaxOption(tax, currency)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 text-zinc-400 hover:text-red-500"
                      onClick={() => handleTaxDelete(index + 1)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                {(article.articleReturnNoteEntryTaxes || []).length === 0 ? (
                  <p className="text-muted-foreground">
                    {tInvoicing('returnNote.editor.no_taxes')}
                  </p>
                ) : (
                  article.articleReturnNoteEntryTaxes?.map((taxEntry, index) => (
                    <p key={`${taxEntry.tax?.id || 'tax'}-${index}`}>
                      {taxEntry.tax ? formatTaxOption(taxEntry.tax, currency) : '-'}
                    </p>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="lg:hidden">{tInvoicing('article.attributes.tax_excluded')}</Label>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
              {(article.subTotal || 0).toFixed(digitAfterComma)} {currencySymbol}
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              {tInvoicing('returnNote.attributes.total')}:{' '}
              {(article.total || 0).toFixed(digitAfterComma)} {currencySymbol}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
