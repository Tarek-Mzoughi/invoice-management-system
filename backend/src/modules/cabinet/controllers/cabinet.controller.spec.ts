import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_KEY } from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';
import { CabinetController } from './cabinet.controller';

describe('CabinetController RBAC', () => {
  const cabinetService = {
    findOneById: jest.fn(),
    update: jest.fn(),
  };
  const userService = {
    findOneById: jest.fn(),
  };
  let controller: CabinetController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new CabinetController(
      cabinetService as any,
      userService as any,
    );
  });

  it('allows authenticated cabinet members to read their cabinet without enterprise permission', async () => {
    userService.findOneById.mockResolvedValue({
      id: 'user-1',
      role: { label: 'standard-user', permissions: [] },
      cabinets: [{ id: 8 }],
    });
    cabinetService.findOneById.mockResolvedValue({
      id: 8,
      enterpriseName: 'ZC',
    });

    await expect(
      controller.findOneById(8, { user: { sub: 'user-1' } } as any),
    ).resolves.toMatchObject({ id: 8 });
  });

  it('rejects cabinet reads outside the authenticated user cabinets', async () => {
    userService.findOneById.mockResolvedValue({
      id: 'user-1',
      role: { label: 'standard-user', permissions: [] },
      cabinets: [{ id: 8 }],
    });

    await expect(
      controller.findOneById(9, { user: { sub: 'user-1' } } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(cabinetService.findOneById).not.toHaveBeenCalled();
  });

  it('keeps cabinet update protected by update-enterprise', () => {
    const metadata = new Reflector().get(
      REQUIRED_PERMISSIONS_KEY,
      CabinetController.prototype.update,
    );

    expect(metadata).toMatchObject({
      permissions: [PERMISSIONS.ENTERPRISE.UPDATE],
      mode: 'all',
    });
  });
});
