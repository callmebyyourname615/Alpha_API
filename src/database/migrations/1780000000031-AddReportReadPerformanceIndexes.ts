import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReportReadPerformanceIndexes1780000000031 implements MigrationInterface {
  name = 'AddReportReadPerformanceIndexes1780000000031';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_examination_results_exam_active" ON "examination_results" ("examination_id") WHERE "is_deleted" = false`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_examination_results_student_active" ON "examination_results" ("student_id") WHERE "is_deleted" = false`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_examinations_class_year_active" ON "examinations" ("class_id", "academic_year_id") WHERE "is_deleted" = false`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_rubric_eval_final_report_lookup" ON "rubric_evaluation_final_scores" ("class_id", "report_month", "report_year")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rubric_eval_final_report_lookup"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_examinations_class_year_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_examination_results_student_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_examination_results_exam_active"`);
  }
}
