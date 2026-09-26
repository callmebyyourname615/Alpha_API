import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import {
  RubricEvaluationFinalScoreService,
  type SaveRubricEvaluationFinalScoreDto,
} from './rubric-evaluation-final-score.service';

@Controller('rubric-evaluation-final-scores')
export class RubricEvaluationFinalScoreController {
  constructor(private readonly service: RubricEvaluationFinalScoreService) {}

  @Get()
  async getScores(@Query() query: Partial<SaveRubricEvaluationFinalScoreDto>) {
    return { data: await this.service.findAll(query) };
  }

  @Put()
  async saveScore(@Body() body: { score?: SaveRubricEvaluationFinalScoreDto }) {
    const score = await this.service.save(body?.score || (body as SaveRubricEvaluationFinalScoreDto));
    return { score };
  }

  @Put('bulk')
  async saveScores(@Body() body: { scores?: SaveRubricEvaluationFinalScoreDto[] }) {
    const scores = Array.isArray(body?.scores) ? body.scores : [];
    return { data: await this.service.saveMany(scores) };
  }
}
