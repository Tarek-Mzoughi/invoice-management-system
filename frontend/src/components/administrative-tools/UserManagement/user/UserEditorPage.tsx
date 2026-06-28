import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  FolderOpen,
  LayoutGrid,
  Minus,
  Package,
  Receipt,
  Users,
  Wallet,
  X
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { Spinner } from '@/components/shared/Spinner';
import { PasswordField } from '@/components/shared/form-builder/PasswordField';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { cn } from '@/lib/utils';
import {
  Cabinet,
  CabinetUserRoleType,
  CreateAbstractUserDto,
  ResponseUserDto,
  Role,
  UpdateAbstractUserDto
} from '@/types';
import { getErrorMessage } from '@/utils/errors';
import {
  resolvePermissionSelection,
  type ResolvePermissionSelectionResult
} from '@/features/rbac/permissionDependencies';

interface UserEditorPageProps {
  userId?: string;
}

type RoleMode = 'admin' | 'collaborator' | 'custom';

interface UserEditorFormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  cabinetIds: number[];
}

interface PermissionRowDefinition {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  actions: {
    read: string[];
    create: string[];
    update: string[];
    delete: string[];
  };
}

const fieldClassName =
  'h-8 rounded-sm border-input bg-background shadow-sm focus-visible:ring-primary/30';
const labelClassName = 'text-sm font-medium text-foreground';
const sectionTitleClassName = 'text-lg font-semibold text-foreground';

const EMPTY_FORM: UserEditorFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  cabinetIds: []
};

const ADMIN_ROLE_LABELS = ['admin', 'owner', 'proprietaire', 'propriétaire'];
const COLLABORATOR_ROLE_LABELS = ['standard-user', 'collaborator', 'collaborateur'];
const COLLABORATOR_READ_RESOURCE_KEYS = new Set([
  'dashboard',
  'enterprise',
  'selling_documents',
  'buying_documents',
  'payments',
  'suppliers',
  'clients',
  'products',
  'treasury',
  'price_lists',
  'taxes',
  'document_settings'
]);
const COLLABORATOR_WRITE_RESOURCE_KEYS = new Set([
  'selling_documents',
  'buying_documents',
  'payments',
  'suppliers',
  'clients',
  'products',
  'price_lists'
]);
const OBSOLETE_PERMISSION_IDS = new Set([
  'read-user_management',
  'create-user_management',
  'update-user_management',
  'delete-user_management'
]);

const getTranslatedLabel = (
  translate: ReturnType<typeof useTranslation>['t'],
  key: string,
  fallback: string
) => {
  const value = translate(key);
  return value === key ? fallback : value;
};

const FormField = ({
  children,
  className,
  label,
  required
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
  required?: boolean;
}) => (
  <div className={cn('space-y-2', className)}>
    <Label className={labelClassName}>
      {label}
      {required ? ' (*)' : ''}
    </Label>
    {children}
  </div>
);

const normalizeRoleLabel = (role?: Role | null) => (role?.label || '').trim().toLowerCase();

const isAdminRole = (role?: Role | null) => ADMIN_ROLE_LABELS.includes(normalizeRoleLabel(role));

const isCollaboratorRole = (role?: Role | null) =>
  COLLABORATOR_ROLE_LABELS.includes(normalizeRoleLabel(role));

const extractPermissionIds = (role?: Role | null) =>
  (role?.permissions || [])
    .map((permission) => permission.permissionId)
    .filter(Boolean) as string[];

const getCanonicalPermissionId = (permissionIds: string[]) => permissionIds[0];

const hasAnyPermissionId = (selectedPermissionIds: string[], permissionIds: string[]) =>
  permissionIds.some((permissionId) => selectedPermissionIds.includes(permissionId));

const getRoleMode = (role?: Role | null): RoleMode => {
  if (isAdminRole(role)) return 'admin';
  if (isCollaboratorRole(role)) return 'collaborator';
  return 'custom';
};

const roleModeToRoleType = (roleMode: RoleMode): CabinetUserRoleType => {
  if (roleMode === 'admin') return 'ADMIN';
  if (roleMode === 'collaborator') return 'COLLABORATOR';
  return 'CUSTOM';
};

const roleTypeToRoleMode = (roleType?: CabinetUserRoleType | null): RoleMode | null => {
  if (roleType === 'ADMIN') return 'admin';
  if (roleType === 'COLLABORATOR') return 'collaborator';
  if (roleType === 'CUSTOM') return 'custom';
  return null;
};

