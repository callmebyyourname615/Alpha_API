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
    return { data: await this.service.findAll(), score };
  }

}
