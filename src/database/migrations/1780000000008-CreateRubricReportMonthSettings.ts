import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRubricReportMonthSettings1780000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rubric_report_month_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "class_id" character varying NOT NULL,
        "student_id" character varying NOT NULL DEFAULT '',
        "subject_id" character varying NOT NULL,
        "month" integer NOT NULL,
        "lesson_from" integer NOT NULL,
        "lesson_to" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rubric_report_month_settings_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_rubric_report_month_settings_scope" UNIQUE ("class_id", "student_id", "subject_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "rubric_report_month_settings"');
  }
}
