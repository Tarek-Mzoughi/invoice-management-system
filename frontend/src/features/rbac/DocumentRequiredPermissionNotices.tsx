import { ACTIVITY_TYPE } from '@/types/enums/activity-type';
import { PermissionNotice } from './PermissionNotice';

type DocumentRequiredPermissionNoticesProps = {
  activityType: ACTIVITY_TYPE | 'selling' | 'buying';
  action?: 'read' | 'create' | 'update';
  canAccessDocumentAction: boolean;
  className?: string;
};

export const DocumentRequiredPermissionNotices = ({
  activityType,
  action = 'read',
  canAccessDocumentAction,
  className
}: DocumentRequiredPermissionNoticesProps) => {
  const normalizedActivityType = String(activityType || '');
  const isBuying = normalizedActivityType === ACTIVITY_TYPE.BUYING || normalizedActivityType === 'buying';
  const noticeKey = isBuying
    ? action === 'create'
      ? 'rbac.requiresBuyingDocumentsCreate'
      : action === 'update'
        ? 'rbac.requiresBuyingDocumentsUpdate'
        : 'rbac.requiresBuyingDocumentsRead'
    : action === 'create'
      ? 'rbac.requiresSellingDocumentsCreate'
      : action === 'update'
        ? 'rbac.requiresSellingDocumentsUpdate'
        : 'rbac.requiresSellingDocumentsRead';

  if (canAccessDocumentAction) return null;

  return (
    <div className={className}>
      <PermissionNotice tone="danger" i18nKey={noticeKey} />
    </div>
  );
};