const buildPermissionIds = (
  action: 'read' | 'create' | 'update' | 'delete',
  entity: string,
  legacyEntities: string[] = []
) =>
  Array.from(
    new Set([`${action}-${entity}`, ...legacyEntities.map((legacyEntity) => `${action}-${legacyEntity}`)])
  );

const buildPermissionRows = (
  tSettings: ReturnType<typeof useTranslation>['t']
): PermissionRowDefinition[] => [
  {
    key: 'dashboard',
    label: tSettings('users.permission_resources.dashboard'),
    icon: LayoutGrid,
    actions: {
      read: buildPermissionIds('read', 'dashboard'),
      create: [],
      update: [],
      delete: []
    }
  },
  {
    key: 'enterprise',
    label: tSettings('users.permission_resources.enterprise'),
    icon: Building2,
    actions: {
      read: buildPermissionIds('read', 'enterprise', ['profile', 'firm']),
      create: buildPermissionIds('create', 'enterprise', ['firm']),
      update: buildPermissionIds('update', 'enterprise', ['profile', 'firm']),
      delete: buildPermissionIds('delete', 'enterprise', ['firm'])
    }
  },
  {
    key: 'selling_documents',
    label: tSettings('users.permission_resources.selling_documents'),
    icon: Receipt,
    actions: {
      read: buildPermissionIds('read', 'selling_documents', [
        'invoice',
        'quotation',
        'selling_invoice',
        'selling_quotation'
      ]),
      create: buildPermissionIds('create', 'selling_documents', [
        'invoice',
        'quotation',
        'selling_invoice',
        'selling_quotation'
      ]),
      update: buildPermissionIds('update', 'selling_documents', [
        'invoice',
        'quotation',
        'selling_invoice',
        'selling_quotation'
      ]),
      delete: buildPermissionIds('delete', 'selling_documents', [
        'invoice',
        'quotation',
        'selling_invoice',
        'selling_quotation'
      ])
    }
  },
  {
    key: 'buying_documents',
    label: tSettings('users.permission_resources.buying_documents'),
    icon: Receipt,
    actions: {
      read: buildPermissionIds('read', 'buying_documents'),
      create: buildPermissionIds('create', 'buying_documents'),
      update: buildPermissionIds('update', 'buying_documents'),
      delete: buildPermissionIds('delete', 'buying_documents')
    }
  },
  {
    key: 'payments',
    label: tSettings('users.permission_resources.payments'),
    icon: Wallet,
    actions: {
      read: buildPermissionIds('read', 'payments', ['payment', 'selling_payment']),
      create: buildPermissionIds('create', 'payments', ['payment', 'selling_payment']),
      update: buildPermissionIds('update', 'payments', ['payment', 'selling_payment']),
      delete: buildPermissionIds('delete', 'payments', ['payment', 'selling_payment'])
    }
  },
  {
    key: 'suppliers',
    label: tSettings('users.permission_resources.suppliers'),
    icon: BriefcaseBusiness,
    actions: {
      read: buildPermissionIds('read', 'suppliers'),
      create: buildPermissionIds('create', 'suppliers'),
      update: buildPermissionIds('update', 'suppliers'),
      delete: buildPermissionIds('delete', 'suppliers')
    }
  },
  {
    key: 'clients',
    label: tSettings('users.permission_resources.clients'),
    icon: Users,
    actions: {
      read: buildPermissionIds('read', 'clients'),
      create: buildPermissionIds('create', 'clients'),
      update: buildPermissionIds('update', 'clients'),
      delete: buildPermissionIds('delete', 'clients')
    }
  },
  {
    key: 'products',
    label: tSettings('users.permission_resources.products'),
    icon: Package,
    actions: {
      read: buildPermissionIds('read', 'products'),
      create: buildPermissionIds('create', 'products'),
      update: buildPermissionIds('update', 'products'),
      delete: buildPermissionIds('delete', 'products')
    }
  },
  {
    key: 'treasury',
    label: tSettings('users.permission_resources.treasury'),
    icon: Wallet,
    actions: {
      read: buildPermissionIds('read', 'treasury'),
      create: buildPermissionIds('create', 'treasury'),
      update: buildPermissionIds('update', 'treasury'),
      delete: buildPermissionIds('delete', 'treasury')
    }
  },
  {
    key: 'price_lists',
    label: tSettings('users.permission_resources.price_lists'),
    icon: Receipt,
    actions: {
      read: buildPermissionIds('read', 'price_lists'),
      create: buildPermissionIds('create', 'price_lists'),
      update: buildPermissionIds('update', 'price_lists'),
      delete: buildPermissionIds('delete', 'price_lists')
    }
  },
  {
    key: 'taxes',
    label: tSettings('users.permission_resources.taxes'),
    icon: Receipt,
    actions: {
      read: buildPermissionIds('read', 'taxes', ['tax', 'tax_withholding']),
      create: buildPermissionIds('create', 'taxes', ['tax', 'tax_withholding']),
      update: buildPermissionIds('update', 'taxes', ['tax', 'tax_withholding']),
      delete: buildPermissionIds('delete', 'taxes', ['tax', 'tax_withholding'])
    }
  },
  {
    key: 'document_settings',
    label: tSettings('users.permission_resources.document_settings'),
    icon: FolderOpen,
    actions: {
      read: buildPermissionIds('read', 'document_settings', [
        'template',
        'sequential',
        'default_condition',
        'payment_condition'
      ]),
      create: buildPermissionIds('create', 'document_settings', [
        'template',
        'sequential',
        'default_condition',
        'payment_condition'
      ]),
      update: buildPermissionIds('update', 'document_settings', [
        'template',
        'sequential',
        'default_condition',
        'payment_condition'
      ]),
      delete: buildPermissionIds('delete', 'document_settings', [
        'template',
        'sequential',
        'default_condition',
        'payment_condition'
      ])
    }
  }
];

