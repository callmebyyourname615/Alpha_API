import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskFeedPerformanceIndexes1780000000020
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_created_desc"
        ON "tasks" ("created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_student_created"
        ON "tasks" ("student_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_files_task_deleted_created"
        ON "files" ("task_id", "is_deleted", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_files_task_deleted_created"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_tasks_student_created"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_tasks_created_desc"');
  }
}
