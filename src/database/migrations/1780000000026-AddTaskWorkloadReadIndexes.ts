import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskWorkloadReadIndexes1780000000026
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_student_status"
        ON "tasks" ("student_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_assignment_student_ids_gin"
        ON "tasks" USING GIN ("assignment_student_ids")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_assignment_class_ids_gin"
        ON "tasks" USING GIN ("assignment_class_ids")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_tasks_assignment_class_ids_gin"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_tasks_assignment_student_ids_gin"',
    );
    await queryRunner.query('DROP INDEX IF EXISTS "idx_tasks_student_status"');
  }
}
