import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttendanceListPerformanceIndexes1780000000018
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ATTENDANCE_STUDENT_DATE"
        ON "attendances" ("student_id", "attendance_date")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_attendances_date_created_desc"
        ON "attendances" ("attendance_date" DESC, "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_attendances_date_student"
        ON "attendances" ("attendance_date", "student_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_attendances_student_date_created"
        ON "attendances" ("student_id", "attendance_date" DESC, "created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_attendances_student_date_created"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_attendances_date_student"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_attendances_date_created_desc"');
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND indexname = 'UQ_ATTENDANCE_STUDENT_DATE'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'UQ_ATTENDANCE_STUDENT_DATE'
        ) THEN
          EXECUTE 'DROP INDEX "UQ_ATTENDANCE_STUDENT_DATE"';
        END IF;
      END $$;
    `);
  }
}
