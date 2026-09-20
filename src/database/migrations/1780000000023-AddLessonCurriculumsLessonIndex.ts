import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLessonCurriculumsLessonIndex1780000000023
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_lesson_curriculums_lesson_curriculum"
        ON "lesson_curriculums" ("lesson_id", "curriculum_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_lesson_curriculums_lesson_curriculum"',
    );
  }
}