const getCollaboratorPresetPermissionIds = (rows: PermissionRowDefinition[]) =>
  Array.from(
    new Set(
      rows.flatMap((row) => [
        ...(COLLABORATOR_READ_RESOURCE_KEYS.has(row.key)
          ? [getCanonicalPermissionId(row.actions.read)]
          : []),
        ...(COLLABORATOR_WRITE_RESOURCE_KEYS.has(row.key)
          ? [getCanonicalPermissionId(row.actions.create)]
          : []),
        ...(COLLABORATOR_WRITE_RESOURCE_KEYS.has(row.key)
          ? [getCanonicalPermissionId(row.actions.update)]
          : [])
      ])
    )
  ).filter(Boolean) as string[];

const normalizePermissionSelection = (
  permissionIds: string[],
  rows: PermissionRowDefinition[]
) => {
  const normalizedPermissionIds = new Set<string>();

  rows.forEach((row) => {
    (['read', 'create', 'update', 'delete'] as const).forEach((action) => {
      const actionPermissionIds = row.actions[action];
      if (hasAnyPermissionId(permissionIds, actionPermissionIds)) {
        const canonicalPermissionId = getCanonicalPermissionId(actionPermissionIds);
        if (canonicalPermissionId) {
          normalizedPermissionIds.add(canonicalPermissionId);
        }
      }
    });
  });

  permissionIds.forEach((permissionId) => {
    const isKnownPermission = rows.some((row) =>
      (['read', 'create', 'update', 'delete'] as const).some((action) =>
        row.actions[action].includes(permissionId)
      )
    );

    if (!isKnownPermission && !OBSOLETE_PERMISSION_IDS.has(permissionId)) {
      normalizedPermissionIds.add(permissionId);
    }
  });

  return Array.from(normalizedPermissionIds);
};

const buildUserSyncSignature = (user?: ResponseUserDto) =>
  user
    ? JSON.stringify({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.profile?.phone || '',
        roleType: user.roleType,
        roleLabel: user.role?.label,
        permissionIds: user.permissions || user.effectivePermissions || extractPermissionIds(user.role),
        cabinetIds: (user.cabinets || []).map((cabinet) => cabinet.id).filter(Boolean)
      })
    : '';

