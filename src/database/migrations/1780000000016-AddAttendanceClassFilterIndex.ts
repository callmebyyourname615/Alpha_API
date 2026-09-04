import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttendanceClassFilterIndex1780000000016
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_enrollments_class_student"
        ON "enrollments" ("class_id", "student_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_enrollments_class_student"');
  }
}
