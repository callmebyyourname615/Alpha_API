import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppointmentReadPerformanceIndexes1780000000024
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_appointments_deleted_date"
        ON "appointments" ("is_deleted", "date" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_appointments_branch_deleted_date"
        ON "appointments" ("branch_id", "is_deleted", "date" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_appointments_creator_deleted_date"
        ON "appointments" ("auditor_id", "is_deleted", "date" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_appointment_persons_person_deleted_created"
        ON "appointment_persons" ("person_id", "is_deleted", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_appointment_persons_appointment_active"
        ON "appointment_persons" ("appointment_id", "is_deleted", "is_active")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_appointment_persons_appointment_active"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_appointment_persons_person_deleted_created"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_appointments_creator_deleted_date"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_appointments_branch_deleted_date"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_appointments_deleted_date"',
    );
  }
}
