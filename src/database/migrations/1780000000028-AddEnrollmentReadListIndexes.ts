import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnrollmentReadListIndexes1780000000028
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_enrollments_class_active_created"
        ON "enrollments" ("class_id", "is_active", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_enrollments_student_created"
        ON "enrollments" ("student_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_enrollments_student_active_created"
        ON "enrollments" ("student_id", "is_active", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_enrollments_branch_year_active_created"
        ON "enrollments" (
          "branch_id",
          "academic_year_id",
          "is_active",
          "created_at" DESC
        )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_enrollments_created_desc"
        ON "enrollments" ("created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_enrollments_created_desc"');
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_enrollments_branch_year_active_created"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_enrollments_student_active_created"',
    );
    await queryRunner.query('DROP INDEX IF EXISTS "idx_enrollments_student_created"');
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_enrollments_class_active_created"',
    );
  }
}
