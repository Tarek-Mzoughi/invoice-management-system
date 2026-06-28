import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useCreateCabinet } from '@/hooks/content/useCabinetSwitcher';
import { useTranslation } from 'react-i18next';
import { CreateCabinetPayload } from '@/types';
import { Loader2 } from 'lucide-react';

interface CabinetCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTIVITY_TYPES = [
  'commercial',
  'service',
  'industrial',
  'liberal_profession',
  'artisanal',
  'other'
] as const;

export function CabinetCreateDialog({ open, onOpenChange }: CabinetCreateDialogProps) {
  const { t } = useTranslation('common');
  const { createCabinet, isCreating } = useCreateCabinet();

  const [formData, setFormData] = React.useState({
    enterpriseName: '',
    activityType: '',
    email: '',
    taxIdNumber: '',
    phone: ''
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const resetForm = React.useCallback(() => {
    setFormData({
      enterpriseName: '',
      activityType: '',
      email: '',
      taxIdNumber: '',
      phone: ''
    });
    setErrors({});
  }, []);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetForm();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetForm]
  );

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.enterpriseName.trim()) {
      newErrors.enterpriseName = t('cabinet.create.errors.name_required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateCabinetPayload = {
      enterpriseName: formData.enterpriseName.trim(),
      ...(formData.activityType && { activityType: formData.activityType }),
      ...(formData.email && { email: formData.email.trim() }),
      ...(formData.taxIdNumber && { taxIdNumber: formData.taxIdNumber.trim() }),
      ...(formData.phone && { phone: formData.phone.trim() })
    };

    createCabinet(payload, {
      onSuccess: () => handleOpenChange(false)
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t('cabinet.create.title')}</DialogTitle>
          <DialogDescription>{t('cabinet.create.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="enterpriseName">{t('cabinet.create.name')} *</Label>
            <Input
              id="enterpriseName"
              value={formData.enterpriseName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, enterpriseName: e.target.value }))
              }
              placeholder={t('cabinet.create.name_placeholder')}
              disabled={isCreating}
            />
            {errors.enterpriseName && (
              <p className="text-sm text-destructive">{errors.enterpriseName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="activityType">{t('cabinet.create.activity_type')}</Label>
            <Select
              value={formData.activityType}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, activityType: value }))
              }
              disabled={isCreating}>
              <SelectTrigger id="activityType">
                <SelectValue placeholder={t('cabinet.create.activity_type_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`cabinet.create.activity_types.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('cabinet.create.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('cabinet.create.phone')}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+216 XX XXX XXX"
                disabled={isCreating}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxIdNumber">{t('cabinet.create.tax_id')}</Label>
            <Input
              id="taxIdNumber"
              value={formData.taxIdNumber}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, taxIdNumber: e.target.value }))
              }
              placeholder={t('cabinet.create.tax_id_placeholder')}
              disabled={isCreating}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isCreating}>
              {t('commands.cancel')}
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('cabinet.create.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
