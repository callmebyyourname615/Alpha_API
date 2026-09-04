import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentToRubricReportMonthSettings1780000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "rubric_report_month_settings"
      ADD COLUMN IF NOT EXISTS "comment" text NOT NULL DEFAULT ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "rubric_report_month_settings"
      DROP COLUMN IF EXISTS "comment"
    `);
  }
}
