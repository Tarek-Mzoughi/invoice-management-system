import { DataSource } from 'typeorm';
import { resetDemoData } from './seed-reset';

function createDataSource(query: jest.Mock) {
  const queryRunner = {
    connect: jest.fn().mockResolvedValue(undefined),
    query,
    release: jest.fn().mockResolvedValue(undefined),
  };
  const dataSource = {
    createQueryRunner: jest.fn().mockReturnValue(queryRunner),
  } as unknown as DataSource;

  return { dataSource, queryRunner };
}

describe('resetDemoData', () => {
  it('uses current table names and restores foreign key checks', async () => {
    const query = jest.fn().mockResolvedValue({ affectedRows: 0 });
    const { dataSource, queryRunner } = createDataSource(query);

    await resetDemoData(dataSource);

    const statements = query.mock.calls.map(([sql]) => sql as string);
    expect(
      statements.some((sql) =>
        sql.includes('`article-customer-order-entry-tax`'),
      ),
    ).toBe(true);
    expect(
      statements.some((sql) => sql.includes('article_customer_order_entry')),
    ).toBe(false);
    expect(statements).toContain('SET FOREIGN_KEY_CHECKS = 0');
    expect(statements[statements.length - 1]).toBe(
      'SET FOREIGN_KEY_CHECKS = 1',
    );
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('fails when a mandatory cleanup query fails', async () => {
    const cleanupError = new Error('cleanup failed');
    const query = jest
      .fn()
      .mockResolvedValueOnce({ affectedRows: 0 })
      .mockRejectedValueOnce(cleanupError)
      .mockResolvedValueOnce({ affectedRows: 0 });
    const { dataSource, queryRunner } = createDataSource(query);

    await expect(resetDemoData(dataSource)).rejects.toBe(cleanupError);

    expect(query).toHaveBeenLastCalledWith('SET FOREIGN_KEY_CHECKS = 1');
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });
});
