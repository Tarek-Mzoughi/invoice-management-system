import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';
import { UserService } from 'src/modules/user-management/services/user.service';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { PermissionsGuard } from './permissions.guard';

const buildContext = (
  userId = 'user-1',
  headers: Record<string, unknown> = {},
) =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: { sub: userId },
        headers,
      }),
    }),
  }) as any;

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;
  let userService: jest.Mocked<Pick<UserService, 'findOneById'>>;

  beforeEach(async () => {
    reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === REQUIRED_PERMISSIONS_KEY) {
          return {
            permissions: [PERMISSIONS.SELLING_DOCUMENTS.DELETE],
            mode: 'all',
          };
        }
        return false;
      }),
    } as any;
    userService = {
      findOneById: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        { provide: Reflector, useValue: reflector },
        { provide: UserService, useValue: userService },
      ],
    }).compile();

    guard = moduleRef.get(PermissionsGuard);
  });

  it('allows admin users regardless of explicit role permissions', async () => {
    userService.findOneById.mockResolvedValue({
      role: { label: 'admin', permissions: [] },
    } as any);

    await expect(guard.canActivate(buildContext())).resolves.toBe(true);
  });

  it('rejects collaborators missing the required permission', async () => {
    userService.findOneById.mockResolvedValue({
      role: {
        label: 'standard-user',
        permissions: [{ permissionId: PERMISSIONS.SELLING_DOCUMENTS.READ }],
      },
    } as any);

    await expect(guard.canActivate(buildContext())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows dashboard.read without an explicit dashboard permission', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRED_PERMISSIONS_KEY) {
        return {
          permissions: [PERMISSIONS.DASHBOARD.READ],
          mode: 'all',
        };
      }
      return false;
    });
    userService.findOneById.mockResolvedValue({
      role: {
        label: 'standard-user',
        permissions: [],
      },
    } as any);

    await expect(guard.canActivate(buildContext())).resolves.toBe(true);
  });

  it('allows products.read without an explicit products permission', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRED_PERMISSIONS_KEY) {
        return {
          permissions: [PERMISSIONS.PRODUCTS.READ],
          mode: 'all',
        };
      }
      return false;
    });
    userService.findOneById.mockResolvedValue({
      role: {
        label: 'standard-user',
        permissions: [],
      },
    } as any);

    await expect(guard.canActivate(buildContext())).resolves.toBe(true);
  });

  it('still rejects products.create without the action permission', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRED_PERMISSIONS_KEY) {
        return {
          permissions: [PERMISSIONS.PRODUCTS.CREATE],
          mode: 'all',
        };
      }
      return false;
    });
    userService.findOneById.mockResolvedValue({
      role: {
        label: 'standard-user',
        permissions: [],
      },
    } as any);

    await expect(guard.canActivate(buildContext())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows any-mode checks when one option is read', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRED_PERMISSIONS_KEY) {
        return {
          permissions: [
            PERMISSIONS.SELLING_DOCUMENTS.READ,
            PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
          ],
          mode: 'any',
        };
      }
      return false;
    });
    userService.findOneById.mockResolvedValue({
      role: {
        label: 'standard-user',
        permissions: [],
      },
    } as any);

    await expect(guard.canActivate(buildContext())).resolves.toBe(true);
  });

  it('rejects reads for an inaccessible cabinet context', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRED_PERMISSIONS_KEY) {
        return {
          permissions: [PERMISSIONS.DASHBOARD.READ],
          mode: 'all',
        };
      }
      return false;
    });
    userService.findOneById.mockResolvedValue({
      role: {
        label: 'standard-user',
        permissions: [],
      },
      cabinetMemberships: [
        {
          cabinetId: 1,
          isActive: true,
          roleType: 'CUSTOM',
          permissions: [],
        },
      ],
    } as any);

    await expect(
      guard.canActivate(buildContext('user-1', { 'x-cabinet-id': '2' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not allow obsolete user_management permissions to access admin routes', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRED_PERMISSIONS_KEY) {
        return {
          permissions: [],
          mode: 'admin',
        };
      }
      return false;
    });
    userService.findOneById.mockResolvedValue({
      role: {
        label: 'standard-user',
        permissions: [{ permissionId: 'read-user_management' }],
      },
      cabinetMemberships: [
        {
          isActive: true,
          roleType: 'CUSTOM',
          permissions: [{ permissionId: 'read-user_management' }],
        },
      ],
    } as any);

    await expect(guard.canActivate(buildContext())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows active admin cabinet memberships to access admin routes', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRED_PERMISSIONS_KEY) {
        return {
          permissions: [],
          mode: 'admin',
        };
      }
      return false;
    });
    userService.findOneById.mockResolvedValue({
      role: { label: 'standard-user', permissions: [] },
      cabinetMemberships: [
        {
          isActive: true,
          roleType: 'ADMIN',
          permissions: [],
        },
      ],
    } as any);

    await expect(guard.canActivate(buildContext())).resolves.toBe(true);
  });
});
