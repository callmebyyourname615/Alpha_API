import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeacherHomeworkFeedIndexes1780000000021
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_teacher_homework_created"
        ON "teacher_homework" ("created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_teacher_homework_teaching_status_created"
        ON "teacher_homework" ("teaching_id", "status", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_teacher_homework_class_status_created"
        ON "teacher_homework" ("class_id", "status", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_teacher_homework_item_homework_sort"
        ON "teacher_homework_item" ("teacher_homework_id", "sort_order", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_teacher_homework_item_homework_sort"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_teacher_homework_class_status_created"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_teacher_homework_teaching_status_created"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_teacher_homework_created"');
  }
}
