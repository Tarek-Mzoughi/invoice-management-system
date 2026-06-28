import { Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Firm } from '@/types';
import { PaymentWorkflowEmptyState, PaymentWorkflowField } from './payment-workflow-ui';

interface PartnerSelectorCardProps {
  disabled?: boolean;
  firmId?: number;
  firms: Firm[];
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  selectedFirm?: Firm;
  title: string;
}

export const PartnerSelectorCard = ({
  disabled,
  firmId,
  firms,
  label,
  onChange,
  placeholder,
  selectedFirm,
  title
}: PartnerSelectorCardProps) => (
  <Card>
    <CardHeader className="p-5 pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Building2 className="h-4 w-4" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4 p-5 pt-0">
      <PaymentWorkflowField label={label}>
        <Select value={firmId ? String(firmId) : ''} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {firms.map((firm) => (
              <SelectItem key={firm.id} value={String(firm.id)}>
                {firm.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PaymentWorkflowField>

      {!selectedFirm ? (
        <PaymentWorkflowEmptyState label={placeholder} />
      ) : (
        <div className="grid gap-2 rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800 md:grid-cols-3">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className="font-medium">{selectedFirm.name}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Téléphone</p>
            <p>{selectedFirm.phone || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Devise</p>
            <p>{selectedFirm.currency?.code || selectedFirm.currency?.symbol || '-'}</p>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);
