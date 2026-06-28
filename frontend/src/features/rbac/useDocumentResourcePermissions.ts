import { useMemo } from 'react';
import { ACTIVITY_TYPE } from '@/types/enums/activity-type';
import { PERMISSIONS } from './permissions';
import { useCurrentPermissions } from './usePermissions';

export type DocumentResourceActivityType = ACTIVITY_TYPE | 'selling' | 'buying' | null | undefined;
export type DocumentResourceScope = 'selling' | 'buying';
export type DocumentResourceAction = 'read' | 'create' | 'update';

const OPTIONAL_DOCUMENT_PERMISSIONS = [
  PERMISSIONS.taxes.read,
  PERMISSIONS.treasury.read,
  PERMISSIONS.document_settings.read
] as const;

const normalizeActivityType = (
  activityType: DocumentResourceActivityType
): DocumentResourceScope | undefined => {
  const normalizedActivityType = String(activityType || '');

  if (normalizedActivityType === ACTIVITY_TYPE.SELLING) {
    return 'selling';
  }

  if (normalizedActivityType === ACTIVITY_TYPE.BUYING) {
    return 'buying';
  }

  return undefined;
};

export const useDocumentResourcePermissions = (
  activityType: DocumentResourceActivityType,
  action: DocumentResourceAction = 'read'
) => {
  const { isPending, hasEffectivePermission: hasPermission } = useCurrentPermissions();
  const scope = normalizeActivityType(activityType);

  const requiredPermissions = useMemo(() => {
    if (action === 'read') {
      return [];
    }

    if (scope === 'selling') {
      return [PERMISSIONS.selling_documents[action]];
    }

    if (scope === 'buying') {
      return [PERMISSIONS.buying_documents[action]];
    }

    return [];
  }, [action, scope]);

  const optionalPermissions = useMemo(() => [...OPTIONAL_DOCUMENT_PERMISSIONS], []);
  const readLookupsReady = Boolean(scope && !isPending);
  const canReadPartner = readLookupsReady;
  const canReadProducts = readLookupsReady;
  const canAccessDocumentAction = Boolean(
    scope &&
      (action === 'read' ||
      hasPermission(
        scope === 'selling' ? PERMISSIONS.selling_documents[action] : PERMISSIONS.buying_documents[action]
      ))
  );
  const canUsePartnerChoices = readLookupsReady;
  const canUseProductChoices = readLookupsReady;
  const canReadTaxes = !isPending;
  const canReadTreasury = !isPending;
  const canReadDocumentSettings = !isPending;

  const missingRequiredPermissions = useMemo(
    () =>
      isPending ? [] : requiredPermissions.filter((permission) => !hasPermission(permission)),
    [hasPermission, isPending, requiredPermissions]
  );
  const optionalUnavailablePermissions = useMemo(
    () =>
      isPending ? [] : optionalPermissions.filter((permission) => !hasPermission(permission)),
    [hasPermission, isPending, optionalPermissions]
  );

  return {
    canReadPartner,
    canReadProducts,
    canAccessDocumentAction,
    canUsePartnerChoices,
    canUseProductChoices,
    canReadTaxes,
    canReadTreasury,
    canReadDocumentSettings,
    missingRequiredPermissions,
    optionalUnavailablePermissions,
    isPending
  };
};
