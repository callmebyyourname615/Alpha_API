import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskPracticeFrequency1780000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tasks"
        ADD COLUMN IF NOT EXISTS "practice_frequency" integer,
        ADD COLUMN IF NOT EXISTS "practice_frequency_unit" character varying(8)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tasks"
        DROP COLUMN IF EXISTS "practice_frequency_unit",
        DROP COLUMN IF EXISTS "practice_frequency"
    `);
  }
}
