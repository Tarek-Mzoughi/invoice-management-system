import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { PERMISSIONS } from './permission.constants';

export const hasDocumentTransformationPermissions = (
  activityType: ACTIVITY_TYPE | string | undefined | null,
  permissionIds: string[],
  createsDocument: boolean = true,
): boolean => {
  const [updatePermission, createPermission] =
    activityType === ACTIVITY_TYPE.BUYING
      ? [
          PERMISSIONS.BUYING_DOCUMENTS.UPDATE,
          PERMISSIONS.BUYING_DOCUMENTS.CREATE,
        ]
      : [
          PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
          PERMISSIONS.SELLING_DOCUMENTS.CREATE,
        ];
  const requiredPermissions = createsDocument
    ? [updatePermission, createPermission]
    : [updatePermission];

  return requiredPermissions.every((permissionId) =>
    permissionIds.includes(permissionId),
  );
};
