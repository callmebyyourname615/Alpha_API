// create-participation-score.dto.ts
export class ParticipationScoreItemDto {
  participationId: string;
  studentId: string;
  studentName: string;
  name: string;
  score: number;
}

export class CreateParticipationScoreDto {
  branchId: string;
  academicYearId: string;
  levelId: string;                // ← added
  classId: string;
  addedBy: string;
  date?: string;
  scores: ParticipationScoreItemDto[];
}