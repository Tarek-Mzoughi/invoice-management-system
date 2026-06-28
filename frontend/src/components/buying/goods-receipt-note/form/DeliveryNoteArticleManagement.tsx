import React from 'react';
import { cn } from '@/lib/utils';
import {
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  DndContext,
  closestCenter
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import SortableLinks from '@/components/ui/sortable';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Article, Tax } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DeliveryNoteArticleItem } from './DeliveryNoteArticleItem';
import { useDeliveryNoteArticleManager } from '../hooks/useDeliveryNoteArticleManager';
import { useTranslation } from 'react-i18next';
import { useDeliveryNoteManager } from '../hooks/useDeliveryNoteManager';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { ACTIVITY_TYPE } from '@/types/enums/activity-type';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuthSyncStatus } from '@/hooks/other/useAuthSyncStatus';
import useArticleChoices from '@/hooks/content/useArticleChoices';
import { PermissionNotice } from '@/features/rbac/PermissionNotice';
type ArticlePriceMode = 'HT' | 'TTC';
const getSelectableArticles = (articles: Article[], activityType: ACTIVITY_TYPE) => {
  const expectedDestination = 'buying';
  return articles
    .filter(
      (article) =>
        article.id &&
        (article.destination === expectedDestination || article.destination === 'both')
    )
    .sort((left, right) =>
      `${left.title || ''}${left.reference || ''}`.localeCompare(
        `${right.title || ''}${right.reference || ''}`,
        undefined,
        { sensitivity: 'base' }
      )
    );
};
const createDeliveryNoteEntryFromArticle = (
  selectedArticle: Article,
  taxes: Tax[],
  activityType: ACTIVITY_TYPE
) => {
  const taxIds = [...(selectedArticle.taxIds || []), ...(selectedArticle.additionalTaxIds || [])];
  const uniqueTaxIds = [...new Set(taxIds)];
  return {
    articleId: selectedArticle.id,
    article: {
      id: selectedArticle.id,
      title: selectedArticle.title || '',
      description: selectedArticle.description || ''
    },
    quantity: 1,
    unit_price: Number(selectedArticle.purchasePrice || 0),
    discount: selectedArticle.discountEnabled ? Number(selectedArticle.discountValue || 0) : 0,
    discount_type:
      selectedArticle.discountType === 'amount' ? DISCOUNT_TYPE.AMOUNT : DISCOUNT_TYPE.PERCENTAGE,
    articleDeliveryNoteEntryTaxes: uniqueTaxIds
      .map((taxId) => taxes.find((tax) => tax.id === taxId))
      .filter((tax): tax is Tax => Boolean(tax))
      .map((tax) => ({ tax }))
  };
};
interface DeliveryNoteArticleManagementProps {
  className?: string;
  taxes: Tax[];
  isArticleDescriptionHidden: boolean;
  showPrices?: boolean;
  edit?: boolean;
  loading?: boolean;
  embedded?: boolean;
  canUseProductChoices?: boolean;
  canReadTaxes?: boolean;
  requiredReady?: boolean;
}
export const DeliveryNoteArticleManagement: React.FC<DeliveryNoteArticleManagementProps> = ({
  className,
  taxes = [],
  isArticleDescriptionHidden,
  showPrices = true,
  edit = true,
  loading,
  embedded = false,
  canUseProductChoices = true,
  canReadTaxes = true,
  requiredReady = true
}) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const deliveryNoteManager = useDeliveryNoteManager();
  const articleManager = useDeliveryNoteArticleManager();
  const { isProtectedDataReady } = useAuthSyncStatus();
  const [priceMode, setPriceMode] = React.useState<ArticlePriceMode>('HT');
  const [isGlobalDiscountEnabled, setIsGlobalDiscountEnabled] = React.useState(false);
  const [articlePickerKey, setArticlePickerKey] = React.useState(0);
  const activityType = deliveryNoteManager.activityType || ACTIVITY_TYPE.SELLING;
  const { articles: allArticles, isFetchArticlesPending } = useArticleChoices({
    context: 'document',
    activityType,
    enabled: edit && isProtectedDataReady && requiredReady && canUseProductChoices,
    silentForbiddenToast: true
  });
  const availableTaxes = React.useMemo(() => (canReadTaxes ? taxes : []), [canReadTaxes, taxes]);
  const selectableArticles = React.useMemo(
    () => getSelectableArticles(allArticles, activityType),
    [activityType, allArticles]
  );
  React.useEffect(() => {
    if ((deliveryNoteManager.discount || 0) > 0) {
      setIsGlobalDiscountEnabled(true);
    }
  }, [deliveryNoteManager.discount]);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );
  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = articleManager.articles.findIndex((item) => item.id === active.id);
    const newIndex = articleManager.articles.findIndex((item) => item.id === over.id);
    articleManager.setArticles(
      arrayMove(
        articleManager.articles.map((item) => item.article),
        oldIndex,
        newIndex
      )
    );
  }
  function handleDelete(idToDelete: string) {
    articleManager.delete(idToDelete);
  }
  const addNewItem = React.useCallback(() => {
    articleManager.add({
      quantity: 1,
      unit_price: 0,
      discount: 0,
      discount_type: DISCOUNT_TYPE.PERCENTAGE
    });
  }, [articleManager]);
  const handleArticleSelect = React.useCallback(
    (value: string) => {
      const selectedArticle = selectableArticles.find((article) => article.id === Number(value));
      if (!selectedArticle) {
        return;
      }
      articleManager.add(createDeliveryNoteEntryFromArticle(selectedArticle, availableTaxes, activityType));
      setArticlePickerKey((currentKey) => currentKey + 1);
    },
    [activityType, articleManager, availableTaxes, selectableArticles]
  );
  const handleGlobalDiscountToggle = React.useCallback(
    (checked: boolean | 'indeterminate') => {
      const enabled = checked === true;
      setIsGlobalDiscountEnabled(enabled);
      if (!enabled) {
        deliveryNoteManager.set('discount', 0);
        deliveryNoteManager.set('discountType', DISCOUNT_TYPE.PERCENTAGE);
      }
    },
    [deliveryNoteManager]
  );
  const handleGlobalDiscountChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      const digitAfterComma = deliveryNoteManager.currency?.digitAfterComma || 3;
      const regex = new RegExp(`^\\d*(\\.\\d{0,${digitAfterComma}})?$`);
      if (regex.test(nextValue)) {
        deliveryNoteManager.set('discount', nextValue === '' ? 0 : parseFloat(nextValue));
      }
    },
    [deliveryNoteManager]
  );
  const globalDiscountType =
    deliveryNoteManager.discountType === DISCOUNT_TYPE.PERCENTAGE ? 'PERCENTAGE' : 'AMOUNT';
  return (
    <section className={cn('space-y-5', embedded ? '' : 'border-b pb-8', className)}>
      <div className="space-y-4">
        {showPrices && (
          <div className="space-y-3">
            <h2 className="text-base font-medium text-zinc-950 dark:text-zinc-50">
              {tInvoicing('deliveryNote.editor.article_prices_label')}
            </h2>
            <RadioGroup
              value={priceMode}
              onValueChange={(value) => setPriceMode(value as ArticlePriceMode)}
              className="flex flex-wrap gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="HT" id="deliveryNote-price-mode-ht" disabled={!edit} />
                <Label htmlFor="deliveryNote-price-mode-ht">
                  {tInvoicing('deliveryNote.editor.price_excluding_tax')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="TTC" id="deliveryNote-price-mode-ttc" disabled={!edit} />
                <Label htmlFor="deliveryNote-price-mode-ttc">
                  {tInvoicing('deliveryNote.editor.price_including_tax')}
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-base font-medium text-zinc-950 dark:text-zinc-50">
            {tInvoicing('article.plural')}
          </h3>

          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div
              className={cn(
                'hidden gap-4 border-b border-zinc-200 bg-zinc-100/80 px-4 py-3 text-sm font-medium text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 lg:grid',
                showPrices
                  ? 'lg:grid-cols-[minmax(0,2.2fr)_150px_170px_180px_170px]'
                  : 'lg:grid-cols-[minmax(0,2.6fr)_150px]'
              )}
            >
              <span>{tInvoicing('article.attributes.designation')}</span>
              <span>{tInvoicing('article.attributes.quantity')}</span>
              {showPrices && (
                <>
                  <span>{tInvoicing('article.attributes.unit_price')}</span>
                  <span>{tInvoicing('article.attributes.taxes')}</span>
                  <span>{tInvoicing('article.attributes.tax_excluded')}</span>
                </>
              )}
            </div>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              >
                <SortableContext
                  items={articleManager.articles}
                  strategy={verticalListSortingStrategy}
                >
                  {loading && <Skeleton className="mx-4 my-5 h-24" />}

                  {!loading && articleManager.articles.length === 0 && (
                    <div className="flex min-h-[96px] items-center justify-center px-4 py-6 text-sm text-muted-foreground">
                      {tInvoicing('deliveryNote.editor.empty_article')}
                    </div>
                  )}

                  {!loading &&
                    articleManager.articles.map((item, index) => (
                      <SortableLinks
                        key={item.id}
                        id={item}
                        showHandle={false}
                        className={cn(
                          'rounded-none border-0 bg-transparent p-0 shadow-none',
                          index === 0 && 'border-t-0'
                        )}
                        deleteButtonClassName="px-4 text-zinc-400 hover:text-red-500"
                        onDelete={edit ? handleDelete : undefined}
                      >
                        <div className="px-4 py-4">
                          <DeliveryNoteArticleItem
                            article={item.article}
                            onChange={(article) => articleManager.update(item.id, article)}
                            taxes={availableTaxes}
                            showDescription={!isArticleDescriptionHidden}
                            canReadTaxes={canReadTaxes}
                            currency={deliveryNoteManager.currency}
                            edit={edit}
                            priceMode={priceMode}
                            showPrices={showPrices}
                          />
                        </div>
                      </SortableLinks>
                    ))}
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>
      </div>

      {!canUseProductChoices && (
        <PermissionNotice tone="danger" i18nKey="rbac.requiresProductsRead" compact />
      )}
      {canUseProductChoices && !canReadTaxes && (
        <PermissionNotice tone="info" i18nKey="rbac.taxesWithholdingDisabled" compact />
      )}

      {edit && (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <Select
            key={articlePickerKey}
            disabled={!edit || !canUseProductChoices || isFetchArticlesPending}
            onValueChange={handleArticleSelect}
          >
            <SelectTrigger className="h-10 bg-white text-left text-sm text-muted-foreground shadow-sm dark:bg-zinc-950">
              <SelectValue placeholder={tInvoicing('deliveryNote.editor.select_article')} />
            </SelectTrigger>
            <SelectContent>
              {selectableArticles.length > 0 ? (
                selectableArticles.map((article) => (
                  <SelectItem key={article.id} value={String(article.id)}>
                    {article.reference?.trim()
                      ? `${article.title || tInvoicing('article.singular')} - ${article.reference}`
                      : article.title || tInvoicing('article.singular')}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-article" disabled>
                  {tInvoicing('deliveryNote.editor.empty_article')}
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <Button variant="outline" className="h-10" onClick={addNewItem}>
            {tInvoicing('deliveryNote.editor.add_empty_line')}
          </Button>
        </div>
      )}

      {showPrices && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-900/20">
          <div className="flex items-center gap-3">
            <Checkbox
              id="deliveryNote-global-discount"
              checked={isGlobalDiscountEnabled}
              disabled={!edit}
              onCheckedChange={handleGlobalDiscountToggle}
            />
            <Label htmlFor="deliveryNote-global-discount">
              {tInvoicing('deliveryNote.editor.add_global_discount')}
            </Label>
          </div>

          {isGlobalDiscountEnabled && (
            <div className="mt-4 grid gap-3 lg:grid-cols-[120px_minmax(0,1fr)_auto] lg:items-center">
              <Select
                disabled={!edit}
                onValueChange={(value: string) => {
                  deliveryNoteManager.set(
                    'discountType',
                    value === 'PERCENTAGE' ? DISCOUNT_TYPE.PERCENTAGE : DISCOUNT_TYPE.AMOUNT
                  );
                }}
                value={globalDiscountType}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="%" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="PERCENTAGE">%</SelectItem>
                  <SelectItem value="AMOUNT">
                    {deliveryNoteManager.currency?.symbol || '$'}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Input
                className="h-10"
                type="text"
                inputMode="decimal"
                disabled={!edit}
                value={deliveryNoteManager.discount ?? 0}
                onChange={handleGlobalDiscountChange}
              />

              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                {tInvoicing('deliveryNote.attributes.discount')}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
