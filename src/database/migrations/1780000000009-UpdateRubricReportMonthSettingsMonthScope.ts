import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRubricReportMonthSettingsMonthScope1780000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "rubric_report_month_settings"
      DROP CONSTRAINT IF EXISTS "UQ_rubric_report_month_settings_scope"
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_rubric_report_month_settings_scope_month"
      ON "rubric_report_month_settings" ("class_id", "student_id", "subject_id", "month")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "UQ_rubric_report_month_settings_scope_month"');
    await queryRunner.query(`
      ALTER TABLE "rubric_report_month_settings"
      ADD CONSTRAINT "UQ_rubric_report_month_settings_scope"
      UNIQUE ("class_id", "student_id", "subject_id")
    `);
  }
}