const CabinetMultiSelect = ({
  cabinets,
  disabled,
  multiple = true,
  value,
  onChange
}: {
  cabinets: Cabinet[];
  disabled?: boolean;
  multiple?: boolean;
  value: number[];
  onChange: (value: number[]) => void;
}) => {
  const { t: tSettings } = useTranslation('settings');
  const selectedCabinets = cabinets.filter((cabinet) => cabinet.id && value.includes(cabinet.id));
  const triggerLabel =
    selectedCabinets.length === 0
      ? getTranslatedLabel(
          tSettings,
          multiple
            ? 'users.placeholders.select_enterprises'
            : 'users.placeholders.select_enterprise',
          multiple
            ? 'Sélectionnez une ou plusieurs entreprises'
            : 'Sélectionnez une entreprise'
        )
      : selectedCabinets.length === 1
        ? selectedCabinets[0]?.enterpriseName
        : `${selectedCabinets[0]?.enterpriseName} +${selectedCabinets.length - 1}`;

  const toggleCabinet = (cabinetId?: number) => {
    if (!cabinetId) return;

    const nextValue = multiple
      ? value.includes(cabinetId)
        ? value.filter((currentCabinetId) => currentCabinetId !== cabinetId)
        : [...value, cabinetId]
      : value.includes(cabinetId)
        ? []
        : [cabinetId];

    onChange(nextValue);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(fieldClassName, 'w-full justify-between px-3 text-left font-normal')}
          disabled={disabled}>
          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm text-foreground">
              {triggerLabel}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[360px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={getTranslatedLabel(
              tSettings,
              'users.placeholders.search_enterprise',
              'Rechercher une entreprise'
            )}
          />
          <CommandList>
            <CommandEmpty>
              {getTranslatedLabel(
                tSettings,
                'users.placeholders.no_enterprise',
                'Aucune entreprise trouvée'
              )}
            </CommandEmpty>
            <CommandGroup>
              {cabinets.map((cabinet) => {
                const isSelected = Boolean(cabinet.id && value.includes(cabinet.id));

                return (
                  <CommandItem key={cabinet.id} onSelect={() => toggleCabinet(cabinet.id)}>
                    <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{cabinet.enterpriseName}</span>
                    <Check className={cn('h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const PermissionToggle = ({
  checked,
  disabled,
  indeterminate,
  onClick
}: {
  checked: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  onClick?: () => void;
}) => (
  <Button
    type="button"
    variant="outline"
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'h-8 w-8 rounded-sm border p-0 shadow-none',
      checked || indeterminate
        ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
        : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    )}>
    {indeterminate ? (
      <Minus className="h-4 w-4" />
    ) : checked ? (
      <Check className="h-4 w-4" />
    ) : (
      <X className="h-4 w-4" />
    )}
  </Button>
);

export const UserEditorPage: React.FC<UserEditorPageProps> = ({ userId }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const { setRoutes } = useBreadcrumb();
  const isEditMode = Boolean(userId);

  const [form, setForm] = React.useState<UserEditorFormState>(EMPTY_FORM);
  const [roleMode, setRoleMode] = React.useState<RoleMode>('collaborator');
  const [showPermissions, setShowPermissions] = React.useState(true);
  const [selectedPermissionIds, setSelectedPermissionIds] = React.useState<string[]>([]);
  const [permissionCabinetId, setPermissionCabinetId] = React.useState<number | undefined>(undefined);
  const isAdminRoleMode = roleMode === 'admin';

  React.useEffect(() => {
    setRoutes?.([
      { title: tCommon('menu.settings'), href: '/settings' },
      { title: tSettings('home.sections.admin_tools') },
      { title: tSettings('user_management.singular') },
      { title: isEditMode ? tSettings('users.actions.edit_user') : tSettings('users.actions.new_user') }
    ]);
  }, [router.locale, isEditMode]);

  const { data: cabinets = [], isFetching: isCabinetsPending } = useQuery({
    queryKey: ['cabinets', 'all'],
    queryFn: () => api.cabinet.findAll()
  });

  const { data: user, isFetching: isUserPending } = useQuery({
    queryKey: ['user', userId],
    enabled: Boolean(userId),
    queryFn: () => api.user.findById(userId)
  });
  const isProtectedPrincipalAdmin = Boolean(user?.isCabinetPrincipalAdmin);

  const userSyncSignature = React.useMemo(() => buildUserSyncSignature(user), [user]);

  const permissionRows = React.useMemo(() => buildPermissionRows(tSettings), [tSettings]);
  React.useEffect(() => {
    if (!user) return;

    const nextRoleMode = roleTypeToRoleMode(user.roleType) || getRoleMode(user.role);
    const nextCabinetIds =
      user.cabinets?.map((cabinet) => cabinet.id).filter((cabinetId): cabinetId is number => Boolean(cabinetId)) ||
      [];

    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      password: '',
      phone: user.profile?.phone || '',
      cabinetIds: nextRoleMode === 'admin' ? nextCabinetIds : nextCabinetIds.slice(0, 1)
    });
    setRoleMode(nextRoleMode);
    setShowPermissions(true);
    setSelectedPermissionIds(
      normalizePermissionSelection(
        user.permissions || user.effectivePermissions || extractPermissionIds(user.role),
        permissionRows
      )
    );
    setPermissionCabinetId(nextCabinetIds[0]);
  }, [permissionRows, user, userSyncSignature]);

  const availableCabinets = React.useMemo(() => {
    const mergedCabinets = [...cabinets, ...(user?.cabinets || [])];
    const cabinetsById = new Map<number, Cabinet>();

    mergedCabinets.forEach((cabinet) => {
      if (cabinet?.id) {
        cabinetsById.set(cabinet.id, cabinet);
      }
    });

    return Array.from(cabinetsById.values());
  }, [cabinets, user?.cabinets]);
  const selectedCabinets = React.useMemo(
    () =>
      availableCabinets.filter(
        (cabinet) => cabinet.id && form.cabinetIds.includes(cabinet.id)
      ),
    [availableCabinets, form.cabinetIds]
  );

  const allAvailablePermissionIds = React.useMemo(
    () =>
      Array.from(
        new Set(
          permissionRows.flatMap((row) =>
            [
              getCanonicalPermissionId(row.actions.read),
              getCanonicalPermissionId(row.actions.create),
              getCanonicalPermissionId(row.actions.update),
              getCanonicalPermissionId(row.actions.delete)
            ].filter(Boolean)
          )
        )
      ),
    [permissionRows]
  );

  React.useEffect(() => {
    if (selectedCabinets.length === 0) {
      setPermissionCabinetId(undefined);
      return;
    }

    if (
      !permissionCabinetId ||
      !selectedCabinets.some((cabinet) => cabinet.id === permissionCabinetId)
    ) {
      setPermissionCabinetId(selectedCabinets[0]?.id);
    }
  }, [selectedCabinets, permissionCabinetId]);

  const loading = isCabinetsPending || (isEditMode && isUserPending);

  const updateField = <T extends keyof UserEditorFormState>(field: T, value: UserEditorFormState[T]) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const isCellChecked = React.useCallback(
    (permissionIds: string[]) =>
      permissionIds.length > 0 && hasAnyPermissionId(selectedPermissionIds, permissionIds),
    [selectedPermissionIds]
  );

  const switchToCustomRoleForManualPermissions = () => {
    if (roleMode !== 'custom') {
      setRoleMode('custom');
      setShowPermissions(true);
    }
  };

  const commitPermissionSelection = (permissionIds: string[]) => {
    setSelectedPermissionIds(normalizePermissionSelection(permissionIds, permissionRows));
    switchToCustomRoleForManualPermissions();
  };

  const getRowPermissionIds = (row: PermissionRowDefinition) =>
    (['read', 'create', 'update', 'delete'] as const)
      .map((action) => getCanonicalPermissionId(row.actions[action]))
      .filter(Boolean) as string[];

  const togglePermissionAction = (
    row: PermissionRowDefinition,
    action: 'read' | 'create' | 'update' | 'delete'
  ) => {
    if (roleMode !== 'custom') return;

    const permissionId = getCanonicalPermissionId(row.actions[action]);
    if (!permissionId) return;

    const result = resolvePermissionSelection({
      selectedPermissions: selectedPermissionIds,
      toggledPermission: permissionId,
      checked: !selectedPermissionIds.includes(permissionId)
    });

    commitPermissionSelection(result.nextPermissions);
  };

  const togglePermissionModule = (row: PermissionRowDefinition) => {
    if (roleMode !== 'custom') return;

    const rowPermissionIds = getRowPermissionIds(row);
    const areAllEnabled = rowPermissionIds.every((permissionId) =>
      selectedPermissionIds.includes(permissionId)
    );
    const permissionIdsToToggle = areAllEnabled ? [...rowPermissionIds].reverse() : rowPermissionIds;
    const aggregateResult: ResolvePermissionSelectionResult = {
      nextPermissions: selectedPermissionIds,
      autoAddedRequiredPermissions: [],
      blockedRemovedPermissions: [],
      suggestedOptionalPermissions: [],
      warnings: []
    };

    permissionIdsToToggle.forEach((permissionId) => {
      const isPermissionEnabled = aggregateResult.nextPermissions.includes(permissionId);
      if (areAllEnabled ? !isPermissionEnabled : isPermissionEnabled) return;

      const result = resolvePermissionSelection({
        selectedPermissions: aggregateResult.nextPermissions,
        toggledPermission: permissionId,
        checked: !areAllEnabled
      });

      aggregateResult.nextPermissions = result.nextPermissions;
      aggregateResult.autoAddedRequiredPermissions = Array.from(
        new Set([
          ...aggregateResult.autoAddedRequiredPermissions,
          ...result.autoAddedRequiredPermissions
        ])
      );
      aggregateResult.blockedRemovedPermissions = Array.from(
        new Set([
          ...aggregateResult.blockedRemovedPermissions,
          ...result.blockedRemovedPermissions
        ])
      );
      aggregateResult.suggestedOptionalPermissions = Array.from(
        new Set([
          ...aggregateResult.suggestedOptionalPermissions,
          ...result.suggestedOptionalPermissions
        ])
      );
      aggregateResult.warnings = Array.from(new Set([...aggregateResult.warnings, ...result.warnings]));
    });

    commitPermissionSelection(aggregateResult.nextPermissions);
  };

  const handleRoleModeChange = (nextRoleMode: RoleMode) => {
    setRoleMode(nextRoleMode);
    setShowPermissions(true);

    if (nextRoleMode !== 'admin') {
      setForm((currentForm) => ({
        ...currentForm,
        cabinetIds: currentForm.cabinetIds.slice(0, 1)
      }));
    }

    if (nextRoleMode === 'admin') {
      setSelectedPermissionIds(allAvailablePermissionIds);
      return;
    }

    if (nextRoleMode === 'collaborator') {
      setSelectedPermissionIds(getCollaboratorPresetPermissionIds(permissionRows));
      return;
    }

    setSelectedPermissionIds((currentPermissions) => currentPermissions);
  };

  const validate = () => {
    if (!form.firstName.trim()) return tSettings('users.validation.first_name_required');
    if (!form.lastName.trim()) return tSettings('users.validation.last_name_required');

    const email = form.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return tSettings('users.validation.invalid_email');

    if (form.password.trim() && form.password.trim().length < 8) {
      return tSettings('users.validation.password_min_length');
    }

    if (form.cabinetIds.length === 0) {
      return tSettings('users.validation.enterprise_required');
    }

    if (roleMode !== 'admin' && form.cabinetIds.length > 1) {
      return tSettings('users.validation.single_enterprise_required');
    }

    return null;
  };

  const { mutate: saveUser, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        roleType: roleModeToRoleType(roleMode),
        permissionIds: roleMode === 'custom' ? selectedPermissionIds : undefined,
        cabinetIds: form.cabinetIds,
        isActive: true,
        isApproved: true,
        profile: form.phone.trim()
          ? {
              phone: form.phone.trim()
            }
          : undefined,
        ...(form.password.trim() ? { password: form.password.trim() } : {})
      } satisfies Partial<CreateAbstractUserDto & UpdateAbstractUserDto>;

      if (isEditMode && userId) {
        return api.user.update(userId, payload as UpdateAbstractUserDto);
      }

      return api.user.create(payload as CreateAbstractUserDto);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['user', userId] });
      toast.success(
        isEditMode
          ? tSettings('users.messages.update_success')
          : tSettings('users.messages.create_success')
      );
      router.push('/settings/admin/users');
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          'settings',
          error,
          isEditMode
            ? tSettings('users.messages.update_error')
            : tSettings('users.messages.create_error')
        )
      );
    }
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationMessage = validate();
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    saveUser();
  };

  const handleToggleAllPermissions = () => {
    if (roleMode !== 'custom') return;
    const areAllEnabled = allAvailablePermissionIds.every((permissionId) =>
      selectedPermissionIds.includes(permissionId)
    );
    commitPermissionSelection(areAllEnabled ? [] : allAvailablePermissionIds);
  };

  const isAdminMatrixRowChecked = React.useCallback(
    (_row: PermissionRowDefinition, action: 'read' | 'create' | 'update' | 'delete' | 'all') =>
      Boolean(action),
    []
  );

  const isCustomMatrixRowChecked = React.useCallback(
    (row: PermissionRowDefinition, action: 'read' | 'create' | 'update' | 'delete' | 'all') => {
      if (action === 'all') {
        return getRowPermissionIds(row).every((permissionId) =>
          selectedPermissionIds.includes(permissionId)
        );
      }

      return isCellChecked(row.actions[action]);
    },
    [isCellChecked, selectedPermissionIds]
  );

  if (loading && !user && isEditMode) {
    return <Spinner className="h-full min-h-[360px]" show />;
  }

  return (
    <div className="flex-1 overflow-auto py-6">
      <div className="flex flex-col gap-5 pb-8">
        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-sm px-4"
            onClick={() => router.push('/settings/admin/users')}>
            <ArrowLeft className="h-4 w-4" />
            {tCommon('commands.back')}
          </Button>

          <Button type="submit" form="user-editor-form" className="h-9 rounded-sm px-4" disabled={isSaving}>
            {isEditMode ? tCommon('commands.save') : tCommon('commands.create')}
            <Spinner className="ml-2" size="small" show={isSaving} />
          </Button>
        </div>

        <Card className="rounded-md border-border bg-card shadow-sm">
          <CardContent className="p-0">
            <form id="user-editor-form" onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
              <div className="space-y-4 rounded-md border border-border bg-background p-5">
                <h2 className={sectionTitleClassName}>{tSettings('users.sections.basic_information')}</h2>

                <div className="grid gap-4 lg:grid-cols-2">
                  <FormField label={tSettings('users.attributes.first_name')} required>
                    <Input
                      className={fieldClassName}
                      value={form.firstName}
                      placeholder={tSettings('users.placeholders.first_name')}
                      onChange={(event) => updateField('firstName', event.target.value)}
                    />
                  </FormField>

                  <FormField label={tSettings('users.attributes.last_name')} required>
                    <Input
                      className={fieldClassName}
                      value={form.lastName}
                      placeholder={tSettings('users.placeholders.last_name')}
                      onChange={(event) => updateField('lastName', event.target.value)}
                    />
                  </FormField>

                  <FormField className="lg:col-span-2" label={tSettings('users.attributes.email')} required>
                    <Input
                      className={fieldClassName}
                      value={form.email}
                      placeholder={tSettings('users.placeholders.email')}
                      onChange={(event) => updateField('email', event.target.value)}
                    />
                  </FormField>

                  <FormField className="lg:col-span-2" label={tSettings('users.attributes.password')}>
                    <PasswordField
                      className="w-full"
                      value={form.password}
                      placeholder={tSettings('users.placeholders.password')}
                      onChange={(event) => updateField('password', event.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      {tSettings('users.hints.password')}
                    </p>
                  </FormField>

                  <FormField className="lg:col-span-2" label={tSettings('users.attributes.phone')}>
                    <PhoneInput
                      className="w-full"
                      value={form.phone}
                      onChange={(value) => updateField('phone', value || '')}
                    />
                  </FormField>

                </div>

                <Separator />

                <div className="space-y-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className={sectionTitleClassName}>{tSettings('users.sections.user_role')}</h2>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 rounded-sm px-4"
                      onClick={() => setShowPermissions((currentValue) => !currentValue)}>
                      {showPermissions
                        ? tSettings('users.actions.hide_permissions')
                        : tSettings('users.actions.show_permissions')}
                    </Button>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-3">
                    {[
                      {
                        mode: 'admin' as const,
                        title: tSettings('users.role_cards.admin.title'),
                        description: tSettings('users.role_cards.admin.description')
                      },
                      {
                        mode: 'collaborator' as const,
                        title: tSettings('users.role_cards.collaborator.title'),
                        description: tSettings('users.role_cards.collaborator.description')
                      },
                      {
                        mode: 'custom' as const,
                        title: tSettings('users.role_cards.custom.title'),
                        description: tSettings('users.role_cards.custom.description')
                      }
                    ].map((card) => {
                      const isSelected = roleMode === card.mode;

                      return (
                        <button
                          key={card.mode}
                          type="button"
                          disabled={isProtectedPrincipalAdmin}
                          onClick={() => handleRoleModeChange(card.mode)}
                          className={cn(
                            'flex min-h-[58px] flex-col items-center justify-center rounded-sm border px-4 py-2.5 text-center transition',
                            isSelected
                              ? 'border-primary bg-primary/10 shadow-sm'
                              : 'border-border bg-card hover:border-primary/30 hover:bg-accent/30',
                            isProtectedPrincipalAdmin && 'cursor-not-allowed opacity-70'
                          )}>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-foreground">
                              {card.title}
                            </span>
                            {isSelected ? <CheckCircle2 className="h-4 w-4 text-primary" /> : null}
                          </div>
                          <span className="mt-1 text-xs text-muted-foreground">
                            {card.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {showPermissions ? (
                  <>
                    <Separator />

                    <div className="space-y-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1">
                          <h2 className={sectionTitleClassName}>
                            {tSettings('users.sections.permissions')}
                          </h2>
                          {isAdminRoleMode ? (
                            <p className="text-sm text-muted-foreground">
                              {tSettings(
                                'users.messages.admin_permissions_locked',
                                'Un administrateur possède automatiquement toutes les permissions du cabinet.'
                              )}
                            </p>
                          ) : null}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 rounded-sm px-4"
                          disabled={roleMode !== 'custom' || isProtectedPrincipalAdmin}
                          onClick={handleToggleAllPermissions}>
                          {tSettings('users.actions.select_all')}
                        </Button>
                      </div>

                      {roleMode === 'custom' && (
                        <div className="rounded-sm border border-primary/20 bg-primary/10 p-3">
                          <p className="text-xs text-primary">
                            {tSettings(
                              'rbac.contextualPermissionsInfo',
                              'Certaines données nécessaires seront accessibles uniquement dans le contexte de ce module.'
                            )}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className={labelClassName}>
                          {getTranslatedLabel(
                            tSettings,
                            'users.permissions.enterprise_selector',
                            'Sélectionner une Entreprise'
                          )}
                        </Label>
                        <div className="max-w-[360px]">
                          <CabinetMultiSelect
                            cabinets={availableCabinets}
                            multiple={isAdminRoleMode}
                            disabled={isProtectedPrincipalAdmin}
                            value={form.cabinetIds}
                            onChange={(value) => {
                              updateField('cabinetIds', isAdminRoleMode ? value : value.slice(0, 1));
                              setPermissionCabinetId(value[0]);
                            }}
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-sm border border-border">
                        <table className="w-full min-w-[860px]">
                          <thead className="border-b border-border bg-muted/60">
                            <tr className="text-left text-sm font-medium text-muted-foreground">
                              <th className="px-3 py-2.5">{tSettings('users.permissions.columns.resource')}</th>
                              <th className="px-3 py-2.5 text-center">{tSettings('users.permissions.columns.read')}</th>
                              <th className="px-3 py-2.5 text-center">{tSettings('users.permissions.columns.create')}</th>
                              <th className="px-3 py-2.5 text-center">{tSettings('users.permissions.columns.update')}</th>
                              <th className="px-3 py-2.5 text-center">
                                <span className="inline-flex rounded-sm bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground">
                                  {tSettings('users.permissions.columns.delete')}
                                </span>
                              </th>
                              <th className="px-3 py-2.5 text-center">
                                <span className="inline-flex rounded-sm bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                                  {tSettings('users.permissions.columns.all')}
                                </span>
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {permissionRows.map((row) => {
                              const Icon = row.icon;
                              const rowPermissionIds = getRowPermissionIds(row);
                              const selectedRowPermissionCount = rowPermissionIds.filter(
                                (permissionId) => selectedPermissionIds.includes(permissionId)
                              ).length;
                              const isRowIndeterminate =
                                selectedRowPermissionCount > 0 &&
                                selectedRowPermissionCount < rowPermissionIds.length;
                              const isReadChecked =
                                roleMode === 'admin' ||
                                isCustomMatrixRowChecked(row, 'read');

                              return (
                                <tr
                                  key={row.key}
                                  className="border-b border-border last:border-b-0">
                                  <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-3">
                                      <span className="text-muted-foreground">
                                        <Icon className="h-4 w-4" />
                                      </span>
                                      <span className="text-sm font-medium text-foreground">
                                        {row.label}
                                      </span>
                                    </div>
                                  </td>
                                  {(['read', 'create', 'update', 'delete'] as const).map((action) => (
                                    <td key={action} className="px-3 py-2 text-center">
                                      <PermissionToggle
                                        checked={
                                          roleMode === 'admin'
                                            ? isAdminMatrixRowChecked(row, action)
                                            : isCustomMatrixRowChecked(row, action)
                                        }
                                        disabled={
                                          row.actions[action].length === 0 ||
                                          roleMode !== 'custom' ||
                                          isProtectedPrincipalAdmin ||
                                          (action !== 'read' && !isReadChecked)
                                        }
                                        onClick={() => togglePermissionAction(row, action)}
                                      />
                                    </td>
                                  ))}
                                  <td className="px-3 py-2 text-center">
                                    <PermissionToggle
                                      checked={
                                        roleMode === 'admin'
                                          ? isAdminMatrixRowChecked(row, 'all')
                                          : isCustomMatrixRowChecked(row, 'all')
                                      }
                                      indeterminate={roleMode !== 'admin' ? isRowIndeterminate : false}
                                      disabled={roleMode !== 'custom' || isProtectedPrincipalAdmin}
                                      onClick={() => togglePermissionModule(row)}
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
