// update-participation-score.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateParticipationScoreDto } from './create-participation-score.dto';

export class UpdateParticipationScoreDto extends PartialType(CreateParticipationScoreDto) {}