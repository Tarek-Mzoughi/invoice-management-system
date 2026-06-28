import { BadRequestException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  DASHBOARD_DOCUMENT_TYPE,
  DASHBOARD_PERIOD,
} from './dto/dashboard-query.dto';

class FakeQueryBuilder {
  readonly wheres: string[] = [];
  readonly params: Record<string, unknown> = {};

  select() {
    return this;
  }

  addSelect() {
    return this;
  }

  leftJoin() {
    return this;
  }

  innerJoin() {
    return this;
  }

  where(condition: string, params?: Record<string, unknown>) {
    this.wheres.push(condition);
    Object.assign(this.params, params);
    return this;
  }

  andWhere(condition: string, params?: Record<string, unknown>) {
    this.wheres.push(condition);
    Object.assign(this.params, params);
    return this;
  }

  setParameters(params?: Record<string, unknown>) {
    Object.assign(this.params, params);
    return this;
  }

  groupBy() {
    return this;
  }

  addGroupBy() {
    return this;
  }

  orderBy() {
    return this;
  }

  limit() {
    return this;
  }

  having(condition: string, params?: Record<string, unknown>) {
    this.wheres.push(condition);
    Object.assign(this.params, params);
    return this;
  }

  async getRawOne() {
    return { total: '0', count: '0' };
  }

  async getRawMany() {
    return [];
  }
}

const createRepository = (builders: FakeQueryBuilder[]) => ({
  createQueryBuilder: () => {
    const builder = new FakeQueryBuilder();
    builders.push(builder);
    return builder;
  },
});

describe('DashboardService', () => {
  const buildService = () => {
    const builders: FakeQueryBuilder[] = [];
    const repository = () => createRepository(builders) as any;

    const service = new DashboardService(
      repository(),
      repository(),
      repository(),
      repository(),
      repository(),
      repository(),
      repository(),
      {
        getCurrentCabinetIdOrFail: jest.fn().mockResolvedValue(7),
      } as any,
      {
        findOneById: jest.fn().mockResolvedValue({
          id: 7,
          currencyId: 3,
          currency: {
            id: 3,
            code: 'TND',
            symbol: 'DT',
            digitAfterComma: 3,
          },
        }),
      } as any,
      {
        findOneById: jest.fn().mockImplementation((id: number) =>
          Promise.resolve({
            id,
            code: id === 4 ? 'EUR' : 'TND',
            symbol: id === 4 ? 'EUR' : 'DT',
            digitAfterComma: id === 4 ? 2 : 3,
          }),
        ),
      } as any,
      {} as any,
    );

    return { service, builders };
  };

  it('scopes dashboard aggregations to the authenticated cabinet', async () => {
    const { service, builders } = buildService();

    await service.getOverview(
      {
        period: DASHBOARD_PERIOD.CURRENT_YEAR,
        documentType: DASHBOARD_DOCUMENT_TYPE.ALL,
      },
      'user-1',
    );

    expect(builders.length).toBeGreaterThan(0);
    expect(builders.every((builder) => builder.params.cabinetId === 7)).toBe(
      true,
    );
  });

  it('does not filter by currency when no explicit currency is selected (uses cabinet currency for display only)', async () => {
    const { service, builders } = buildService();

    const overview = await service.getOverview(
      {
        period: DASHBOARD_PERIOD.LAST_30_DAYS,
        documentType: DASHBOARD_DOCUMENT_TYPE.ALL,
      },
      'user-1',
    );

    // Cabinet currency is still returned for display formatting
    expect(overview.meta.currency.id).toBe(3);
    // But no currency filter is applied to the queries
    expect(builders.some((builder) => builder.params.currencyId != null)).toBe(
      false,
    );
  });

  it('uses the requested currency filter without mixing cabinet currency totals', async () => {
    const { service, builders } = buildService();

    const overview = await service.getOverview(
      {
        period: DASHBOARD_PERIOD.LAST_30_DAYS,
        documentType: DASHBOARD_DOCUMENT_TYPE.ALL,
        currencyId: 4,
      },
      'user-1',
    );

    expect(overview.meta.currency.id).toBe(4);
    expect(builders.some((builder) => builder.params.currencyId === 4)).toBe(
      true,
    );
    expect(builders.some((builder) => builder.params.currencyId === 3)).toBe(
      false,
    );
  });

  it('rejects invalid custom date ranges', () => {
    const { service } = buildService();

    expect(() =>
      (service as any).resolveDateRange({
        period: DASHBOARD_PERIOD.CUSTOM,
        startDate: '2026-05-10',
        endDate: '2026-05-01',
      }),
    ).toThrow(BadRequestException);
  });
});
