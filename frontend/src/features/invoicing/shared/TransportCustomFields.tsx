import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface TransportCustomFieldsProps {
  className?: string;
  translationKey: 'deliveryNote' | 'goodsIssueNote';
  vehicleRegistration: string;
  driverName: string;
  onVehicleRegistrationChange: (value: string) => void;
  onDriverNameChange: (value: string) => void;
  disabled?: boolean;
}

export const TransportCustomFields: React.FC<TransportCustomFieldsProps> = ({
  className,
  translationKey,
  vehicleRegistration,
  driverName,
  onVehicleRegistrationChange,
  onDriverNameChange,
  disabled = false
}) => {
  const { t: tInvoicing } = useTranslation('invoicing');

  return (
    <section className={cn('space-y-4', className)}>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
          {tInvoicing(`${translationKey}.custom_fields.title`)}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {tInvoicing(`${translationKey}.custom_fields.description`)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{tInvoicing(`${translationKey}.custom_fields.vehicle_registration`)}</Label>
          <Input
            className="h-10"
            disabled={disabled}
            placeholder={tInvoicing(`${translationKey}.custom_fields.placeholder`)}
            value={vehicleRegistration}
            onChange={(event) => onVehicleRegistrationChange(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>{tInvoicing(`${translationKey}.custom_fields.driver_name`)}</Label>
          <Input
            className="h-10"
            disabled={disabled}
            placeholder={tInvoicing(`${translationKey}.custom_fields.placeholder`)}
            value={driverName}
            onChange={(event) => onDriverNameChange(event.target.value)}
          />
        </div>
      </div>
    </section>
  );
};
