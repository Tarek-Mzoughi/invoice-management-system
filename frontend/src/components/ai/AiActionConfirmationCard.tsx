import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AiActionPreview } from '@/types/ai';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
  X,
  User,
  FileText,
  ShoppingCart
} from 'lucide-react';

interface AiActionConfirmationCardProps {
  action: AiActionPreview;
  onConfirm?: (actionId: string, overrides?: Record<string, unknown>) => void;
  onCancel?: (actionId: string) => void;
  isConfirming?: boolean;
  isResolved?: boolean;
}

interface EditableItem {
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

interface EditableCustomer {
  name: string;
  email?: string;
  phone?: string;
}

function formatCurrency(value: number, currency: string): string {
  return (
    new Intl.NumberFormat('fr-TN', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value) + ` ${currency}`
  );
}

export function AiActionConfirmationCard({
  action,
  onConfirm,
  onCancel,
  isConfirming,
  isResolved
}: AiActionConfirmationCardProps) {
  const { preview } = action;
  const [isEditing, setIsEditing] = useState(false);

  // Editable state initialized from preview
  const [items, setItems] = useState<EditableItem[]>(
    () =>
      preview.items?.map((it) => ({
        title: it.title,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        currency: it.currency
      })) ?? []
  );

  const [customer, setCustomer] = useState<EditableCustomer>(
    () => ({
      name: preview.customer?.name ?? '',
      email: preview.customer?.email ?? '',
      phone: preview.customer?.phone ?? ''
    })
  );

  const computedTotal = useMemo(
    () => items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0),
    [items]
  );

  const currency = preview.totals?.currency ?? items[0]?.currency ?? 'TND';

  const handleItemChange = (idx: number, field: keyof EditableItem, value: string | number) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { title: '', quantity: 1, unitPrice: 0, currency }]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const buildOverrides = (): Record<string, unknown> | undefined => {
    if (!isEditing) return undefined;

    const overrides: Record<string, unknown> = {};

    // Items overrides
    if (preview.items && preview.items.length > 0) {
      const hasItemChanges =
        items.length !== preview.items.length ||
        items.some(
          (it, i) =>
            !preview.items![i] ||
            it.title !== preview.items![i].title ||
            it.quantity !== preview.items![i].quantity ||
            it.unitPrice !== preview.items![i].unitPrice
        );
      if (hasItemChanges) {
        overrides.items = items.map((it) => ({
          title: it.title,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice
        }));
      }
    }

    // Customer overrides
    if (preview.customer) {
      if (
        customer.name !== preview.customer.name ||
        customer.email !== (preview.customer.email ?? '') ||
        customer.phone !== (preview.customer.phone ?? '')
      ) {
        overrides.customerName = customer.name;
        if (customer.email) overrides.email = customer.email;
        if (customer.phone) overrides.phone = customer.phone;
      }
    }

    return Object.keys(overrides).length > 0 ? overrides : undefined;
  };

  const handleConfirm = () => {
    const overrides = buildOverrides();
    onConfirm?.(action.actionId, overrides);
  };

  return (
    <Card className="w-full border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            {action.title} — Confirmation requise
          </CardTitle>
          {!isResolved && !isConfirming && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsEditing(!isEditing)}
              title={isEditing ? 'Fermer l\'édition' : 'Modifier avant confirmation'}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3 space-y-3">
        {/* Customer */}
        {preview.customer && (
          <div className="flex items-start gap-2 text-sm">
            <User className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            {isEditing ? (
              <div className="flex flex-col gap-1.5 flex-1">
                <Input
                  value={customer.name}
                  onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                  placeholder="Nom du client"
                  className="h-7 text-xs"
                />
                <Input
                  value={customer.email ?? ''}
                  onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                  placeholder="Email"
                  className="h-7 text-xs"
                />
                <Input
                  value={customer.phone ?? ''}
                  onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                  placeholder="Téléphone"
                  className="h-7 text-xs"
                />
              </div>
            ) : (
              <div>
                <p className="font-medium">{customer.name || preview.customer.name}</p>
                {(customer.email || preview.customer.email) && (
                  <p className="text-xs text-muted-foreground">
                    {customer.email || preview.customer.email}
                  </p>
                )}
                {(customer.phone || preview.customer.phone) && (
                  <p className="text-xs text-muted-foreground">
                    {customer.phone || preview.customer.phone}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Document info */}
        {preview.document && (
          <div className="flex items-start gap-2 text-sm">
            <FileText className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              <span className="capitalize">{preview.document.type}</span>
              {' • '}
              <span>{preview.document.currency}</span>
            </div>
          </div>
        )}

        {/* Items table */}
        {items.length > 0 && (
          <div className="rounded-md border overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 border-b">
              <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Articles</span>
            </div>

            {isEditing ? (
              <div className="p-2 space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 rounded border p-1.5">
                    <div className="flex-1 space-y-1">
                      <Input
                        value={item.title}
                        onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                        placeholder="Désignation"
                        className="h-6 text-xs"
                      />
                      <div className="flex gap-1.5">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(idx, 'quantity', Number(e.target.value) || 0)
                          }
                          placeholder="Qté"
                          className="h-6 text-xs w-16"
                          min={0}
                        />
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(idx, 'unitPrice', Number(e.target.value) || 0)
                          }
                          placeholder="P.U."
                          className="h-6 text-xs w-24"
                          min={0}
                          step="0.01"
                        />
                        <span className="text-xs text-muted-foreground self-center whitespace-nowrap">
                          = {formatCurrency(item.quantity * item.unitPrice, currency)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-destructive"
                      onClick={() => handleRemoveItem(idx)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs gap-1"
                  onClick={handleAddItem}>
                  <Plus className="h-3 w-3" />
                  Ajouter un article
                </Button>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">
                      Désignation
                    </th>
                    <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">
                      Qté
                    </th>
                    <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">
                      P.U.
                    </th>
                    <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="px-3 py-1.5">
                        <span className="font-medium">{item.title}</span>
                        {item.description && (
                          <span className="block text-muted-foreground">{item.description}</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-right">{item.quantity}</td>
                      <td className="px-3 py-1.5 text-right whitespace-nowrap">
                        {formatCurrency(item.unitPrice, item.currency)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium whitespace-nowrap">
                        {formatCurrency(item.quantity * item.unitPrice, item.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Totals */}
        {(preview.totals || items.length > 0) && (
          <div className="rounded-md bg-muted p-3 space-y-1">
            {preview.totals?.taxTotal !== undefined && preview.totals.taxTotal > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Taxes</span>
                <span>{formatCurrency(preview.totals.taxTotal, currency)}</span>
              </div>
            )}
            {preview.totals?.discountTotal !== undefined && preview.totals.discountTotal > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Remise</span>
                <span>-{formatCurrency(preview.totals.discountTotal, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-border/50">
              <span>Total</span>
              <span>
                {formatCurrency(
                  isEditing
                    ? computedTotal + (preview.totals?.taxTotal ?? 0) - (preview.totals?.discountTotal ?? 0)
                    : preview.totals?.total ?? computedTotal,
                  currency
                )}
              </span>
            </div>
          </div>
        )}

        {/* Warnings */}
        {action.warnings?.length ? (
          <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              {action.warnings.map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="gap-2">
        {isResolved ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Action traitée</span>
          </div>
        ) : (
          <>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isConfirming}
              className="gap-1">
              <Check className="h-3.5 w-3.5" />
              {isConfirming ? 'Exécution...' : 'Confirmer'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCancel?.(action.actionId)}
              disabled={isConfirming}
              className="gap-1">
              <X className="h-3.5 w-3.5" />
              Annuler
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
