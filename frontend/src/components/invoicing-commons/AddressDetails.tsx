import React from 'react';
import { Address } from '@/types';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Skeleton } from '../ui/skeleton';
import { useTranslation } from 'react-i18next';

interface AddressDetailsProps {
  className?: string;
  addressType?: string;
  address?: Address;
  loading?: boolean;
}

export const AddressDetails: React.FC<AddressDetailsProps> = ({
  className,
  addressType,
  address,
  loading
}) => {
  const { t: tContacts } = useTranslation('contacts');
  const { t: tCountry } = useTranslation('country');

  if (!address) return null;
  return (
    <div className={cn(className)}>
      {loading ? (
        <Skeleton className="h-24 mr-2" />
      ) : (
        <>
          <Label className="font-extrabold text-base">{addressType}</Label>
          <div className="flex flex-col gap-1 mt-2">
            {address?.address && (
              <Label>
                {tContacts('common.address.address')}:{' '}
                <span className="font-light">{address?.address}</span>
              </Label>
            )}
            {address?.address2 && (
              <Label>
                {tContacts('common.address.address2')}:{' '}
                <span className="font-light">{address?.address2}</span>
              </Label>
            )}
            {address?.zipcode && (
              <Label>
                {tContacts('common.address.zip_code')}:{' '}
                <span className="font-light">{address?.zipcode}</span>
              </Label>
            )}
            {address?.region && (
              <Label>
                {tContacts('common.address.region')}:{' '}
                <span className="font-light">{address?.region}</span>
              </Label>
            )}
            {address?.country && (
              <Label>
                {tContacts('common.address.country')}:{' '}
                <span className="font-light">
                  {address?.country?.alpha2Code && tCountry(address?.country?.alpha2Code)}
                </span>
              </Label>
            )}
          </div>
        </>
      )}
    </div>
  );
};
