import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { RubricEvaluationFinalScore } from './rubric-evaluation-final-score.entity';
import { RubricEvaluationFinalScoreService } from './rubric-evaluation-final-score.service';

describe('RubricEvaluationFinalScoreService', () => {
  let service: RubricEvaluationFinalScoreService;
  let repo: any;

  const score = {
    classId: 'class-1',
    studentId: 'student-1',
    subjectKey: 'subject-1',
    reportForm: 'form1',
    reportMonth: 1,
    reportYear: '2026',
    lessonFrom: 5,
    lessonTo: 8,
    finalScore: 8,
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((value: any) => value),
      merge: jest.fn((target: any, value: any) => ({ ...target, ...value })),
      save: jest.fn((value: any) => Promise.resolve(value)),
      upsert: jest.fn(() => Promise.resolve({} as any)),
      find: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [
        RubricEvaluationFinalScoreService,
        { provide: getRepositoryToken(RubricEvaluationFinalScore), useValue: repo },
      ],
    }).compile();
    service = module.get(RubricEvaluationFinalScoreService);
  });

  it('includes the lesson range when locating an existing score', async () => {
    repo.findOne!.mockResolvedValue(null);
    await service.save(score);
    expect(repo.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ lessonFrom: 5, lessonTo: 8 }),
    }));
  });

  it('upserts a class score batch in one repository call', async () => {
    await service.saveMany([score, { ...score, studentId: 'student-2' }]);
    expect(repo.upsert).toHaveBeenCalledTimes(1);
    expect((repo.upsert as jest.Mock).mock.calls[0][0]).toHaveLength(2);
  });

  it('stores the final report score as a whole number', async () => {
    await service.save({ ...score, finalScore: 6.25, averageScore: 6.25 });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      averageScore: 6.25,
      finalScore: 6,
    }));
  });

  it('caps final scores at the supplied report maximum and repairs the final cell', async () => {
    await service.save({
      ...score,
      averageScore: 10.55,
      finalScore: 11,
      reportMaximum: 10,
      finalCell: 'BE9',
      scoreCells: { BD9: '10.55', BE9: '11' },
    });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      averageScore: 10.55,
      finalScore: 10,
      finalCell: 'BE9',
      scoreCells: { BD9: '10.55', BE9: '10' },
    }));
  });

  it('rejects an invalid report maximum', async () => {
    await expect(service.save({ ...score, reportMaximum: 0 })).rejects.toThrow('reportMaximum must be greater than zero.');
  });
});
