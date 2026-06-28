import { useRoleManager } from './hooks/useRoleManager';
import { cn } from '@/lib/utils';
import { Permission } from '@/types/permission';
import React from 'react';
import { Toggle } from '@/components/ui/toggle';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { useTranslation } from 'react-i18next';
import { getPermissionTranslation } from '../permission/utils/getPermissionTranslation';
import { FormBuilder } from '@/components/shared/form-builder/FormBuilder';
import { useRoleFormStructure } from './useRoleFormStructure';

interface RoleFormProps {
  className?: string;
  permissions?: Permission[];
  loading?: boolean;
}

export const RoleForm: React.FC<RoleFormProps> = ({ className, permissions, loading }) => {
  const { t: tPermission } = useTranslation('permissions');
  const { t: tSettings } = useTranslation('settings');

  const roleManager = useRoleManager();

  const groupedPermissions = permissions?.reduce(
    (groups, permission) => {
      const [_, ...rest] = permission?.label?.split('_') || [];
      const entity = rest.join('_');
      if (!groups[entity]) {
        groups[entity] = [];
      }
      groups[entity].push(permission);
      return groups;
    },
    {} as Record<string, Permission[]>
  );

  const sortedGroupedPermissions = Object.entries(groupedPermissions || {})
    .sort(([entityA], [entityB]) => entityA.localeCompare(entityB))
    .reduce(
      (sortedGroups, [entity, permissions]) => {
        sortedGroups[entity] = permissions;
        return sortedGroups;
      },
      {} as Record<string, Permission[]>
    );

  const permissionFormFragment = React.useMemo(() => {
    return (
      <>
        <div className="rounded-sm border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs font-medium text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300">
          {tSettings(
            'rbac.contextualPermissionsInfo',
            'Certaines données nécessaires seront accessibles uniquement dans le contexte de ce module.'
          )}
        </div>
        {Object.entries(sortedGroupedPermissions).map(([entity, entityPermissions]) => (
          <Accordion type="multiple" key={entity} className="mt-0">
            <AccordionItem value={entity}>
              <AccordionTrigger className="text-sm font-extrabold">
                {tPermission(`${entity}.singular`)}
              </AccordionTrigger>
              <AccordionContent>
                <div key={entity}>
                  <div className="flex flex-wrap gap-2 my-2">
                    {entityPermissions.map((permission) => {
                      const isSelected = roleManager.isPermissionSelected(permission?.id);
                      return (
                        <Toggle
                          key={permission.id}
                          pressed={isSelected}
                          value={permission?.id?.toString()}
                          onPressedChange={(checked) => {
                            roleManager.resolvePermissionSelection({
                              permissionId: permission?.id,
                              checked,
                              availablePermissions: permissions || []
                            });
                          }}
                          className="border">
                          {tPermission(`${getPermissionTranslation(permission?.label)}.value`)}
                        </Toggle>
                      );
                    })}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </>
    );
  }, [
    permissions,
    roleManager,
    sortedGroupedPermissions,
    tPermission,
    tSettings
  ]);

  const { roleFormStructure } = useRoleFormStructure({
    roleManager,
    permissionFormFragment
  });

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <FormBuilder structure={roleFormStructure} />
    </div>
  );
};
