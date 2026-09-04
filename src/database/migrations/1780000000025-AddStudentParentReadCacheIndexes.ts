import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudentParentReadCacheIndexes1780000000025
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_enrollments_class_active_student"
        ON "enrollments" ("class_id", "is_active", "student_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_enrollments_class_active_student"',
    );
  }
}
