import { ConflictException } from '@nestjs/common';
import { RubricReportDataService, type AtomicMonthlyReportPublishDto } from './rubric-report-data.service';

const operation = (overrides: Partial<AtomicMonthlyReportPublishDto> = {}): AtomicMonthlyReportPublishDto => ({
  id: 'monthly-report-publish:configuration-1:1',
  idempotencyKey: 'configuration-1:1',
  configurationId: 'configuration-1',
  configurationVersion: 1,
  academicYearId: 'year-1',
  classId: 'class-1',
  reportMonth: 1,
  attempts: 0,
  snapshot: {
    id: 'snapshot-1', configurationId: 'configuration-1', academicYearId: 'year-1', classId: 'class-1',
    reportMonth: 1, reportYear: '2026-2027', version: 2, status: 'published', students: [],
  },
  publishedConfiguration: {
    id: 'configuration-1', academicYearId: 'year-1', classId: 'class-1', reportMonth: 1,
    reportYear: '2026-2027', version: 2, status: 'published', subjects: [],
  },
  createdAt: '2026-09-25T00:00:00.000Z',
  updatedAt: '2026-09-25T00:00:00.000Z',
  ...overrides,
});

describe('RubricReportDataService monthly report transaction', () => {
  const setup = (storedConfiguration: Record<string, unknown>, storedOperation?: Record<string, unknown>) => {
    const queryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ payload: storedConfiguration }),
    };
    const manager = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn().mockResolvedValue(storedOperation ? { payload: storedOperation } : null),
      query: jest.fn().mockResolvedValue([]),
    };
    const repo = {
      manager: {
        transaction: jest.fn(async (callback: (value: typeof manager) => unknown) => callback(manager)),
      },
    };
    return { service: new RubricReportDataService(repo as any), manager, queryBuilder, repo };
  };

  it('persists configuration, snapshot and operation with one multi-row statement', async () => {
    const { service, manager, queryBuilder, repo } = setup({ id: 'configuration-1', version: 1, status: 'ready' });
    const result = await service.publishMonthlyReport(operation());

    expect(repo.manager.transaction).toHaveBeenCalledTimes(1);
    expect(queryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(manager.query).toHaveBeenCalledTimes(1);
    const [, parameters] = manager.query.mock.calls[0];
    expect(parameters).toHaveLength(24);
    const payloads = [parameters[6], parameters[14], parameters[22]].map((value) => JSON.parse(value));
    expect(payloads.map((value) => value.status)).toEqual(['published', 'published', 'completed']);
    expect(result).toEqual(expect.objectContaining({
      data: expect.objectContaining({ operation: expect.objectContaining({ status: 'completed', step: 'completed', attempts: 1 }) }),
      meta: { idempotentReplay: false, attempts: 1 },
    }));
  });

  it('returns a completed idempotent operation without writing again', async () => {
    const completed = { ...operation(), status: 'completed', step: 'completed', attempts: 1 };
    const { service, manager } = setup({ id: 'configuration-1', version: 2, status: 'published' }, completed);
    const result = await service.publishMonthlyReport(operation());

    expect(manager.query).not.toHaveBeenCalled();
    expect(result.meta).toEqual({ idempotentReplay: true, attempts: 1 });
  });

  it('rejects a stale configuration after acquiring the publish lock', async () => {
    const { service, manager } = setup({ id: 'configuration-1', version: 3, status: 'ready' });
    await expect(service.publishMonthlyReport(operation())).rejects.toBeInstanceOf(ConflictException);
    expect(manager.query).not.toHaveBeenCalled();
  });
});
