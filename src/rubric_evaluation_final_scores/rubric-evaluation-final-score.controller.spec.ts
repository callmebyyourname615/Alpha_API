import { RubricEvaluationFinalScoreController } from './rubric-evaluation-final-score.controller';
import { RubricEvaluationFinalScoreService } from './rubric-evaluation-final-score.service';

describe('RubricEvaluationFinalScoreController', () => {
  it('returns only the saved score without reading the complete score table', async () => {
    const saved = { id: 'score-1' };
    const service = {
      save: jest.fn().mockResolvedValue(saved),
      findAll: jest.fn(),
    } as unknown as RubricEvaluationFinalScoreService;
    const controller = new RubricEvaluationFinalScoreController(service);

    await expect(controller.saveScore({ score: {
      studentId: 'student-1', subjectKey: 'subject-1', reportForm: 'form1', reportMonth: 1,
    } })).resolves.toEqual({ score: saved });
    expect(service.findAll).not.toHaveBeenCalled();
  });
});
