import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(() => {
    service = new TenantContextService(
      {} as any,
      { get: () => undefined } as any,
    );
  });

  it('scopes an empty query to the cabinet', () => {
    expect(service.scopeQueryToCabinet({}, 42)).toEqual({
      filter: 'cabinetId||$eq||42',
    });
  });

  it('scopes a normal filter to the cabinet without mutating the input', () => {
    const query = {
      filter: 'name||$cont||acme',
      join: 'activity,currency',
      sort: 'name,ASC',
    };

    expect(service.scopeQueryToCabinet(query, 7)).toEqual({
      filter: 'name||$cont||acme;cabinetId||$eq||7',
      join: 'activity,currency',
      sort: 'name,ASC',
    });
    expect(query.filter).toBe('name||$cont||acme');
  });

  it('scopes every OR branch to the cabinet', () => {
    const scoped = service.scopeQueryToCabinet(
      {
        filter:
          'name||$cont||acme;entityType||$eq||clients||$or||taxIdNumber||$cont||123',
      },
      3,
    );

    expect(scoped.filter).toBe(
      'name||$cont||acme;entityType||$eq||clients;cabinetId||$eq||3||$or||taxIdNumber||$cont||123;cabinetId||$eq||3',
    );
  });

  it('overrides incoming cabinet filters with the authenticated cabinet', () => {
    const scoped = service.scopeQueryToCabinet(
      {
        filter:
          'cabinetId||$eq||1;name||$cont||acme||$or||taxIdNumber||$cont||123;cabinetId||$eq||99',
      },
      5,
    );

    expect(scoped.filter).toBe(
      'name||$cont||acme;cabinetId||$eq||5||$or||taxIdNumber||$cont||123;cabinetId||$eq||5',
    );
  });
});
